using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Models;

namespace backend.Controllers;

[Route("api/[controller]")]
[ApiController]
public class ImpactController : ControllerBase
{
    private readonly MainAppDbContext _context;

    public ImpactController(MainAppDbContext context)
    {
        _context = context;
    }

    public record ImpactSummaryDto(
        int GirlsSupported,
        int Safehouses,
        int Donors,
        List<MonthlyDonationPoint> MonthlyTrend);

    public record MonthlyDonationPoint(string Month, double Total);

    public record OutcomeRowDto(string Label, int Pct);

    [HttpGet("summary")]
    public async Task<ActionResult<ImpactSummaryDto>> GetSummary()
    {
        try
        {
            var girls = await _context.Residents.CountAsync();
            var safehouses = await _context.Safehouses.CountAsync();
            var donors = await _context.Supporters.CountAsync();

            var since = DateOnly.FromDateTime(DateTime.UtcNow.AddMonths(-11));
            var rawDonations = await _context.Donations
                .Where(d => d.DonationDate != null && d.DonationDate >= since)
                .Select(d => new { d.DonationDate, d.EstimatedValue })
                .ToListAsync();

            var trend = rawDonations
                .GroupBy(d => new { d.DonationDate!.Value.Year, d.DonationDate!.Value.Month })
                .OrderBy(g => g.Key.Year).ThenBy(g => g.Key.Month)
                .Select(g => new MonthlyDonationPoint(
                    $"{g.Key.Year:0000}-{g.Key.Month:00}",
                    g.Sum(x => x.EstimatedValue)))
                .ToList();

            return Ok(new ImpactSummaryDto(girls, safehouses, donors, trend));
        }
        catch (Exception ex)
        {
            return StatusCode(503, new { error = "Database unavailable", detail = ex.Message });
        }
    }

    [HttpGet("outcomes")]
    public async Task<ActionResult<List<OutcomeRowDto>>> GetOutcomes()
    {
        try
        {
            var groups = await _context.Residents
                .GroupBy(r => r.CaseStatus)
                .Select(g => new { Status = g.Key, Count = g.Count() })
                .ToListAsync();

            var total = groups.Sum(g => g.Count);
            if (total == 0)
            {
                return Ok(new List<OutcomeRowDto>());
            }

            var rows = groups
                .Select(g => new OutcomeRowDto(
                    g.Status ?? "Unknown",
                    (int)Math.Round(100.0 * g.Count / total)))
                .OrderByDescending(r => r.Pct)
                .ToList();

            return Ok(rows);
        }
        catch (Exception ex)
        {
            return StatusCode(503, new { error = "Database unavailable", detail = ex.Message });
        }
    }
}
