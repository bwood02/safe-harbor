using System.Data.Common;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Models;

namespace backend.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize(Roles = AuthRoles.Admin)]
public class MlController : ControllerBase
{
    private readonly MainAppDbContext _context;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _configuration;
    private readonly ILogger<MlController> _logger;

    public MlController(
        MainAppDbContext context,
        IHttpClientFactory httpClientFactory,
        IConfiguration configuration,
        ILogger<MlController> logger)
    {
        _context = context;
        _httpClientFactory = httpClientFactory;
        _configuration = configuration;
        _logger = logger;
    }

    private string? MlBaseUrl => _configuration["Ml:BaseUrl"]?.Trim();
    private string? MlApiKey => _configuration["Ml:ApiKey"]?.Trim();

    /// <summary>Host only (e.g. safe-harbor-fastapi-....azurewebsites.net) for admin diagnostics — avoids relying on Azure Log Stream.</summary>
    private static string? MlBaseUrlHostOnly(string? mlBaseUrl)
    {
        var t = mlBaseUrl?.Trim();
        if (string.IsNullOrWhiteSpace(t)) return null;
        return Uri.TryCreate(t, UriKind.Absolute, out var u) ? u.Host : null;
    }

    private HttpClient? CreateMlClient()
    {
        var baseUrl = MlBaseUrl;
        if (string.IsNullOrWhiteSpace(baseUrl))
            return null;
        var client = _httpClientFactory.CreateClient("MlApi");
        return client;
    }

    [HttpGet("deployment-status")]
    public async Task<ActionResult<object>> GetDeploymentStatus(CancellationToken ct)
    {
        var client = CreateMlClient();
        if (client == null)
        {
            return Ok(new
            {
                mlServiceConfigured = false,
                message = "Ml:BaseUrl is not set",
                mlBaseUrlHost = (string?)null,
                mlApiKeyConfigured = !string.IsNullOrEmpty(MlApiKey),
                checkedAtUtc = DateTime.UtcNow,
                pipelines = PipelineMeta.All.Select(p => new
                {
                    p.Id,
                    p.Notebook,
                    p.UiPath,
                    p.DotnetRoute,
                    p.MlApiRoute,
                    mlModelLoaded = false,
                    error = (string?)null,
                }),
            });
        }

        try
        {
            using var healthRes = await client.GetAsync("health", ct);
            var modelsRes = await client.GetAsync("models", ct);
            var healthOk = healthRes.IsSuccessStatusCode;
            JsonDocument? modelsDoc = null;
            if (modelsRes.IsSuccessStatusCode)
                modelsDoc = await JsonDocument.ParseAsync(await modelsRes.Content.ReadAsStreamAsync(ct), cancellationToken: ct);

            Dictionary<string, bool>? statusMap = null;
            if (modelsDoc != null && modelsDoc.RootElement.TryGetProperty("status", out var st))
            {
                statusMap = new Dictionary<string, bool>();
                foreach (var prop in st.EnumerateObject())
                    statusMap[prop.Name] = prop.Value.GetBoolean();
            }

            var pipelines = PipelineMeta.All.Select(p =>
            {
                var loadedFlag = statusMap != null && statusMap.TryGetValue(p.ModelKey, out var v) && v;
                return new
                {
                    p.Id,
                    p.Notebook,
                    p.UiPath,
                    p.DotnetRoute,
                    p.MlApiRoute,
                    mlModelLoaded = loadedFlag,
                    error = (string?)null,
                };
            }).ToList();

            return Ok(new
            {
                mlServiceConfigured = true,
                mlReachable = healthOk,
                mlBaseUrlHost = MlBaseUrlHostOnly(MlBaseUrl),
                mlApiKeyConfigured = !string.IsNullOrEmpty(MlApiKey),
                checkedAtUtc = DateTime.UtcNow,
                pipelines,
            });
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "ML health check failed");
            return Ok(new
            {
                mlServiceConfigured = true,
                mlReachable = false,
                message = ex.Message,
                mlBaseUrlHost = MlBaseUrlHostOnly(MlBaseUrl),
                mlApiKeyConfigured = !string.IsNullOrEmpty(MlApiKey),
                checkedAtUtc = DateTime.UtcNow,
                pipelines = PipelineMeta.All.Select(p => new
                {
                    p.Id,
                    p.Notebook,
                    p.UiPath,
                    p.DotnetRoute,
                    p.MlApiRoute,
                    mlModelLoaded = false,
                    error = (string?)ex.Message,
                }),
            });
        }
    }

    public class DonorChurnScoreRow
    {
        public int SupporterId { get; set; }
        public double ChurnProbability { get; set; }
        public string Tier { get; set; } = "";
        public string RecommendedAction { get; set; } = "";
        public string? Error { get; set; }
    }

    [HttpGet("donor-churn-scores")]
    public async Task<ActionResult<IReadOnlyList<DonorChurnScoreRow>>> GetDonorChurnScores(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 25,
        [FromQuery] string? asOf = null,
        CancellationToken ct = default)
    {
        try
        {
            return await GetDonorChurnScoresCore(page, pageSize, asOf, ct);
        }
        catch (DbException ex)
        {
            _logger.LogWarning(ex, "GetDonorChurnScores database error (often transient Azure SQL connectivity)");
            return Ok(Array.Empty<DonorChurnScoreRow>());
        }
    }

    private async Task<ActionResult<IReadOnlyList<DonorChurnScoreRow>>> GetDonorChurnScoresCore(
        int page,
        int pageSize,
        string? asOf,
        CancellationToken ct)
    {
        var client = CreateMlClient();
        if (client == null)
            return Ok(Array.Empty<DonorChurnScoreRow>());

        if (page < 1) page = 1;
        if (pageSize < 1 || pageSize > 100) pageSize = 25;

        DateOnly asOfDate;
        if (!string.IsNullOrWhiteSpace(asOf))
        {
            asOfDate = DateOnly.Parse(asOf);
        }
        else
        {
            var maxDonationDate = await _context.Donations.AsNoTracking()
                .Where(d => d.DonationDate != null)
                .MaxAsync(d => d.DonationDate, ct);

            if (!maxDonationDate.HasValue)
                return Ok(Array.Empty<DonorHighValueScoreRow>());

            asOfDate = new DateOnly(maxDonationDate.Value.Year, maxDonationDate.Value.Month, 1);
        }

        var supporters = await _context.Supporters
            .AsNoTracking()
            .OrderBy(s => s.DisplayName)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(s => new
            {
                s.SupporterId,
                s.AcquisitionChannel,
                s.RelationshipType,
                s.Region,
                s.Country,
                s.SupporterType,
            })
            .ToListAsync(ct);

        if (supporters.Count == 0)
            return Ok(Array.Empty<DonorChurnScoreRow>());

        var ids = supporters.Select(s => s.SupporterId).ToList();
        var donations = await _context.Donations
            .AsNoTracking()
            .Where(d => ids.Contains(d.SupporterId) && d.DonationDate != null)
            .OrderBy(d => d.DonationDate)
            .Select(d => new
            {
                d.SupporterId,
                d.DonationDate,
                d.EstimatedValue,
                d.CampaignName,
            })
            .ToListAsync(ct);

        var payload = new
        {
            as_of = asOfDate.ToString("yyyy-MM-dd"),
            supporters = supporters.Select(s => new
            {
                supporter_id = s.SupporterId,
                acquisition_channel = s.AcquisitionChannel ?? "",
                relationship_type = s.RelationshipType ?? "",
                region = s.Region ?? "",
                country = s.Country ?? "",
                supporter_type = s.SupporterType ?? "",
            }),
            donations = donations.Select(d => new
            {
                supporter_id = d.SupporterId,
                donation_date = d.DonationDate!.Value.ToString("yyyy-MM-dd"),
                estimated_value = d.EstimatedValue,
                campaign_name = d.CampaignName,
            }),
        };

        using var req = new HttpRequestMessage(HttpMethod.Post, "predict/donor-churn")
        {
            Content = JsonContent.Create(payload),
        };
        if (!string.IsNullOrEmpty(MlApiKey))
            req.Headers.TryAddWithoutValidation("X-ML-API-Key", MlApiKey);

        using var res = await client.SendAsync(req, ct);
        if (!res.IsSuccessStatusCode)
        {
            var body = await res.Content.ReadAsStringAsync(ct);
            _logger.LogWarning("ML donor-churn failed: {Status} {Body}", res.StatusCode, body);
            return Ok(Array.Empty<DonorChurnScoreRow>());
        }

        await using var stream = await res.Content.ReadAsStreamAsync(ct);
        var opts = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
        var scores = await JsonSerializer.DeserializeAsync<List<DonorChurnScoreDto>>(stream, opts, ct)
                     ?? new List<DonorChurnScoreDto>();

        var rows = scores.Select(s => new DonorChurnScoreRow
        {
            SupporterId = s.SupporterId,
            ChurnProbability = s.ChurnProbability,
            Tier = s.Tier ?? "",
            RecommendedAction = s.RecommendedAction ?? "",
            Error = s.Error,
        }).ToList();

        return Ok(rows);
    }

    public class ResidentWellbeingScoreRow
    {
        public int ResidentId { get; set; }
        public double PredictedWellbeingNext { get; set; }
        public double WellbeingLag { get; set; }
        public string? Error { get; set; }
    }

    /// <summary>
    /// Loads caseload tables from SQL, forwards to FastAPI <c>POST /predict/resident-wellbeing</c> (same pipeline as training).
    /// </summary>
    [HttpGet("resident-wellbeing-scores")]
    public async Task<ActionResult<IReadOnlyList<ResidentWellbeingScoreRow>>> GetResidentWellbeingScores(
        [FromQuery] string? asOf = null,
        CancellationToken ct = default)
    {
        try
        {
            return await GetResidentWellbeingScoresCore(asOf, ct);
        }
        catch (DbException ex)
        {
            _logger.LogWarning(ex, "GetResidentWellbeingScores database error");
            return Ok(Array.Empty<ResidentWellbeingScoreRow>());
        }
    }

    private async Task<ActionResult<IReadOnlyList<ResidentWellbeingScoreRow>>> GetResidentWellbeingScoresCore(
        string? asOf,
        CancellationToken ct)
    {
        var client = CreateMlClient();
        if (client == null)
            return Ok(Array.Empty<ResidentWellbeingScoreRow>());

        if (!await _context.HealthWellbeingRecords.AsNoTracking().AnyAsync(ct))
            return Ok(Array.Empty<ResidentWellbeingScoreRow>());

        DateOnly asOfDate;
        if (!string.IsNullOrWhiteSpace(asOf))
            asOfDate = DateOnly.Parse(asOf);
        else
        {
            var maxD = await _context.HealthWellbeingRecords.AsNoTracking()
                .MaxAsync(h => h.RecordDate, ct);
            asOfDate = new DateOnly(maxD.Year, maxD.Month, 1);
        }

        var payload = await ResidentWellbeingPayload.BuildAsync(_context, asOfDate, ct);

        using var req = new HttpRequestMessage(HttpMethod.Post, "predict/resident-wellbeing")
        {
            Content = JsonContent.Create(payload),
        };
        if (!string.IsNullOrEmpty(MlApiKey))
            req.Headers.TryAddWithoutValidation("X-ML-API-Key", MlApiKey);

        using var res = await client.SendAsync(req, ct);
        if (!res.IsSuccessStatusCode)
        {
            var body = await res.Content.ReadAsStringAsync(ct);
            _logger.LogWarning("ML resident-wellbeing failed: {Status} {Body}", res.StatusCode, body);
            return Ok(Array.Empty<ResidentWellbeingScoreRow>());
        }

        await using var stream = await res.Content.ReadAsStreamAsync(ct);
        var opts = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
        var scores = await JsonSerializer.DeserializeAsync<List<ResidentWellbeingScoreDto>>(stream, opts, ct)
                     ?? new List<ResidentWellbeingScoreDto>();

        var rows = scores.Select(s => new ResidentWellbeingScoreRow
        {
            ResidentId = s.ResidentId,
            PredictedWellbeingNext = s.PredictedWellbeingNext,
            WellbeingLag = s.WellbeingLag,
            Error = s.Error,
        }).ToList();

        return Ok(rows);
    }

    public class DonorHighValueScoreRow
    {
        public int SupporterId { get; set; }
        public double HighValueProbability { get; set; }
        public string? Error { get; set; }
    }

    [HttpGet("donor-high-value-scores")]
    public async Task<ActionResult<IReadOnlyList<DonorHighValueScoreRow>>> GetDonorHighValueScores(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 25,
        [FromQuery] string? asOf = null,
        CancellationToken ct = default)
    {
        try
        {
            return await GetDonorHighValueScoresCore(page, pageSize, asOf, ct);
        }
        catch (DbException ex)
        {
            _logger.LogWarning(ex, "GetDonorHighValueScores database error");
            return Ok(Array.Empty<DonorHighValueScoreRow>());
        }
    }

    private async Task<ActionResult<IReadOnlyList<DonorHighValueScoreRow>>> GetDonorHighValueScoresCore(
        int page,
        int pageSize,
        string? asOf,
        CancellationToken ct)
    {
        var client = CreateMlClient();
        if (client == null)
            return Ok(Array.Empty<DonorHighValueScoreRow>());

        if (page < 1) page = 1;
        if (pageSize < 1 || pageSize > 100) pageSize = 25;

        var asOfDate = string.IsNullOrWhiteSpace(asOf)
            ? DateOnly.FromDateTime(DateTime.UtcNow)
            : DateOnly.Parse(asOf);

        var supporterIds = await _context.Supporters.AsNoTracking()
            .OrderBy(s => s.DisplayName)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(s => s.SupporterId)
            .ToListAsync(ct);

        if (supporterIds.Count == 0)
            return Ok(Array.Empty<DonorHighValueScoreRow>());

        var payload = await DonorHighValuePayload.BuildAsync(_context, asOfDate, supporterIds, ct);

        using var req = new HttpRequestMessage(HttpMethod.Post, "predict/donor-high-value")
        {
            Content = JsonContent.Create(payload),
        };
        if (!string.IsNullOrEmpty(MlApiKey))
            req.Headers.TryAddWithoutValidation("X-ML-API-Key", MlApiKey);

        using var res = await client.SendAsync(req, ct);
        if (!res.IsSuccessStatusCode)
        {
            var body = await res.Content.ReadAsStringAsync(ct);
            _logger.LogWarning("ML donor-high-value failed: {Status} {Body}", res.StatusCode, body);
            return Ok(Array.Empty<DonorHighValueScoreRow>());
        }

        await using var stream = await res.Content.ReadAsStreamAsync(ct);
        var opts = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
        var scores = await JsonSerializer.DeserializeAsync<List<DonorHighValueScoreDto>>(stream, opts, ct)
                     ?? new List<DonorHighValueScoreDto>();

        var rows = scores.Select(s => new DonorHighValueScoreRow
        {
            SupporterId = s.SupporterId,
            HighValueProbability = s.HighValueProbability,
            Error = s.Error,
        }).ToList();

        return Ok(rows);
    }

    public class EarlyWarningScoreRow
    {
        public int ResidentId { get; set; }
        public double StruggleProbability { get; set; }
        public string? Error { get; set; }
    }

    [HttpGet("early-warning-scores")]
    public async Task<ActionResult<IReadOnlyList<EarlyWarningScoreRow>>> GetEarlyWarningScores(
        [FromQuery] string? asOf = null,
        CancellationToken ct = default)
    {
        try
        {
            return await GetEarlyWarningScoresCore(asOf, ct);
        }
        catch (DbException ex)
        {
            _logger.LogWarning(ex, "GetEarlyWarningScores database error");
            return Ok(Array.Empty<EarlyWarningScoreRow>());
        }
    }

    private async Task<ActionResult<IReadOnlyList<EarlyWarningScoreRow>>> GetEarlyWarningScoresCore(
        string? asOf,
        CancellationToken ct)
    {
        var client = CreateMlClient();
        if (client == null)
            return Ok(Array.Empty<EarlyWarningScoreRow>());

        if (!await _context.HealthWellbeingRecords.AsNoTracking().AnyAsync(ct))
            return Ok(Array.Empty<EarlyWarningScoreRow>());

        DateOnly asOfDate;
        if (!string.IsNullOrWhiteSpace(asOf))
            asOfDate = DateOnly.Parse(asOf);
        else
        {
            var maxD = await _context.HealthWellbeingRecords.AsNoTracking()
                .MaxAsync(h => h.RecordDate, ct);
            asOfDate = new DateOnly(maxD.Year, maxD.Month, 1);
        }

        var payload = await ResidentWellbeingPayload.BuildAsync(_context, asOfDate, ct);

        using var req = new HttpRequestMessage(HttpMethod.Post, "predict/early-warning")
        {
            Content = JsonContent.Create(payload),
        };
        if (!string.IsNullOrEmpty(MlApiKey))
            req.Headers.TryAddWithoutValidation("X-ML-API-Key", MlApiKey);

        using var res = await client.SendAsync(req, ct);
        if (!res.IsSuccessStatusCode)
        {
            var body = await res.Content.ReadAsStringAsync(ct);
            _logger.LogWarning("ML early-warning failed: {Status} {Body}", res.StatusCode, body);
            return Ok(Array.Empty<EarlyWarningScoreRow>());
        }

        await using var stream = await res.Content.ReadAsStreamAsync(ct);
        var opts = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
        var scores = await JsonSerializer.DeserializeAsync<List<EarlyWarningScoreDto>>(stream, opts, ct)
                     ?? new List<EarlyWarningScoreDto>();

        var rows = scores.Select(s => new EarlyWarningScoreRow
        {
            ResidentId = s.ResidentId,
            StruggleProbability = s.StruggleProbability,
            Error = s.Error,
        }).ToList();

        return Ok(rows);
    }

    public class ReintegrationReadinessScoreRow
    {
        public int ResidentId { get; set; }
        public double ReadinessProbability { get; set; }
        public string? Error { get; set; }
    }

    [HttpGet("reintegration-readiness-scores")]
    public async Task<ActionResult<IReadOnlyList<ReintegrationReadinessScoreRow>>> GetReintegrationReadinessScores(
        [FromQuery] string? asOf = null,
        CancellationToken ct = default)
    {
        try
        {
            return await GetReintegrationReadinessScoresCore(asOf, ct);
        }
        catch (DbException ex)
        {
            _logger.LogWarning(ex, "GetReintegrationReadinessScores database error");
            return Ok(Array.Empty<ReintegrationReadinessScoreRow>());
        }
    }

    private async Task<ActionResult<IReadOnlyList<ReintegrationReadinessScoreRow>>> GetReintegrationReadinessScoresCore(
        string? asOf,
        CancellationToken ct)
    {
        var client = CreateMlClient();
        if (client == null)
            return Ok(Array.Empty<ReintegrationReadinessScoreRow>());

        if (!await _context.HealthWellbeingRecords.AsNoTracking().AnyAsync(ct))
            return Ok(Array.Empty<ReintegrationReadinessScoreRow>());

        DateOnly asOfDate;
        if (!string.IsNullOrWhiteSpace(asOf))
            asOfDate = DateOnly.Parse(asOf);
        else
        {
            var maxD = await _context.HealthWellbeingRecords.AsNoTracking()
                .MaxAsync(h => h.RecordDate, ct);
            asOfDate = new DateOnly(maxD.Year, maxD.Month, 1);
        }

        var payload = await ResidentWellbeingPayload.BuildAsync(_context, asOfDate, ct);

        using var req = new HttpRequestMessage(HttpMethod.Post, "predict/reintegration-readiness")
        {
            Content = JsonContent.Create(payload),
        };
        if (!string.IsNullOrEmpty(MlApiKey))
            req.Headers.TryAddWithoutValidation("X-ML-API-Key", MlApiKey);

        using var res = await client.SendAsync(req, ct);
        if (!res.IsSuccessStatusCode)
        {
            var body = await res.Content.ReadAsStringAsync(ct);
            _logger.LogWarning("ML reintegration-readiness failed: {Status} {Body}", res.StatusCode, body);
            return Ok(Array.Empty<ReintegrationReadinessScoreRow>());
        }

        await using var stream = await res.Content.ReadAsStreamAsync(ct);
        var opts = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
        var scores = await JsonSerializer.DeserializeAsync<List<ReintegrationReadinessScoreDto>>(stream, opts, ct)
                     ?? new List<ReintegrationReadinessScoreDto>();

        var rows = scores.Select(s => new ReintegrationReadinessScoreRow
        {
            ResidentId = s.ResidentId,
            ReadinessProbability = s.ReadinessProbability,
            Error = s.Error,
        }).ToList();

        return Ok(rows);
    }

    public class SocialEngagementScoreRow
    {
        public string Month { get; set; } = "";
        public double PredictedNextMonetary { get; set; }
        public string? Error { get; set; }
    }

    [HttpGet("social-engagement-forecast")]
    public async Task<ActionResult<IReadOnlyList<SocialEngagementScoreRow>>> GetSocialEngagementForecast(
        [FromQuery] string? asOf = null,
        CancellationToken ct = default)
    {
        try
        {
            return await GetSocialEngagementForecastCore(asOf, ct);
        }
        catch (DbException ex)
        {
            _logger.LogWarning(ex, "GetSocialEngagementForecast database error");
            return Ok(Array.Empty<SocialEngagementScoreRow>());
        }
    }

    private async Task<ActionResult<IReadOnlyList<SocialEngagementScoreRow>>> GetSocialEngagementForecastCore(
        string? asOf,
        CancellationToken ct)
    {
        var client = CreateMlClient();
        if (client == null)
            return Ok(Array.Empty<SocialEngagementScoreRow>());

        if (!await _context.SocialMediaPosts.AsNoTracking().AnyAsync(ct))
            return Ok(Array.Empty<SocialEngagementScoreRow>());

        DateOnly asOfDate;
        if (!string.IsNullOrWhiteSpace(asOf))
            asOfDate = DateOnly.Parse(asOf);
        else
        {
            var maxDt = await _context.SocialMediaPosts.AsNoTracking()
                .MaxAsync(p => p.CreatedAt, ct);
            asOfDate = DateOnly.FromDateTime(maxDt.ToUniversalTime().Date);
            asOfDate = new DateOnly(asOfDate.Year, asOfDate.Month, 1);
        }

        var payload = await SocialEngagementPayload.BuildAsync(_context, asOfDate, ct);

        using var req = new HttpRequestMessage(HttpMethod.Post, "predict/social-engagement-donations")
        {
            Content = JsonContent.Create(payload),
        };
        if (!string.IsNullOrEmpty(MlApiKey))
            req.Headers.TryAddWithoutValidation("X-ML-API-Key", MlApiKey);

        using var res = await client.SendAsync(req, ct);
        if (!res.IsSuccessStatusCode)
        {
            var body = await res.Content.ReadAsStringAsync(ct);
            _logger.LogWarning("ML social-engagement failed: {Status} {Body}", res.StatusCode, body);
            return Ok(Array.Empty<SocialEngagementScoreRow>());
        }

        await using var stream = await res.Content.ReadAsStreamAsync(ct);
        var opts = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
        var scores = await JsonSerializer.DeserializeAsync<List<SocialEngagementScoreDto>>(stream, opts, ct)
                     ?? new List<SocialEngagementScoreDto>();

        var rows = scores.Select(s => new SocialEngagementScoreRow
        {
            Month = s.Month,
            PredictedNextMonetary = s.PredictedNextMonetary,
            Error = s.Error,
        }).ToList();

        return Ok(rows);
    }

    private sealed class ResidentWellbeingScoreDto
    {
        [JsonPropertyName("resident_id")]
        public int ResidentId { get; set; }

        [JsonPropertyName("predicted_wellbeing_next")]
        public double PredictedWellbeingNext { get; set; }

        [JsonPropertyName("wellbeing_lag")]
        public double WellbeingLag { get; set; }

        [JsonPropertyName("error")]
        public string? Error { get; set; }
    }

    private sealed class DonorChurnScoreDto
    {
        [JsonPropertyName("supporter_id")]
        public int SupporterId { get; set; }

        [JsonPropertyName("churn_probability")]
        public double ChurnProbability { get; set; }

        [JsonPropertyName("tier")]
        public string? Tier { get; set; }

        [JsonPropertyName("recommended_action")]
        public string? RecommendedAction { get; set; }

        [JsonPropertyName("error")]
        public string? Error { get; set; }
    }

    private sealed class DonorHighValueScoreDto
    {
        [JsonPropertyName("supporter_id")]
        public int SupporterId { get; set; }

        [JsonPropertyName("high_value_probability")]
        public double HighValueProbability { get; set; }

        [JsonPropertyName("error")]
        public string? Error { get; set; }
    }

    private sealed class EarlyWarningScoreDto
    {
        [JsonPropertyName("resident_id")]
        public int ResidentId { get; set; }

        [JsonPropertyName("struggle_probability")]
        public double StruggleProbability { get; set; }

        [JsonPropertyName("error")]
        public string? Error { get; set; }
    }

    private sealed class ReintegrationReadinessScoreDto
    {
        [JsonPropertyName("resident_id")]
        public int ResidentId { get; set; }

        [JsonPropertyName("readiness_probability")]
        public double ReadinessProbability { get; set; }

        [JsonPropertyName("error")]
        public string? Error { get; set; }
    }

    private sealed class SocialEngagementScoreDto
    {
        [JsonPropertyName("month")]
        public string Month { get; set; } = "";

        [JsonPropertyName("predicted_next_monetary")]
        public double PredictedNextMonetary { get; set; }

        [JsonPropertyName("error")]
        public string? Error { get; set; }
    }

    private static class PipelineMeta
    {
        public sealed record Entry(string Id, string Notebook, string UiPath, string DotnetRoute, string MlApiRoute, string ModelKey);

        public static readonly Entry[] All =
        {
            new("donor_churn", "donor_churn_pipeline.ipynb", "/donors", "GET /api/Ml/donor-churn-scores", "POST /predict/donor-churn", "donor_churn"),
            new("donor_high_value", "high_value_donor_profiles.ipynb", "/donors", "GET /api/Ml/donor-high-value-scores", "POST /predict/donor-high-value", "donor_high_value"),
            new("resident_wellbeing", "resident_wellbeing_next_month.ipynb", "/caseload", "GET /api/Ml/resident-wellbeing-scores", "POST /predict/resident-wellbeing", "resident_wellbeing"),
            new("early_warning", "early_warning_incident_next_month.ipynb", "/caseload", "GET /api/Ml/early-warning-scores", "POST /predict/early-warning", "early_warning"),
            new("reintegration", "reintegration_readiness_next_month.ipynb", "/caseload", "GET /api/Ml/reintegration-readiness-scores", "POST /predict/reintegration-readiness", "reintegration"),
            new("social_engagement", "social_media_engagement_to_donations.ipynb", "/social-media", "GET /api/Ml/social-engagement-forecast", "POST /predict/social-engagement-donations", "social_engagement"),
        };
    }
}
