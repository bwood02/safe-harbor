using backend.Models;
using backend.ViewModels;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers;

[Route("api/[controller]")]
[ApiController]
public class DonorDashboard : ControllerBase
{
    private readonly MainAppDbContext _context;

    public DonorDashboard(MainAppDbContext context)
    {
        _context = context;
    }

    [HttpGet("GetDonations")]
    public async Task<ActionResult<List<DonorDashboardDonationViewModel>>> GetDonations([FromQuery] int supporter_id)
    {
        if (supporter_id <= 0)
        {
            return BadRequest("supporter_id must be a positive integer.");
        }

        var donations = await _context.Donations
            .AsNoTracking()
            .Where(d => d.SupporterId == supporter_id)
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
                        AllocationNotes = a.AllocationNotes
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
                        ReceivedCondition = i.ReceivedCondition
                    }).ToList()
            })
            .OrderByDescending(d => d.DonationDate)
            .ThenByDescending(d => d.DonationId)
            .ToListAsync();

        return Ok(donations);
    }

    [HttpPost("CreateDonation")]
    public async Task<ActionResult<DonorDashboardDonationViewModel>> CreateDonation(
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
                .FirstOrDefault(id => !existingSafehouseIds.Contains(id));
            if (missingSafehouseId != 0)
            {
                return BadRequest($"Safehouse {missingSafehouseId} does not exist.");
            }
        }

        await using var tx = await _context.Database.BeginTransactionAsync();
        try
        {
            var donation = new Donation
            {
                SupporterId = request.SupporterId,
                DonationType = request.DonationType.Trim(),
                DonationDate = request.DonationDate,
                IsRecurring = request.IsRecurring,
                CampaignName = string.IsNullOrWhiteSpace(request.CampaignName) ? null : request.CampaignName.Trim(),
                ChannelSource = string.IsNullOrWhiteSpace(request.ChannelSource) ? null : request.ChannelSource.Trim(),
                CurrencyCode = string.IsNullOrWhiteSpace(request.CurrencyCode) ? null : request.CurrencyCode.Trim(),
                Amount = request.Amount,
                EstimatedValue = request.EstimatedValue,
                ImpactUnit = request.ImpactUnit.Trim(),
                Notes = string.IsNullOrWhiteSpace(request.Notes) ? null : request.Notes.Trim(),
                ReferralPostId = request.ReferralPostId
            };

            _context.Donations.Add(donation);
            await _context.SaveChangesAsync();

            if (request.DonationAllocations.Count > 0)
            {
                foreach (var a in request.DonationAllocations)
                {
                    _context.DonationAllocations.Add(new DonationAllocation
                    {
                        DonationId = donation.DonationId,
                        SafehouseId = a.SafehouseId,
                        ProgramArea = a.ProgramArea.Trim(),
                        AmountAllocated = a.AmountAllocated,
                        AllocationDate = a.AllocationDate,
                        AllocationNotes = string.IsNullOrWhiteSpace(a.AllocationNotes) ? null : a.AllocationNotes.Trim()
                    });
                }
            }

            if (request.InKindDonationItems.Count > 0)
            {
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
                        ReceivedCondition = i.ReceivedCondition.Trim()
                    });
                }
            }

            await _context.SaveChangesAsync();
            await tx.CommitAsync();

            var created = await _context.Donations
                .AsNoTracking()
                .Where(d => d.DonationId == donation.DonationId)
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
                            AllocationNotes = a.AllocationNotes
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
                            ReceivedCondition = i.ReceivedCondition
                        }).ToList()
                })
                .FirstAsync();

            return CreatedAtAction(
                nameof(GetDonations),
                new { supporter_id = created.SupporterId },
                created
            );
        }
        catch (Exception ex)
        {
            await tx.RollbackAsync();
            return StatusCode(500, new { error = "Failed to create donation.", detail = ex.Message });
        }
    }
}
