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

    [HttpGet("kpis")]
    public async Task<ActionResult<KpisDto>> GetKpis()
    {
        try
        {
            var today = DateOnly.FromDateTime(DateTime.UtcNow);
            var nextWeek = today.AddDays(7);
            var sevenDaysAgo = today.AddDays(-7);

            var activeResidents = await _context.Residents
                .CountAsync(r => r.CaseStatus == "Active");

            var recentDonationsAmount = await _context.Donations
                .Where(d => d.DonationDate != null && d.DonationDate >= sevenDaysAgo)
                .SumAsync(d => (double?)d.EstimatedValue) ?? 0;

            var upcomingReviews = await _context.InterventionPlans
                .CountAsync(p => p.CaseConferenceDate != null
                    && p.CaseConferenceDate >= today
                    && p.CaseConferenceDate <= nextWeek);

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
            var today = DateOnly.FromDateTime(DateTime.UtcNow);
            var start = today.AddDays(-6);

            var prList = await _context.ProcessRecordings
                .Where(p => p.SessionDate >= start && p.SessionDate <= today)
                .Select(p => p.SessionDate)
                .ToListAsync();

            var hvList = await _context.HomeVisitations
                .Where(h => h.VisitDate >= start && h.VisitDate <= today)
                .Select(h => h.VisitDate)
                .ToListAsync();

            var donList = await _context.Donations
                .Where(d => d.DonationDate != null && d.DonationDate >= start && d.DonationDate <= today)
                .Select(d => d.DonationDate!.Value)
                .ToListAsync();

            var result = new List<WeeklyActivityDto>();
            for (int i = 0; i < 7; i++)
            {
                var date = start.AddDays(i);
                var pr = prList.Count(d => d == date);
                var hv = hvList.Count(d => d == date);
                var dn = donList.Count(d => d == date);
                var dayName = date.ToDateTime(TimeOnly.MinValue).ToString("ddd");
                result.Add(new WeeklyActivityDto(dayName, date.ToString("yyyy-MM-dd"), pr, hv, dn, pr + hv + dn));
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
            var today = DateOnly.FromDateTime(DateTime.UtcNow);
            var rows = await _context.InterventionPlans
                .Where(p => p.CaseConferenceDate != null && p.CaseConferenceDate >= today)
                .OrderBy(p => p.CaseConferenceDate)
                .Take(5)
                .Select(p => new UpcomingReviewDto(
                    p.PlanId,
                    p.ResidentId,
                    p.Resident.CaseControlNo,
                    p.PlanCategory,
                    p.CaseConferenceDate!.Value))
                .ToListAsync();
            return Ok(rows);
        }
        catch (Exception ex)
        {
            return StatusCode(503, new { error = "Database unavailable", message = ex.Message });
        }
    }
}
