using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers;

/// <summary>
/// Social posts + donations for Python <c>build_social_engagement_from_payload</c>.
/// </summary>
internal static class SocialEngagementPayload
{
    public static async Task<object> BuildAsync(MainAppDbContext ctx, DateOnly asOf, CancellationToken ct)
    {
        var social = await ctx.SocialMediaPosts.AsNoTracking()
            .Select(p => new
            {
                post_id = p.PostId,
                created_at = p.CreatedAt.ToString("yyyy-MM-dd HH:mm:ss"),
                day_of_week = p.DayOfWeek,
                post_hour = p.PostHour,
                post_type = p.PostType,
                media_type = p.MediaType,
                has_call_to_action = p.HasCallToAction,
                content_topic = p.ContentTopic,
                is_boosted = p.IsBoosted,
                boost_budget_php = p.BoostBudgetPhp ?? 0.0,
                likes = p.Likes,
                comments = p.Comments,
                shares = p.Shares,
                forwards = p.Forwards ?? 0.0,
                click_throughs = (double)p.ClickThroughs,
                engagement_rate = p.EngagementRate,
            })
            .ToListAsync(ct);

        var donations = await ctx.Donations.AsNoTracking()
            .Where(d => d.DonationDate != null)
            .Select(d => new
            {
                donation_id = d.DonationId,
                supporter_id = d.SupporterId,
                donation_date = d.DonationDate!.Value.ToString("yyyy-MM-dd"),
                amount = d.Amount ?? 0.0,
                estimated_value = d.EstimatedValue,
            })
            .ToListAsync(ct);

        return new
        {
            as_of = asOf.ToString("yyyy-MM-dd"),
            social_media_posts = social,
            donations,
        };
    }
}
