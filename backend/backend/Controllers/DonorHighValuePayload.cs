using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers;

/// <summary>
/// JSON for Python <c>build_donor_high_value_model_df_from_payload</c> (snake_case keys).
/// </summary>
internal static class DonorHighValuePayload
{
    public static async Task<object> BuildAsync(
        MainAppDbContext ctx,
        DateOnly asOf,
        IReadOnlyList<int> supporterIds,
        CancellationToken ct)
    {
        var ids = supporterIds.ToList();
        if (ids.Count == 0)
        {
            return new
            {
                as_of = asOf.ToString("yyyy-MM-dd"),
                supporters = Array.Empty<object>(),
                donations = Array.Empty<object>(),
                donation_allocations = Array.Empty<object>(),
            };
        }

        var supporters = await ctx.Supporters.AsNoTracking()
            .Where(s => ids.Contains(s.SupporterId))
            .Select(s => new
            {
                supporter_id = s.SupporterId,
                supporter_type = s.SupporterType,
                relationship_type = s.RelationshipType,
                region = s.Region,
                country = s.Country,
                acquisition_channel = s.AcquisitionChannel,
                created_at = s.CreatedAt.ToString("yyyy-MM-dd HH:mm:ss"),
            })
            .ToListAsync(ct);

        var donations = await ctx.Donations.AsNoTracking()
            .Where(d => ids.Contains(d.SupporterId) && d.DonationDate != null)
            .OrderBy(d => d.DonationDate)
            .Select(d => new
            {
                donation_id = d.DonationId,
                supporter_id = d.SupporterId,
                donation_type = d.DonationType,
                donation_date = d.DonationDate!.Value.ToString("yyyy-MM-dd"),
                is_recurring = d.IsRecurring,
                campaign_name = d.CampaignName ?? "",
                channel_source = d.ChannelSource ?? "",
                amount = d.Amount ?? 0.0,
                estimated_value = d.EstimatedValue,
            })
            .ToListAsync(ct);

        var donationIds = donations.Select(d => d.donation_id).ToList();
        var allocations = await ctx.DonationAllocations.AsNoTracking()
            .Where(a => donationIds.Contains(a.DonationId))
            .Select(a => new
            {
                donation_id = a.DonationId,
                allocation_date = a.AllocationDate.ToString("yyyy-MM-dd"),
                program_area = a.ProgramArea,
                amount_allocated = a.AmountAllocated,
            })
            .ToListAsync(ct);

        return new
        {
            as_of = asOf.ToString("yyyy-MM-dd"),
            supporters,
            donations,
            donation_allocations = allocations,
        };
    }
}
