using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Models;
using CurrencyToPhp = global::backend.CurrencyToPhp;

namespace backend.Controllers;

[Route("api/[controller]")]
[ApiController]
public class AdminDashboardController : ControllerBase
{
    private readonly MainAppDbContext _context;

    public AdminDashboardController(MainAppDbContext context)
    {
        _context = context;
    }

    public record KpisDto(
        int ActiveResidents,
        double RecentDonationsAmount,
        int UpcomingReviews,
        int AvgProgress,
        double AvgHealthScore,
        int IncidentCount);

    public record SafehouseDto(
        int SafehouseId,
        string Name,
        string Status,
        int Occupied,
        int Capacity,
        int Pct,
        double AvgHealthScore,
        int AvgEducationProgress,
        int IncidentCount);

    public record WeeklyActivityDto(
        string Day,
        string Date,
        int ProcessRecordings,
        int HomeVisitations,
        int Donations,
        int Total);

    public record RecentActivityDto(
        string Title,
        string Meta,
        string Kind,
        DateTime Timestamp);

    public record UpcomingReviewDto(
        int PlanId,
        int ResidentId,
        string ResidentCode,
        string PlanCategory,
        DateOnly CaseConferenceDate);

    public record PagedResultDto<T>(
        List<T> Items,
        int TotalCount,
        int Page,
        int PageSize,
        int TotalPages);

    // Anchor "recent" windows to the most recent date with any activity in the DB,
    // not wall-clock today. The seed data is historical so this makes the dashboard
    // render something meaningful even when real-world time has moved past the data.
    private async Task<DateOnly> GetAnchorDateAsync()
    {
        var prMax = await _context.ProcessRecordings.AnyAsync()
            ? await _context.ProcessRecordings.MaxAsync(p => p.SessionDate)
            : (DateOnly?)null;
        var hvMax = await _context.HomeVisitations.AnyAsync()
            ? await _context.HomeVisitations.MaxAsync(h => h.VisitDate)
            : (DateOnly?)null;
        var dnMax = await _context.Donations.Where(d => d.DonationDate != null).AnyAsync()
            ? await _context.Donations.Where(d => d.DonationDate != null).MaxAsync(d => d.DonationDate!.Value)
            : (DateOnly?)null;

        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        // Clamp to today so future-dated seed data doesn't anchor charts to the future.
        var candidates = new[] { prMax, hvMax, dnMax }
            .Where(d => d.HasValue)
            .Select(d => d!.Value)
            .Where(d => d <= today)
            .ToList();
        return candidates.Any() ? candidates.Max() : today;
    }

    /// <summary>Display line for donation rows in activity feeds (original currency, not converted).</summary>
    private static string FormatDonationMetaLine(double estimatedValue, string? currencyCode, string? campaignName)
    {
        var code = string.IsNullOrWhiteSpace(currencyCode) ? "PHP" : currencyCode.Trim().ToUpperInvariant();
        var amountPart = code == "PHP"
            ? $"₱{estimatedValue:N0}"
            : $"{code} {estimatedValue:N0}";
        return amountPart + (campaignName != null ? $" • {campaignName}" : "");
    }

    private sealed class ActiveResidentDerivedMetrics
    {
        public required Dictionary<int, int> ActiveResidentCountsBySafehouse { get; init; }
        public required Dictionary<int, double> AvgEducationBySafehouse { get; init; }
        public required Dictionary<int, double> AvgHealthBySafehouse { get; init; }
        public required double AvgEducationOverall { get; init; }
        public required double AvgHealthOverall { get; init; }
    }

    /// <summary>
    /// For active residents only, computes latest-per-resident education/health values and
    /// returns both overall averages and per-safehouse averages.
    /// </summary>
    private async Task<ActiveResidentDerivedMetrics> GetActiveResidentDerivedMetricsAsync()
    {
        var activeResidents = await _context.Residents
            .AsNoTracking()
            .Where(r => r.CaseStatus == "Active")
            .Select(r => new { r.ResidentId, r.SafehouseId })
            .ToListAsync();

        var activeResidentCountsBySafehouse = activeResidents
            .GroupBy(r => r.SafehouseId)
            .ToDictionary(g => g.Key, g => g.Count());

        if (activeResidents.Count == 0)
        {
            return new ActiveResidentDerivedMetrics
            {
                ActiveResidentCountsBySafehouse = activeResidentCountsBySafehouse,
                AvgEducationBySafehouse = new Dictionary<int, double>(),
                AvgHealthBySafehouse = new Dictionary<int, double>(),
                AvgEducationOverall = 0,
                AvgHealthOverall = 0,
            };
        }

        var residentToSafehouse = activeResidents.ToDictionary(r => r.ResidentId, r => r.SafehouseId);
        var activeResidentIds = activeResidents.Select(r => r.ResidentId).ToList();

        var latestEducationByResident = (await _context.EducationRecords
            .AsNoTracking()
            .Where(e => activeResidentIds.Contains(e.ResidentId))
            .Select(e => new { e.ResidentId, e.RecordDate, e.EducationRecordId, e.ProgressPercent })
            .ToListAsync())
            .GroupBy(e => e.ResidentId)
            .Select(g => g
                .OrderByDescending(x => x.RecordDate)
                .ThenByDescending(x => x.EducationRecordId)
                .First())
            .ToList();

        var latestHealthByResident = (await _context.HealthWellbeingRecords
            .AsNoTracking()
            .Where(h => activeResidentIds.Contains(h.ResidentId))
            .Select(h => new { h.ResidentId, h.RecordDate, h.HealthRecordId, h.GeneralHealthScore })
            .ToListAsync())
            .GroupBy(h => h.ResidentId)
            .Select(g => g
                .OrderByDescending(x => x.RecordDate)
                .ThenByDescending(x => x.HealthRecordId)
                .First())
            .ToList();

        var avgEducationBySafehouse = latestEducationByResident
            .GroupBy(e => residentToSafehouse[e.ResidentId])
            .ToDictionary(g => g.Key, g => g.Average(x => x.ProgressPercent));

        var avgHealthBySafehouse = latestHealthByResident
            .GroupBy(h => residentToSafehouse[h.ResidentId])
            .ToDictionary(g => g.Key, g => g.Average(x => x.GeneralHealthScore));

        return new ActiveResidentDerivedMetrics
        {
            ActiveResidentCountsBySafehouse = activeResidentCountsBySafehouse,
            AvgEducationBySafehouse = avgEducationBySafehouse,
            AvgHealthBySafehouse = avgHealthBySafehouse,
            AvgEducationOverall = latestEducationByResident.Count > 0
                ? latestEducationByResident.Average(x => x.ProgressPercent)
                : 0,
            AvgHealthOverall = latestHealthByResident.Count > 0
                ? latestHealthByResident.Average(x => x.GeneralHealthScore)
                : 0,
        };
    }

    /// <summary>
    /// Merges donations, process recordings, and home visitations. When <paramref name="limitForRecentWidget"/> is true,
    /// takes the 8 most recent from each source then returns the top 8 of the merged list (matches prior behavior).
    /// </summary>
    private async Task<List<RecentActivityDto>> BuildMergedActivityFeedAsync(bool limitForRecentWidget)
    {
        IQueryable<Donation> donationsQuery = _context.Donations.AsNoTracking().OrderByDescending(d => d.DonationDate);
        if (limitForRecentWidget)
            donationsQuery = donationsQuery.Take(8);
        var donRows = await donationsQuery
            .Select(d => new
            {
                d.DonationType,
                d.EstimatedValue,
                d.CurrencyCode,
                d.CampaignName,
                d.DonationDate,
            })
            .ToListAsync();

        var donations = donRows.Select(d => new RecentActivityDto(
            $"Donation received: {d.DonationType}",
            FormatDonationMetaLine(d.EstimatedValue, d.CurrencyCode, d.CampaignName),
            "donation",
            d.DonationDate != null
                ? d.DonationDate.Value.ToDateTime(TimeOnly.MinValue)
                : DateTime.MinValue)).ToList();

        IQueryable<ProcessRecording> recordingsQuery = _context.ProcessRecordings.AsNoTracking().OrderByDescending(p => p.SessionDate);
        if (limitForRecentWidget)
            recordingsQuery = recordingsQuery.Take(8);
        var recordings = await recordingsQuery
            .Select(p => new RecentActivityDto(
                $"Session logged: {p.SessionType}",
                $"{p.SocialWorker} • Resident #{p.ResidentId}",
                "recording",
                p.SessionDate.ToDateTime(TimeOnly.MinValue)))
            .ToListAsync();

        IQueryable<HomeVisitation> visitsQuery = _context.HomeVisitations.AsNoTracking().OrderByDescending(h => h.VisitDate);
        if (limitForRecentWidget)
            visitsQuery = visitsQuery.Take(8);
        var visits = await visitsQuery
            .Select(h => new RecentActivityDto(
                $"Home visit: {h.VisitType}",
                $"{h.SocialWorker} • {h.LocationVisited}",
                "visit",
                h.VisitDate.ToDateTime(TimeOnly.MinValue)))
            .ToListAsync();

        var merged = donations
            .Concat(recordings)
            .Concat(visits)
            .OrderByDescending(x => x.Timestamp)
            .ToList();

        if (limitForRecentWidget)
            merged = merged.Take(8).ToList();

        return merged;
    }

    [HttpGet("kpis")]
    public async Task<ActionResult<KpisDto>> GetKpis()
    {
        try
        {
            var anchor = await GetAnchorDateAsync();
            var derived = await GetActiveResidentDerivedMetricsAsync();
            var activeResidents = derived.ActiveResidentCountsBySafehouse.Values.Sum();
            var today = DateOnly.FromDateTime(DateTime.UtcNow);

            // Recent donations: last 7 days (inclusive) ending at the most recent donation date in DB; sum in PHP.
            DateOnly? donMax = await _context.Donations.Where(d => d.DonationDate != null).AnyAsync()
                ? await _context.Donations.Where(d => d.DonationDate != null).MaxAsync(d => d.DonationDate!.Value)
                : null;
            double recentDonationsAmount = 0;
            if (donMax.HasValue)
            {
                var donStart = donMax.Value.AddDays(-6);
                var donationSlice = await _context.Donations
                    .AsNoTracking()
                    .Where(d => d.DonationDate != null && d.DonationDate >= donStart && d.DonationDate <= donMax)
                    .Select(d => new { d.EstimatedValue, d.CurrencyCode })
                    .ToListAsync();
                recentDonationsAmount = donationSlice.Sum(d => CurrencyToPhp.Convert(d.EstimatedValue, d.CurrencyCode));
            }

            // Upcoming reviews: any open intervention plans with a case conference scheduled
            var upcomingReviews = await _context.InterventionPlans
                .CountAsync(p => p.CaseConferenceDate != null
                    && (p.Status == "Open" || p.Status == "In Progress"));

            // Incident KPI comes from the most recent monthly metric per safehouse, by MonthStart.
            var latestMetrics = (await _context.SafehouseMonthlyMetrics
                .AsNoTracking()
                .Where(m => m.MonthStart <= today)
                .Select(m => new
                {
                    m.SafehouseId,
                    m.MonthStart,
                    m.AvgHealthScore,
                    m.AvgEducationProgress,
                    m.IncidentCount,
                })
                .ToListAsync())
                .GroupBy(m => m.SafehouseId)
                .Select(g => g.OrderByDescending(x => x.MonthStart).First())
                .ToList();

            var avgProgress = derived.AvgEducationOverall;
            var avgHealthScore = derived.AvgHealthOverall;
            var incidentCount = latestMetrics.Sum(m => m.IncidentCount);

            return Ok(new KpisDto(
                activeResidents,
                recentDonationsAmount,
                upcomingReviews,
                (int)Math.Round(avgProgress),
                Math.Round(avgHealthScore, 2),
                incidentCount));
        }
        catch (Exception ex)
        {
            return StatusCode(503, new { error = "Database unavailable", message = ex.Message });
        }
    }

    [HttpGet("safehouses")]
    public async Task<ActionResult<List<SafehouseDto>>> GetSafehouses()
    {
        try
        {
            var derived = await GetActiveResidentDerivedMetricsAsync();
            var today = DateOnly.FromDateTime(DateTime.UtcNow);

            var latestMetricsBySafehouse = (await _context.SafehouseMonthlyMetrics
                .AsNoTracking()
                .Where(m => m.MonthStart <= today)
                .Select(m => new
                {
                    m.SafehouseId,
                    m.MonthStart,
                    m.AvgHealthScore,
                    m.AvgEducationProgress,
                    m.IncidentCount,
                })
                .ToListAsync())
                .GroupBy(m => m.SafehouseId)
                .ToDictionary(
                    g => g.Key,
                    g => g.OrderByDescending(x => x.MonthStart).First());

            var rows = await _context.Safehouses
                .OrderBy(s => s.Name)
                .ToListAsync();

            var result = rows.Select(s =>
            {
                var occupied = derived.ActiveResidentCountsBySafehouse.TryGetValue(s.SafehouseId, out var count) ? count : 0;
                var pct = s.CapacityGirls > 0
                    ? (int)Math.Round(100.0 * occupied / s.CapacityGirls)
                    : 0;
                var avgHealth = derived.AvgHealthBySafehouse.TryGetValue(s.SafehouseId, out var h)
                    ? Math.Round(h, 2)
                    : 0;
                var avgEducation = derived.AvgEducationBySafehouse.TryGetValue(s.SafehouseId, out var e)
                    ? (int)Math.Round(e)
                    : 0;
                var hasMonthlyMetrics = latestMetricsBySafehouse.TryGetValue(s.SafehouseId, out var metrics);
                var incidentCount = hasMonthlyMetrics ? metrics!.IncidentCount : 0;
                return new SafehouseDto(
                    s.SafehouseId,
                    s.Name,
                    s.Status,
                    occupied,
                    s.CapacityGirls,
                    pct,
                    avgHealth,
                    avgEducation,
                    incidentCount);
            }).ToList();

            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(503, new { error = "Database unavailable", message = ex.Message });
        }
    }

    [HttpGet("weekly-activity")]
    public async Task<ActionResult<List<WeeklyActivityDto>>> GetWeeklyActivity()
    {
        try
        {
            // 7 weekly buckets ending at the most recent activity date in the DB.
            // The seed data is too sparse for a day-by-day chart to look alive,
            // so each bar aggregates one calendar week.
            var anchor = await GetAnchorDateAsync();
            var windowStart = anchor.AddDays(-48); // 7 weeks = 49 days

            var prList = await _context.ProcessRecordings
                .Where(p => p.SessionDate >= windowStart && p.SessionDate <= anchor)
                .Select(p => p.SessionDate)
                .ToListAsync();

            var hvList = await _context.HomeVisitations
                .Where(h => h.VisitDate >= windowStart && h.VisitDate <= anchor)
                .Select(h => h.VisitDate)
                .ToListAsync();

            var donList = await _context.Donations
                .Where(d => d.DonationDate != null && d.DonationDate >= windowStart && d.DonationDate <= anchor)
                .Select(d => d.DonationDate!.Value)
                .ToListAsync();

            var result = new List<WeeklyActivityDto>();
            for (int i = 0; i < 7; i++)
            {
                var bucketStart = windowStart.AddDays(i * 7);
                var bucketEnd = bucketStart.AddDays(6);
                var pr = prList.Count(d => d >= bucketStart && d <= bucketEnd);
                var hv = hvList.Count(d => d >= bucketStart && d <= bucketEnd);
                var dn = donList.Count(d => d >= bucketStart && d <= bucketEnd);
                var label = $"W{i + 1}";
                result.Add(new WeeklyActivityDto(label, bucketStart.ToString("yyyy-MM-dd"), pr, hv, dn, pr + hv + dn));
            }
            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(503, new { error = "Database unavailable", message = ex.Message });
        }
    }

    [HttpGet("recent-activity")]
    public async Task<ActionResult<List<RecentActivityDto>>> GetRecentActivity()
    {
        try
        {
            return Ok(await BuildMergedActivityFeedAsync(limitForRecentWidget: true));
        }
        catch (Exception ex)
        {
            return StatusCode(503, new { error = "Database unavailable", message = ex.Message });
        }
    }

    [HttpGet("activity-log")]
    public async Task<ActionResult<PagedResultDto<RecentActivityDto>>> GetActivityLog(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 25)
    {
        try
        {
            var safePage = Math.Max(1, page);
            var safePageSize = Math.Clamp(pageSize, 5, 100);
            var allItems = await BuildMergedActivityFeedAsync(limitForRecentWidget: false);
            var totalCount = allItems.Count;
            var totalPages = totalCount == 0 ? 1 : (int)Math.Ceiling(totalCount / (double)safePageSize);
            var clampedPage = Math.Min(safePage, totalPages);
            var skip = (clampedPage - 1) * safePageSize;
            var items = allItems.Skip(skip).Take(safePageSize).ToList();

            return Ok(new PagedResultDto<RecentActivityDto>(
                items,
                totalCount,
                clampedPage,
                safePageSize,
                totalPages));
        }
        catch (Exception ex)
        {
            return StatusCode(503, new { error = "Database unavailable", message = ex.Message });
        }
    }

    [HttpGet("upcoming-reviews")]
    public async Task<ActionResult<List<UpcomingReviewDto>>> GetUpcomingReviews()
    {
        try
        {
            var anchor = await GetAnchorDateAsync();
            // Next 5 open/in-progress case conferences on or after anchor, then
            // fall back to the 5 most recent ones if nothing is in the future.
            var rows = await _context.InterventionPlans
                .Where(p => p.CaseConferenceDate != null
                    && (p.Status == "Open" || p.Status == "In Progress")
                    && p.CaseConferenceDate >= anchor)
                .OrderBy(p => p.CaseConferenceDate)
                .Take(5)
                .Select(p => new UpcomingReviewDto(
                    p.PlanId,
                    p.ResidentId,
                    p.Resident.CaseControlNo,
                    p.PlanCategory,
                    p.CaseConferenceDate!.Value))
                .ToListAsync();

            if (rows.Count == 0)
            {
                rows = await _context.InterventionPlans
                    .Where(p => p.CaseConferenceDate != null
                        && (p.Status == "Open" || p.Status == "In Progress"))
                    .OrderByDescending(p => p.CaseConferenceDate)
                    .Take(5)
                    .Select(p => new UpcomingReviewDto(
                        p.PlanId,
                        p.ResidentId,
                        p.Resident.CaseControlNo,
                        p.PlanCategory,
                        p.CaseConferenceDate!.Value))
                    .ToListAsync();
            }

            return Ok(rows);
        }
        catch (Exception ex)
        {
            return StatusCode(503, new { error = "Database unavailable", message = ex.Message });
        }
    }
}
