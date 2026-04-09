using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using backend.Models;
using CurrencyToPhp = global::backend.CurrencyToPhp;

namespace backend.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize(Roles = AuthRoles.Admin)]
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

    public class CreateSupporterRequest
    {
        public string SupporterType { get; set; } = "";
        public string DisplayName { get; set; } = "";
        public string? OrganizationName { get; set; }
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string RelationshipType { get; set; } = "";
        public string Region { get; set; } = "";
        public string Country { get; set; } = "";
        public string Email { get; set; } = "";
        public string Phone { get; set; } = "";
        public string Status { get; set; } = "";
        public DateOnly? FirstDonationDate { get; set; }
        public string AcquisitionChannel { get; set; } = "";
    }

    private static readonly HashSet<string> AllowedSupporterTypes = new(StringComparer.Ordinal)
    {
        "MonetaryDonor",
        "InKindDonor",
        "Volunteer",
        "SkillsContributor",
        "SocialMediaAdvocate",
        "PartnerOrganization",
    };

    private static readonly HashSet<string> AllowedRelationshipTypes = new(StringComparer.Ordinal)
    {
        "Local",
        "International",
        "PartnerOrganization",
    };

    private static readonly HashSet<string> AllowedStatuses = new(StringComparer.Ordinal)
    {
        "Active",
        "Inactive",
    };

    private static readonly HashSet<string> AllowedAcquisitionChannels = new(StringComparer.Ordinal)
    {
        "Website",
        "SocialMedia",
        "Event",
        "WordOfMouth",
        "PartnerReferral",
        "Church",
    };

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

        var supporterScalars = await q
            .OrderBy(s => s.DisplayName)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(s => new
            {
                s.SupporterId,
                s.DisplayName,
                s.SupporterType,
                s.RelationshipType,
                s.Region,
                s.Country,
                s.Email,
                s.Status,
                s.FirstDonationDate,
            })
            .ToListAsync();

        var pageIds = supporterScalars.Select(s => s.SupporterId).ToList();
        var donationRows = await _context.Donations
            .AsNoTracking()
            .Where(d => pageIds.Contains(d.SupporterId))
            .Select(d => new { d.SupporterId, d.EstimatedValue, d.CurrencyCode })
            .ToListAsync();

        var statsBySupporter = donationRows
            .GroupBy(d => d.SupporterId)
            .ToDictionary(
                g => g.Key,
                g => (
                    Count: g.Count(),
                    TotalPhp: g.Sum(d => CurrencyToPhp.Convert(d.EstimatedValue, d.CurrencyCode))));

        var items = supporterScalars.Select(s =>
        {
            var hasStats = statsBySupporter.TryGetValue(s.SupporterId, out var st);
            return new SupporterListItem
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
                TotalGiven = hasStats ? st.TotalPhp : 0,
                DonationCount = hasStats ? st.Count : 0,
            };
        }).ToList();

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

    [HttpPost]
    public async Task<ActionResult<Supporter>> CreateSupporter([FromBody] CreateSupporterRequest request)
    {
        if (request == null) return BadRequest(new { error = "Request body is required." });

        var supporterType = request.SupporterType.Trim();
        var displayName = request.DisplayName.Trim();
        var relationshipType = request.RelationshipType.Trim();
        var region = request.Region.Trim();
        var country = request.Country.Trim();
        var email = request.Email.Trim();
        var phone = request.Phone.Trim();
        var status = request.Status.Trim();
        var acquisitionChannel = request.AcquisitionChannel.Trim();
        var organizationName = string.IsNullOrWhiteSpace(request.OrganizationName) ? null : request.OrganizationName.Trim();
        var firstName = string.IsNullOrWhiteSpace(request.FirstName) ? null : request.FirstName.Trim();
        var lastName = string.IsNullOrWhiteSpace(request.LastName) ? null : request.LastName.Trim();

        if (string.IsNullOrWhiteSpace(supporterType) || string.IsNullOrWhiteSpace(displayName) ||
            string.IsNullOrWhiteSpace(relationshipType) || string.IsNullOrWhiteSpace(region) ||
            string.IsNullOrWhiteSpace(country) || string.IsNullOrWhiteSpace(email) ||
            string.IsNullOrWhiteSpace(phone) || string.IsNullOrWhiteSpace(status) ||
            string.IsNullOrWhiteSpace(acquisitionChannel))
        {
            return BadRequest(new { error = "Missing one or more required fields." });
        }

        if (!AllowedSupporterTypes.Contains(supporterType))
            return BadRequest(new { error = "Invalid supporter_type." });
        if (!AllowedRelationshipTypes.Contains(relationshipType))
            return BadRequest(new { error = "Invalid relationship_type." });
        if (!AllowedStatuses.Contains(status))
            return BadRequest(new { error = "Invalid status." });
        if (!AllowedAcquisitionChannels.Contains(acquisitionChannel))
            return BadRequest(new { error = "Invalid acquisition_channel." });

        if (supporterType == "PartnerOrganization")
        {
            if (string.IsNullOrWhiteSpace(organizationName))
                return BadRequest(new { error = "organization_name is required for PartnerOrganization." });
        }
        else
        {
            if (string.IsNullOrWhiteSpace(firstName) || string.IsNullOrWhiteSpace(lastName))
                return BadRequest(new { error = "first_name and last_name are required for non-organization supporters." });
        }

        var supporter = new Supporter
        {
            SupporterType = supporterType,
            DisplayName = displayName,
            OrganizationName = organizationName,
            FirstName = firstName,
            LastName = lastName,
            RelationshipType = relationshipType,
            Region = region,
            Country = country,
            Email = email,
            Phone = phone,
            Status = status,
            CreatedAt = DateTime.UtcNow,
            FirstDonationDate = request.FirstDonationDate,
            AcquisitionChannel = acquisitionChannel,
        };

        try
        {
            _context.Supporters.Add(supporter);
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateException ex)
        {
            return StatusCode(500, new
            {
                error = "Failed to create supporter.",
                detail = ex.GetBaseException().Message,
            });
        }

        return CreatedAtAction(nameof(GetSupporter), new { id = supporter.SupporterId }, supporter);
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<Supporter>> UpdateSupporter(int id, [FromBody] CreateSupporterRequest request)
    {
        if (request == null) return BadRequest(new { error = "Request body is required." });

        var existing = await _context.Supporters.FirstOrDefaultAsync(s => s.SupporterId == id);
        if (existing == null) return NotFound(new { error = $"Supporter {id} not found." });

        var supporterType = request.SupporterType.Trim();
        var displayName = request.DisplayName.Trim();
        var relationshipType = request.RelationshipType.Trim();
        var region = request.Region.Trim();
        var country = request.Country.Trim();
        var email = request.Email.Trim();
        var phone = request.Phone.Trim();
        var status = request.Status.Trim();
        var acquisitionChannel = request.AcquisitionChannel.Trim();
        var organizationName = string.IsNullOrWhiteSpace(request.OrganizationName) ? null : request.OrganizationName.Trim();
        var firstName = string.IsNullOrWhiteSpace(request.FirstName) ? null : request.FirstName.Trim();
        var lastName = string.IsNullOrWhiteSpace(request.LastName) ? null : request.LastName.Trim();

        if (string.IsNullOrWhiteSpace(supporterType) || string.IsNullOrWhiteSpace(displayName) ||
            string.IsNullOrWhiteSpace(relationshipType) || string.IsNullOrWhiteSpace(region) ||
            string.IsNullOrWhiteSpace(country) || string.IsNullOrWhiteSpace(email) ||
            string.IsNullOrWhiteSpace(phone) || string.IsNullOrWhiteSpace(status) ||
            string.IsNullOrWhiteSpace(acquisitionChannel))
        {
            return BadRequest(new { error = "Missing one or more required fields." });
        }

        if (!AllowedSupporterTypes.Contains(supporterType))
            return BadRequest(new { error = "Invalid supporter_type." });
        if (!AllowedRelationshipTypes.Contains(relationshipType))
            return BadRequest(new { error = "Invalid relationship_type." });
        if (!AllowedStatuses.Contains(status))
            return BadRequest(new { error = "Invalid status." });
        if (!AllowedAcquisitionChannels.Contains(acquisitionChannel))
            return BadRequest(new { error = "Invalid acquisition_channel." });

        if (supporterType == "PartnerOrganization")
        {
            if (string.IsNullOrWhiteSpace(organizationName))
                return BadRequest(new { error = "organization_name is required for PartnerOrganization." });
        }
        else
        {
            if (string.IsNullOrWhiteSpace(firstName) || string.IsNullOrWhiteSpace(lastName))
                return BadRequest(new { error = "first_name and last_name are required for non-organization supporters." });
        }

        existing.SupporterType = supporterType;
        existing.DisplayName = displayName;
        existing.OrganizationName = organizationName;
        existing.FirstName = firstName;
        existing.LastName = lastName;
        existing.RelationshipType = relationshipType;
        existing.Region = region;
        existing.Country = country;
        existing.Email = email;
        existing.Phone = phone;
        existing.Status = status;
        existing.FirstDonationDate = request.FirstDonationDate;
        existing.AcquisitionChannel = acquisitionChannel;

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateException ex)
        {
            return StatusCode(500, new
            {
                error = "Failed to update supporter.",
                detail = ex.GetBaseException().Message,
            });
        }

        return Ok(existing);
    }
}
