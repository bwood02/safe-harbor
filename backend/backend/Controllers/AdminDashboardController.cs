using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Models;

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
        int AvgProgress);

    public record SafehouseDto(
        int SafehouseId,
        string Name,
        string Status,
        int Occupied,
        int Capacity,
        int Pct);

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
        var candidates = new[] { prMax, hvMax, dnMax, today }.Where(d => d.HasValue).Select(d => d!.Value).ToList();
        return candidates.Any() ? candidates.Max() : today;
    }

    [HttpGet("kpis")]
    public async Task<ActionResult<KpisDto>> GetKpis()
    {
        try
        {
            var anchor = await GetAnchorDateAsync();

            var activeResidents = await _context.Residents
                .CountAsync(r => r.CaseStatus == "Active");

            // Recent donations: last 30 days ending at the most recent donation date
            DateOnly? donMax = await _context.Donations.Where(d => d.DonationDate != null).AnyAsync()
                ? await _context.Donations.Where(d => d.DonationDate != null).MaxAsync(d => d.DonationDate!.Value)
                : null;
            double recentDonationsAmount = 0;
            if (donMax.HasValue)
            {
                var donStart = donMax.Value.AddDays(-29);
                recentDonationsAmount = await _context.Donations
                    .Where(d => d.DonationDate != null && d.DonationDate >= donStart && d.DonationDate <= donMax)
                    .SumAsync(d => (double?)d.EstimatedValue) ?? 0;
            }

            // Upcoming reviews: any open intervention plans with a case conference scheduled
            var upcomingReviews = await _context.InterventionPlans
                .CountAsync(p => p.CaseConferenceDate != null
                    && (p.Status == "Open" || p.Status == "In Progress"));

            double avgProgress = 0;
            if (await _context.EducationRecords.AnyAsync())
            {
                avgProgress = await _context.EducationRecords
                    .AverageAsync(e => e.ProgressPercent);
            }

            return Ok(new KpisDto(
                activeResidents,
                recentDonationsAmount,
                upcomingReviews,
                (int)Math.Round(avgProgress)));
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
            var rows = await _context.Safehouses
                .OrderBy(s => s.Name)
                .Select(s => new SafehouseDto(
                    s.SafehouseId,
                    s.Name,
                    s.Status,
                    s.CurrentOccupancy,
                    s.CapacityGirls,
                    s.CapacityGirls > 0
                        ? (int)Math.Round(100.0 * s.CurrentOccupancy / s.CapacityGirls)
                        : 0))
                .ToListAsync();
            return Ok(rows);
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
            var donations = await _context.Donations
                .OrderByDescending(d => d.DonationDate)
                .Take(8)
                .Select(d => new RecentActivityDto(
                    $"Donation received: {d.DonationType}",
                    $"${d.EstimatedValue:N0}" + (d.CampaignName != null ? $" • {d.CampaignName}" : ""),
                    "donation",
                    d.DonationDate != null
                        ? d.DonationDate.Value.ToDateTime(TimeOnly.MinValue)
                        : DateTime.MinValue))
                .ToListAsync();

            var recordings = await _context.ProcessRecordings
                .OrderByDescending(p => p.SessionDate)
                .Take(8)
                .Select(p => new RecentActivityDto(
                    $"Session logged: {p.SessionType}",
                    $"{p.SocialWorker} • Resident #{p.ResidentId}",
                    "recording",
                    p.SessionDate.ToDateTime(TimeOnly.MinValue)))
                .ToListAsync();

            var visits = await _context.HomeVisitations
                .OrderByDescending(h => h.VisitDate)
                .Take(8)
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
                .Take(8)
                .ToList();

            return Ok(merged);
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
