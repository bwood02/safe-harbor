using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Models;

namespace backend.Controllers;

[Route("api/[controller]")]
[ApiController]
public class PublicImpactController : ControllerBase
{
    private readonly MainAppDbContext _context;
    private readonly ILogger<PublicImpactController> _logger;

    public PublicImpactController(MainAppDbContext context, ILogger<PublicImpactController> logger)
    {
        _context = context;
        _logger = logger;
    }

    public record HomepageStats(int GirlsSupported, int Safehouses, int Donors, string? Headline, string? Summary);

    [HttpGet("snapshot")]
    public async Task<ActionResult<HomepageStats>> GetSnapshot()
    {
        try
        {
            var girlsSupported = await _context.Residents
                .Where(r => r.CaseStatus == "Active")
                .CountAsync();

            var safehouses = await _context.Safehouses.CountAsync();

            var donors = await _context.Donations
                .Select(d => d.SupporterId)
                .Distinct()
                .CountAsync();

            var latest = await _context.PublicImpactSnapshots
                .OrderByDescending(s => s.PublishedAt)
                .FirstOrDefaultAsync();

            return Ok(new HomepageStats(
                girlsSupported,
                safehouses,
                donors,
                latest?.Headline,
                latest?.SummaryText
            ));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "PublicImpact snapshot failed");
            return StatusCode(503, new { error = "Database unavailable" });
        }
    }
}
