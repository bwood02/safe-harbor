using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Models;
using backend.ViewModels;
using CurrencyToPhp = global::backend.CurrencyToPhp;

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

    /// <summary>
    /// Safehouses and program areas for admin/staff donation forms (e.g. allocation dropdowns).
    /// </summary>
    public class DonationFormSafehouseOptionDto
    {
        public int SafehouseId { get; set; }
        public string Name { get; set; } = "";
        public string Region { get; set; } = "";
        public string City { get; set; } = "";
        public string Status { get; set; } = "";
    }

    public class DonationFormContextDto
    {
        public List<DonationFormSafehouseOptionDto> Safehouses { get; set; } = new();
        public List<string> ProgramAreas { get; set; } = new();
    }

    [HttpGet("form-context")]
    public async Task<ActionResult<DonationFormContextDto>> GetFormContext()
    {
        var safehouses = await _context.Safehouses
            .AsNoTracking()
            .OrderBy(s => s.Name)
            .ThenBy(s => s.City)
            .Select(s => new DonationFormSafehouseOptionDto
            {
                SafehouseId = s.SafehouseId,
                Name = s.Name,
                Region = s.Region,
                City = s.City,
                Status = s.Status,
            })
            .ToListAsync();

        var areasFromDb = await _context.DonationAllocations
            .AsNoTracking()
            .Select(a => a.ProgramArea)
            .Distinct()
            .ToListAsync();

        var defaultAreas = new[]
        {
            "Education", "Wellbeing", "Operations", "Transport", "Maintenance", "Outreach",
        };

        var programAreas = areasFromDb
            .Concat(defaultAreas)
            .Where(a => !string.IsNullOrWhiteSpace(a))
            .Select(a => a.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .OrderBy(a => a, StringComparer.OrdinalIgnoreCase)
            .ToList();

        return Ok(new DonationFormContextDto
        {
            Safehouses = safehouses,
            ProgramAreas = programAreas,
        });
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
        var raw = await _context.DonationAllocations
            .AsNoTracking()
            .Join(
                _context.Donations.AsNoTracking(),
                a => a.DonationId,
                d => d.DonationId,
                (a, d) => new { a.ProgramArea, a.AmountAllocated, d.CurrencyCode })
            .ToListAsync();

        var rows = raw
            .GroupBy(x => x.ProgramArea)
            .Select(g => new ProgramAreaTotalDto
            {
                ProgramArea = g.Key,
                Total = g.Sum(x => CurrencyToPhp.Convert(x.AmountAllocated, x.CurrencyCode)),
                Count = g.Count(),
            })
            .OrderByDescending(r => r.Total)
            .ToList();

        return Ok(rows);
    }

    [HttpGet("by-program-area/supporter/{supporterId:int}")]
    public async Task<ActionResult<IEnumerable<ProgramAreaTotalDto>>> GetByProgramAreaForSupporter(int supporterId)
    {
        var raw = await _context.DonationAllocations
            .AsNoTracking()
            .Join(
                _context.Donations.AsNoTracking().Where(d => d.SupporterId == supporterId),
                a => a.DonationId,
                d => d.DonationId,
                (a, d) => new { a.ProgramArea, a.AmountAllocated, d.CurrencyCode })
            .ToListAsync();

        var rows = raw
            .GroupBy(x => x.ProgramArea)
            .Select(g => new ProgramAreaTotalDto
            {
                ProgramArea = g.Key,
                Total = g.Sum(x => CurrencyToPhp.Convert(x.AmountAllocated, x.CurrencyCode)),
                Count = g.Count(),
            })
            .OrderByDescending(r => r.Total)
            .ToList();

        return Ok(rows);
    }

    /// <summary>
    /// Full donation detail for a supporter (allocations + in-kind lines). Verifies supporter ownership.
    /// </summary>
    [HttpGet("{id:int}")]
    public async Task<ActionResult<DonorDashboardDonationViewModel>> GetDonationForSupporter(
        int id,
        [FromQuery] int supporterId)
    {
        if (supporterId <= 0)
        {
            return BadRequest("supporterId must be a positive integer.");
        }

        var vm = await LoadDonationViewModelAsync(id);
        if (vm == null)
        {
            return NotFound();
        }

        if (vm.SupporterId != supporterId)
        {
            return BadRequest("Donation does not belong to the specified supporter.");
        }

        return Ok(vm);
    }

    /// <summary>
    /// Updates a donation for the given supporter. Replaces all donation_allocations and in_kind_donation_items
    /// with the lists in the request (empty lists clear them).
    /// </summary>
    [HttpPut("{id:int}")]
    public async Task<ActionResult<DonorDashboardDonationViewModel>> UpdateDonation(
        int id,
        [FromBody] DonorDashboardCreateDonationRequestViewModel request)
    {
        if (request == null)
        {
            return BadRequest("Request body is required.");
        }

        if (request.SupporterId <= 0)
        {
            return BadRequest("supporterId must be a positive integer.");
        }

        if (string.IsNullOrWhiteSpace(request.DonationType))
        {
            return BadRequest("donationType is required.");
        }

        if (string.IsNullOrWhiteSpace(request.ImpactUnit))
        {
            return BadRequest("impactUnit is required.");
        }

        if (request.EstimatedValue < 0)
        {
            return BadRequest("estimatedValue cannot be negative.");
        }

        var supporterExists = await _context.Supporters
            .AsNoTracking()
            .AnyAsync(s => s.SupporterId == request.SupporterId);
        if (!supporterExists)
        {
            return BadRequest($"Supporter {request.SupporterId} does not exist.");
        }

        if (request.ReferralPostId.HasValue)
        {
            var postExists = await _context.SocialMediaPosts
                .AsNoTracking()
                .AnyAsync(p => p.PostId == request.ReferralPostId.Value);
            if (!postExists)
            {
                return BadRequest($"Referral post {request.ReferralPostId.Value} does not exist.");
            }
        }

        if (request.DonationAllocations.Count > 0)
        {
            var requestedSafehouseIds = request.DonationAllocations
                .Select(a => a.SafehouseId)
                .Distinct()
                .ToList();
            var existingSafehouseIds = await _context.Safehouses
                .AsNoTracking()
                .Where(s => requestedSafehouseIds.Contains(s.SafehouseId))
                .Select(s => s.SafehouseId)
                .ToListAsync();
            var missingSafehouseId = requestedSafehouseIds
                .FirstOrDefault(sid => !existingSafehouseIds.Contains(sid));
            if (missingSafehouseId != 0)
            {
                return BadRequest($"Safehouse {missingSafehouseId} does not exist.");
            }
        }

        var donation = await _context.Donations
            .Include(d => d.DonationAllocations)
            .Include(d => d.InKindDonationItems)
            .FirstOrDefaultAsync(d => d.DonationId == id);

        if (donation == null)
        {
            return NotFound();
        }

        if (donation.SupporterId != request.SupporterId)
        {
            return BadRequest("Donation does not belong to the specified supporter.");
        }

        await using var tx = await _context.Database.BeginTransactionAsync();
        try
        {
            _context.DonationAllocations.RemoveRange(donation.DonationAllocations);
            _context.InKindDonationItems.RemoveRange(donation.InKindDonationItems);

            donation.DonationType = request.DonationType.Trim();
            donation.DonationDate = request.DonationDate;
            donation.IsRecurring = request.IsRecurring;
            donation.CampaignName = string.IsNullOrWhiteSpace(request.CampaignName) ? null : request.CampaignName.Trim();
            donation.ChannelSource = string.IsNullOrWhiteSpace(request.ChannelSource) ? null : request.ChannelSource.Trim();
            donation.CurrencyCode = string.IsNullOrWhiteSpace(request.CurrencyCode) ? null : request.CurrencyCode.Trim();
            donation.Amount = request.Amount;
            donation.EstimatedValue = request.EstimatedValue;
            donation.ImpactUnit = request.ImpactUnit.Trim();
            donation.Notes = string.IsNullOrWhiteSpace(request.Notes) ? null : request.Notes.Trim();
            donation.ReferralPostId = request.ReferralPostId;

            foreach (var a in request.DonationAllocations)
            {
                _context.DonationAllocations.Add(new DonationAllocation
                {
                    DonationId = donation.DonationId,
                    SafehouseId = a.SafehouseId,
                    ProgramArea = a.ProgramArea.Trim(),
                    AmountAllocated = a.AmountAllocated,
                    AllocationDate = a.AllocationDate,
                    AllocationNotes = string.IsNullOrWhiteSpace(a.AllocationNotes) ? null : a.AllocationNotes.Trim(),
                });
            }

            foreach (var i in request.InKindDonationItems)
            {
                _context.InKindDonationItems.Add(new InKindDonationItem
                {
                    DonationId = donation.DonationId,
                    ItemName = i.ItemName.Trim(),
                    ItemCategory = i.ItemCategory.Trim(),
                    Quantity = i.Quantity,
                    UnitOfMeasure = i.UnitOfMeasure.Trim(),
                    EstimatedUnitValue = i.EstimatedUnitValue,
                    IntendedUse = i.IntendedUse.Trim(),
                    ReceivedCondition = i.ReceivedCondition.Trim(),
                });
            }

            await _context.SaveChangesAsync();
            await tx.CommitAsync();

            var updated = await LoadDonationViewModelAsync(donation.DonationId);
            if (updated == null)
            {
                return StatusCode(500, new { error = "Failed to load donation after update." });
            }

            return Ok(updated);
        }
        catch (Exception ex)
        {
            await tx.RollbackAsync();
            return StatusCode(500, new { error = "Failed to update donation.", detail = ex.Message });
        }
    }

    private async Task<DonorDashboardDonationViewModel?> LoadDonationViewModelAsync(int donationId)
    {
        return await _context.Donations
            .AsNoTracking()
            .Where(d => d.DonationId == donationId)
            .Select(d => new DonorDashboardDonationViewModel
            {
                DonationId = d.DonationId,
                SupporterId = d.SupporterId,
                DonationType = d.DonationType,
                DonationDate = d.DonationDate,
                IsRecurring = d.IsRecurring,
                CampaignName = d.CampaignName,
                ChannelSource = d.ChannelSource,
                CurrencyCode = d.CurrencyCode,
                Amount = d.Amount,
                EstimatedValue = d.EstimatedValue,
                ImpactUnit = d.ImpactUnit,
                Notes = d.Notes,
                ReferralPostId = d.ReferralPostId,
                DonationAllocations = d.DonationAllocations
                    .Select(a => new DonationAllocationViewModel
                    {
                        AllocationId = a.AllocationId,
                        DonationId = a.DonationId,
                        SafehouseId = a.SafehouseId,
                        ProgramArea = a.ProgramArea,
                        AmountAllocated = a.AmountAllocated,
                        AllocationDate = a.AllocationDate,
                        AllocationNotes = a.AllocationNotes,
                    }).ToList(),
                InKindDonationItems = d.InKindDonationItems
                    .Select(i => new InKindDonationItemViewModel
                    {
                        ItemId = i.ItemId,
                        DonationId = i.DonationId,
                        ItemName = i.ItemName,
                        ItemCategory = i.ItemCategory,
                        Quantity = i.Quantity,
                        UnitOfMeasure = i.UnitOfMeasure,
                        EstimatedUnitValue = i.EstimatedUnitValue,
                        IntendedUse = i.IntendedUse,
                        ReceivedCondition = i.ReceivedCondition,
                    }).ToList(),
            })
            .FirstOrDefaultAsync();
    }
}
