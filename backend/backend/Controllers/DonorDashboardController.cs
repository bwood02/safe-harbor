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
}
