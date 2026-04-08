using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Models;

namespace backend.Controllers;

[Route("api/[controller]")]
[ApiController]
public class SupportersController : ControllerBase
{
    private readonly MainAppDbContext _context;

    public SupportersController(MainAppDbContext context)
    {
        _context = context;
    }

    public class SupporterListItem
    {
        public int SupporterId { get; set; }
        public string DisplayName { get; set; } = "";
        public string SupporterType { get; set; } = "";
        public string RelationshipType { get; set; } = "";
        public string Region { get; set; } = "";
        public string Country { get; set; } = "";
        public string Email { get; set; } = "";
        public string Status { get; set; } = "";
        public DateOnly? FirstDonationDate { get; set; }
        public double TotalGiven { get; set; }
        public int DonationCount { get; set; }
    }

    public class PagedResult<T>
    {
        public IEnumerable<T> Items { get; set; } = Array.Empty<T>();
        public int Total { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
    }

    [HttpGet]
    public async Task<ActionResult<PagedResult<SupporterListItem>>> GetSupporters(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        [FromQuery] string? type = null,
        [FromQuery] string? status = null,
        [FromQuery] string? search = null)
    {
        if (page < 1) page = 1;
        if (pageSize < 1 || pageSize > 500) pageSize = 50;

        var q = _context.Supporters.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(type))
            q = q.Where(s => s.SupporterType == type);
        if (!string.IsNullOrWhiteSpace(status))
            q = q.Where(s => s.Status == status);
        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            q = q.Where(s =>
                s.DisplayName.Contains(term) ||
                (s.OrganizationName != null && s.OrganizationName.Contains(term)) ||
                s.Email.Contains(term));
        }

        var total = await q.CountAsync();

        var items = await q
            .OrderBy(s => s.DisplayName)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(s => new SupporterListItem
            {
                SupporterId = s.SupporterId,
                DisplayName = s.DisplayName,
                SupporterType = s.SupporterType,
                RelationshipType = s.RelationshipType,
                Region = s.Region,
                Country = s.Country,
                Email = s.Email,
                Status = s.Status,
                FirstDonationDate = s.FirstDonationDate,
                TotalGiven = s.Donations.Sum(d => (double?)d.EstimatedValue) ?? 0,
                DonationCount = s.Donations.Count(),
            })
            .ToListAsync();

        return Ok(new PagedResult<SupporterListItem>
        {
            Items = items,
            Total = total,
            Page = page,
            PageSize = pageSize,
        });
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<Supporter>> GetSupporter(int id)
    {
        var supporter = await _context.Supporters
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.SupporterId == id);

        if (supporter == null) return NotFound();
        return Ok(supporter);
    }

    [HttpGet("{id:int}/donations")]
    public async Task<ActionResult<IEnumerable<Donation>>> GetSupporterDonations(int id)
    {
        var exists = await _context.Supporters.AnyAsync(s => s.SupporterId == id);
        if (!exists) return NotFound();

        var donations = await _context.Donations
            .AsNoTracking()
            .Where(d => d.SupporterId == id)
            .OrderByDescending(d => d.DonationDate)
            .ToListAsync();

        return Ok(donations);
    }
}
