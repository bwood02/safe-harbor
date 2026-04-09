using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Models;
using CurrencyToPhp = global::backend.CurrencyToPhp;

namespace backend.Controllers;

[Route("api/[controller]")]
[ApiController]
public class ReportsController : ControllerBase
{
    private readonly MainAppDbContext _context;

    public ReportsController(MainAppDbContext context)
    {
        _context = context;
    }

    // ---- DTOs ----
    public record DonationTrendPointDto(string Period, int DonationCount, double TotalPhp);
    public record DonationByCampaignDto(string CampaignName, double TotalPhp, int DonorCount);
    public record DonationByTypeDto(string DonationType, double TotalPhp, int Count);
    public record ResidentOutcomePointDto(string Period, double AvgEducationProgress, double AvgHealthScore, int ActiveResidentCount);
    public record SafehouseComparisonDto(
        int SafehouseId,
        string SafehouseName,
        int ActiveResidents,
        double AvgEducationProgress,
        double AvgHealthScore,
        int IncidentCount,
        int ProcessRecordingCount,
        int HomeVisitCount);
    public record CountBucketDto(string Key, int Count);
    public record ReintegrationOutcomesDto(
        List<CountBucketDto> StatusBreakdown,
        List<CountBucketDto> TypeBreakdown,
        double CompletionRatePercent);
    public record ServicesProvidedDto(int Caring, int Healing, int Teaching);
    public record BeneficiariesDto(int TotalServed, int ActiveAtYearEnd);
    public record OutcomesDto(int ReintegrationsCompleted, int EducationCompletions, double AvgHealthImprovement);
    public record AnnualAccomplishmentDto(
        int Year,
        ServicesProvidedDto ServicesProvided,
        BeneficiariesDto Beneficiaries,
        OutcomesDto Outcomes);

    // ---- helpers ----
    private async Task<DateOnly> GetAnchorDateAsync()
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        DateOnly? dnMax = await _context.Donations.Where(d => d.DonationDate != null).AnyAsync()
            ? await _context.Donations.Where(d => d.DonationDate != null).MaxAsync(d => d.DonationDate!.Value)
            : null;
        DateOnly? erMax = await _context.EducationRecords.AnyAsync()
            ? await _context.EducationRecords.MaxAsync(e => e.RecordDate)
            : null;
        DateOnly? hrMax = await _context.HealthWellbeingRecords.AnyAsync()
            ? await _context.HealthWellbeingRecords.MaxAsync(h => h.RecordDate)
            : null;
        var candidates = new[] { dnMax, erMax, hrMax }
            .Where(d => d.HasValue).Select(d => d!.Value).Where(d => d <= today).ToList();
        return candidates.Any() ? candidates.Max() : today;
    }

    private (DateOnly from, DateOnly to) ResolveWindow(DateOnly? fromDate, DateOnly? toDate, DateOnly anchor, int defaultTrailingDays)
    {
        var to = toDate ?? anchor;
        var from = fromDate ?? to.AddDays(-defaultTrailingDays);
        return (from, to);
    }

    // ---- endpoints ----

    [HttpGet("donation-trends")]
    public async Task<IActionResult> GetDonationTrends([FromQuery] DateOnly? fromDate, [FromQuery] DateOnly? toDate, [FromQuery] string? groupBy)
    {
        try
        {
            var anchor = await GetAnchorDateAsync();
            var (from, to) = ResolveWindow(fromDate, toDate, anchor, 365);
            var rows = await _context.Donations.AsNoTracking()
                .Where(d => d.DonationDate != null && d.DonationDate >= from && d.DonationDate <= to)
                .Select(d => new { d.DonationDate, d.EstimatedValue, d.CurrencyCode })
                .ToListAsync();

            var useQuarter = string.Equals(groupBy, "quarter", StringComparison.OrdinalIgnoreCase);
            var grouped = rows
                .GroupBy(r =>
                {
                    var dt = r.DonationDate!.Value;
                    return useQuarter
                        ? $"{dt.Year}-Q{(dt.Month - 1) / 3 + 1}"
                        : $"{dt.Year:D4}-{dt.Month:D2}";
                })
                .OrderBy(g => g.Key)
                .Select(g => new DonationTrendPointDto(
                    g.Key,
                    g.Count(),
                    Math.Round(g.Sum(x => CurrencyToPhp.Convert(x.EstimatedValue, x.CurrencyCode)), 2)))
                .ToList();

            return Ok(new { data = grouped, error = (string?)null, message = (string?)null });
        }
        catch (Exception ex)
        {
            return StatusCode(503, new { data = (object?)null, error = "Database unavailable", message = ex.Message });
        }
    }

    [HttpGet("donations-by-campaign")]
    public async Task<IActionResult> GetDonationsByCampaign([FromQuery] DateOnly? fromDate, [FromQuery] DateOnly? toDate)
    {
        try
        {
            var anchor = await GetAnchorDateAsync();
            var (from, to) = ResolveWindow(fromDate, toDate, anchor, 365);
            var rows = await _context.Donations.AsNoTracking()
                .Where(d => d.DonationDate != null && d.DonationDate >= from && d.DonationDate <= to)
                .Select(d => new { d.CampaignName, d.SupporterId, d.EstimatedValue, d.CurrencyCode })
                .ToListAsync();

            var grouped = rows
                .GroupBy(r => string.IsNullOrWhiteSpace(r.CampaignName) ? "(Uncategorized)" : r.CampaignName!)
                .Select(g => new DonationByCampaignDto(
                    g.Key,
                    Math.Round(g.Sum(x => CurrencyToPhp.Convert(x.EstimatedValue, x.CurrencyCode)), 2),
                    g.Select(x => x.SupporterId).Distinct().Count()))
                .OrderByDescending(d => d.TotalPhp)
                .ToList();

            return Ok(new { data = grouped, error = (string?)null, message = (string?)null });
        }
        catch (Exception ex)
        {
            return StatusCode(503, new { data = (object?)null, error = "Database unavailable", message = ex.Message });
        }
    }

    [HttpGet("donations-by-type")]
    public async Task<IActionResult> GetDonationsByType([FromQuery] DateOnly? fromDate, [FromQuery] DateOnly? toDate)
    {
        try
        {
            var anchor = await GetAnchorDateAsync();
            var (from, to) = ResolveWindow(fromDate, toDate, anchor, 365);
            var rows = await _context.Donations.AsNoTracking()
                .Where(d => d.DonationDate != null && d.DonationDate >= from && d.DonationDate <= to)
                .Select(d => new { d.DonationType, d.EstimatedValue, d.CurrencyCode })
                .ToListAsync();

            var grouped = rows
                .GroupBy(r => r.DonationType ?? "(Unknown)")
                .Select(g => new DonationByTypeDto(
                    g.Key,
                    Math.Round(g.Sum(x => CurrencyToPhp.Convert(x.EstimatedValue, x.CurrencyCode)), 2),
                    g.Count()))
                .OrderByDescending(d => d.TotalPhp)
                .ToList();

            return Ok(new { data = grouped, error = (string?)null, message = (string?)null });
        }
        catch (Exception ex)
        {
            return StatusCode(503, new { data = (object?)null, error = "Database unavailable", message = ex.Message });
        }
    }

    [HttpGet("resident-outcomes")]
    public async Task<IActionResult> GetResidentOutcomes([FromQuery] DateOnly? fromDate, [FromQuery] DateOnly? toDate)
    {
        try
        {
            var anchor = await GetAnchorDateAsync();
            var (from, to) = ResolveWindow(fromDate, toDate, anchor, 365);

            var edu = await _context.EducationRecords.AsNoTracking()
                .Where(e => e.RecordDate >= from && e.RecordDate <= to)
                .Select(e => new { e.RecordDate, e.ResidentId, e.ProgressPercent })
                .ToListAsync();

            var hw = await _context.HealthWellbeingRecords.AsNoTracking()
                .Where(h => h.RecordDate >= from && h.RecordDate <= to)
                .Select(h => new { h.RecordDate, h.ResidentId, h.GeneralHealthScore })
                .ToListAsync();

            string MonthKey(DateOnly d) => $"{d.Year:D4}-{d.Month:D2}";

            var eduByMonth = edu.GroupBy(e => MonthKey(e.RecordDate))
                .ToDictionary(g => g.Key, g => g.Average(x => x.ProgressPercent));
            var hwByMonth = hw.GroupBy(h => MonthKey(h.RecordDate))
                .ToDictionary(g => g.Key, g => g.Average(x => x.GeneralHealthScore));
            var residentsByMonth = edu.Select(e => new { M = MonthKey(e.RecordDate), e.ResidentId })
                .Concat(hw.Select(h => new { M = MonthKey(h.RecordDate), h.ResidentId }))
                .GroupBy(x => x.M)
                .ToDictionary(g => g.Key, g => g.Select(x => x.ResidentId).Distinct().Count());

            var keys = eduByMonth.Keys.Union(hwByMonth.Keys).OrderBy(k => k).ToList();
            var points = keys.Select(k => new ResidentOutcomePointDto(
                k,
                Math.Round(eduByMonth.TryGetValue(k, out var e) ? e : 0, 2),
                Math.Round(hwByMonth.TryGetValue(k, out var h) ? h : 0, 2),
                residentsByMonth.TryGetValue(k, out var c) ? c : 0)).ToList();

            return Ok(new { data = points, error = (string?)null, message = (string?)null });
        }
        catch (Exception ex)
        {
            return StatusCode(503, new { data = (object?)null, error = "Database unavailable", message = ex.Message });
        }
    }

    [HttpGet("safehouse-comparison")]
    public async Task<IActionResult> GetSafehouseComparison([FromQuery] DateOnly? fromDate, [FromQuery] DateOnly? toDate)
    {
        try
        {
            var anchor = await GetAnchorDateAsync();
            var (from, to) = ResolveWindow(fromDate, toDate, anchor, 365);

            var safehouses = await _context.Safehouses.AsNoTracking()
                .Select(s => new { s.SafehouseId, s.Name }).ToListAsync();

            var activeResidents = await _context.Residents.AsNoTracking()
                .Where(r => r.CaseStatus == "Active")
                .Select(r => new { r.ResidentId, r.SafehouseId })
                .ToListAsync();
            var activeIds = activeResidents.Select(r => r.ResidentId).ToList();
            var activeBySh = activeResidents.GroupBy(r => r.SafehouseId).ToDictionary(g => g.Key, g => g.Count());
            var residentToSh = activeResidents.ToDictionary(r => r.ResidentId, r => r.SafehouseId);

            var latestEdu = (await _context.EducationRecords.AsNoTracking()
                .Where(e => activeIds.Contains(e.ResidentId))
                .Select(e => new { e.ResidentId, e.RecordDate, e.EducationRecordId, e.ProgressPercent })
                .ToListAsync())
                .GroupBy(e => e.ResidentId)
                .Select(g => g.OrderByDescending(x => x.RecordDate).ThenByDescending(x => x.EducationRecordId).First())
                .ToList();
            var latestHw = (await _context.HealthWellbeingRecords.AsNoTracking()
                .Where(h => activeIds.Contains(h.ResidentId))
                .Select(h => new { h.ResidentId, h.RecordDate, h.HealthRecordId, h.GeneralHealthScore })
                .ToListAsync())
                .GroupBy(h => h.ResidentId)
                .Select(g => g.OrderByDescending(x => x.RecordDate).ThenByDescending(x => x.HealthRecordId).First())
                .ToList();

            var eduBySh = latestEdu.GroupBy(e => residentToSh[e.ResidentId])
                .ToDictionary(g => g.Key, g => g.Average(x => x.ProgressPercent));
            var hwBySh = latestHw.GroupBy(h => residentToSh[h.ResidentId])
                .ToDictionary(g => g.Key, g => g.Average(x => x.GeneralHealthScore));

            var today = DateOnly.FromDateTime(DateTime.UtcNow);
            var latestMetrics = (await _context.SafehouseMonthlyMetrics.AsNoTracking()
                .Where(m => m.MonthStart <= today)
                .Select(m => new { m.SafehouseId, m.MonthStart, m.IncidentCount })
                .ToListAsync())
                .GroupBy(m => m.SafehouseId)
                .ToDictionary(g => g.Key, g => g.OrderByDescending(x => x.MonthStart).First());

            var prCounts = (await _context.ProcessRecordings.AsNoTracking()
                .Where(p => p.SessionDate >= from && p.SessionDate <= to)
                .Select(p => new { p.ResidentId, p.SessionDate })
                .ToListAsync())
                .Where(p => residentToSh.ContainsKey(p.ResidentId))
                .GroupBy(p => residentToSh[p.ResidentId])
                .ToDictionary(g => g.Key, g => g.Count());

            var hvCounts = (await _context.HomeVisitations.AsNoTracking()
                .Where(h => h.VisitDate >= from && h.VisitDate <= to)
                .Select(h => new { h.ResidentId, h.VisitDate })
                .ToListAsync())
                .Where(h => residentToSh.ContainsKey(h.ResidentId))
                .GroupBy(h => residentToSh[h.ResidentId])
                .ToDictionary(g => g.Key, g => g.Count());

            var rows = safehouses.Select(s => new SafehouseComparisonDto(
                s.SafehouseId,
                s.Name,
                activeBySh.TryGetValue(s.SafehouseId, out var a) ? a : 0,
                Math.Round(eduBySh.TryGetValue(s.SafehouseId, out var e) ? e : 0, 2),
                Math.Round(hwBySh.TryGetValue(s.SafehouseId, out var h) ? h : 0, 2),
                latestMetrics.TryGetValue(s.SafehouseId, out var m) ? m.IncidentCount : 0,
                prCounts.TryGetValue(s.SafehouseId, out var pc) ? pc : 0,
                hvCounts.TryGetValue(s.SafehouseId, out var hc) ? hc : 0))
                .OrderBy(r => r.SafehouseName).ToList();

            return Ok(new { data = rows, error = (string?)null, message = (string?)null });
        }
        catch (Exception ex)
        {
            return StatusCode(503, new { data = (object?)null, error = "Database unavailable", message = ex.Message });
        }
    }

    [HttpGet("reintegration-outcomes")]
    public async Task<IActionResult> GetReintegrationOutcomes()
    {
        try
        {
            var residents = await _context.Residents.AsNoTracking()
                .Select(r => new { r.ReintegrationStatus, r.ReintegrationType }).ToListAsync();

            var statusBreakdown = residents
                .GroupBy(r => string.IsNullOrWhiteSpace(r.ReintegrationStatus) ? "Unknown" : r.ReintegrationStatus)
                .Select(g => new CountBucketDto(g.Key, g.Count()))
                .OrderByDescending(x => x.Count).ToList();

            var typeBreakdown = residents
                .GroupBy(r => string.IsNullOrWhiteSpace(r.ReintegrationType) ? "Unknown" : r.ReintegrationType)
                .Select(g => new CountBucketDto(g.Key, g.Count()))
                .OrderByDescending(x => x.Count).ToList();

            var total = residents.Count;
            var completed = residents.Count(r => string.Equals(r.ReintegrationStatus, "Completed", StringComparison.OrdinalIgnoreCase));
            var completionRate = total > 0 ? Math.Round(100.0 * completed / total, 2) : 0;

            var dto = new ReintegrationOutcomesDto(statusBreakdown, typeBreakdown, completionRate);
            return Ok(new { data = dto, error = (string?)null, message = (string?)null });
        }
        catch (Exception ex)
        {
            return StatusCode(503, new { data = (object?)null, error = "Database unavailable", message = ex.Message });
        }
    }

    [HttpGet("annual-accomplishment")]
    public async Task<IActionResult> GetAnnualAccomplishment([FromQuery] int? year)
    {
        try
        {
            var anchor = await GetAnchorDateAsync();
            int y;
            if (year.HasValue)
            {
                y = year.Value;
            }
            else
            {
                var anyPlans = await _context.InterventionPlans.AsNoTracking().AnyAsync();
                if (anyPlans)
                {
                    var maxPlanCreated = await _context.InterventionPlans.AsNoTracking()
                        .MaxAsync(p => p.CreatedAt);
                    y = maxPlanCreated.Year;
                }
                else
                {
                    y = anchor.Year;
                }
            }
            var yearStart = new DateOnly(y, 1, 1);
            var yearEnd = new DateOnly(y, 12, 31);

            var plansInYear = await _context.InterventionPlans.AsNoTracking()
                .Where(p => p.CreatedAt >= yearStart.ToDateTime(TimeOnly.MinValue)
                         && p.CreatedAt <= yearEnd.ToDateTime(TimeOnly.MaxValue))
                .Select(p => new { p.ServicesProvided, p.Status, p.PlanCategory })
                .ToListAsync();

            int Caring = 0, Healing = 0, Teaching = 0;
            foreach (var p in plansInYear)
            {
                var s = (p.ServicesProvided ?? "").ToLowerInvariant();
                if (s.Contains("car")) Caring++;
                if (s.Contains("heal") || s.Contains("health")) Healing++;
                if (s.Contains("teach") || s.Contains("educat")) Teaching++;
            }

            var totalServed = await _context.Residents.AsNoTracking()
                .Where(r => r.DateOfAdmission <= yearEnd
                         && (r.DateClosed == null || r.DateClosed >= yearStart))
                .CountAsync();
            var activeAtYearEnd = await _context.Residents.AsNoTracking()
                .Where(r => r.DateOfAdmission <= yearEnd
                         && (r.DateClosed == null || r.DateClosed > yearEnd))
                .CountAsync();

            var reintegrationsCompleted = await _context.Residents.AsNoTracking()
                .Where(r => r.DateClosed != null
                         && r.DateClosed >= yearStart && r.DateClosed <= yearEnd
                         && r.ReintegrationStatus == "Completed")
                .CountAsync();

            var educationCompletions = await _context.EducationRecords.AsNoTracking()
                .Where(e => e.RecordDate >= yearStart && e.RecordDate <= yearEnd
                         && e.CompletionStatus == "Completed")
                .CountAsync();

            var hwInYear = await _context.HealthWellbeingRecords.AsNoTracking()
                .Where(h => h.RecordDate >= yearStart && h.RecordDate <= yearEnd)
                .Select(h => new { h.ResidentId, h.RecordDate, h.GeneralHealthScore })
                .ToListAsync();
            double avgHealthImprovement = 0;
            if (hwInYear.Count > 0)
            {
                var improvements = hwInYear
                    .GroupBy(h => h.ResidentId)
                    .Where(g => g.Count() >= 2)
                    .Select(g =>
                    {
                        var ordered = g.OrderBy(x => x.RecordDate).ToList();
                        return ordered.Last().GeneralHealthScore - ordered.First().GeneralHealthScore;
                    })
                    .ToList();
                if (improvements.Count > 0)
                    avgHealthImprovement = Math.Round(improvements.Average(), 2);
            }

            var dto = new AnnualAccomplishmentDto(
                y,
                new ServicesProvidedDto(Caring, Healing, Teaching),
                new BeneficiariesDto(totalServed, activeAtYearEnd),
                new OutcomesDto(reintegrationsCompleted, educationCompletions, avgHealthImprovement));

            return Ok(new { data = dto, error = (string?)null, message = (string?)null });
        }
        catch (Exception ex)
        {
            return StatusCode(503, new { data = (object?)null, error = "Database unavailable", message = ex.Message });
        }
    }
}
