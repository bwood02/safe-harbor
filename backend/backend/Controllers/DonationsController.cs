using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Models;

namespace backend.Controllers;

[Route("api/[controller]")]
[ApiController]
public class DonationsController : ControllerBase
{
    private readonly MainAppDbContext _context;

    public DonationsController(MainAppDbContext context)
    {
        _context = context;
    }

    public class RecentDonationDto
    {
        public int DonationId { get; set; }
        public int SupporterId { get; set; }
        public string SupporterName { get; set; } = "";
        public string DonationType { get; set; } = "";
        public DateOnly? DonationDate { get; set; }
        public double EstimatedValue { get; set; }
        public string? CampaignName { get; set; }
        public string? CurrencyCode { get; set; }
    }

    public class ProgramAreaTotalDto
    {
        public string ProgramArea { get; set; } = "";
        public double Total { get; set; }
        public int Count { get; set; }
    }

    [HttpGet("recent")]
    public async Task<ActionResult<IEnumerable<RecentDonationDto>>> GetRecent([FromQuery] int days = 30)
    {
        if (days < 1) days = 30;
        if (days > 365) days = 365;

        var cutoff = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-days));

        var donations = await _context.Donations
            .AsNoTracking()
            .Where(d => d.DonationDate != null && d.DonationDate >= cutoff)
            .OrderByDescending(d => d.DonationDate)
            .Select(d => new RecentDonationDto
            {
                DonationId = d.DonationId,
                SupporterId = d.SupporterId,
                SupporterName = d.Supporter.DisplayName,
                DonationType = d.DonationType,
                DonationDate = d.DonationDate,
                EstimatedValue = d.EstimatedValue,
                CampaignName = d.CampaignName,
                CurrencyCode = d.CurrencyCode,
            })
            .ToListAsync();

        return Ok(donations);
    }

    [HttpGet("by-program-area")]
    public async Task<ActionResult<IEnumerable<ProgramAreaTotalDto>>> GetByProgramArea()
    {
        var rows = await _context.DonationAllocations
            .AsNoTracking()
            .GroupBy(a => a.ProgramArea)
            .Select(g => new ProgramAreaTotalDto
            {
                ProgramArea = g.Key,
                Total = g.Sum(a => a.AmountAllocated),
                Count = g.Count(),
            })
            .OrderByDescending(r => r.Total)
            .ToListAsync();

        return Ok(rows);
    }
}
