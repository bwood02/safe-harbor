using System.Globalization;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Models;

namespace backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = AuthRoles.Admin)]
    public class SocialMediaController : ControllerBase
    {
        private readonly MainAppDbContext _context;

        public SocialMediaController(MainAppDbContext context)
        {
            _context = context;
        }

        public sealed class PlatformInsightRow
        {
            public string Platform { get; set; } = "";
            public int Posts { get; set; }
            public double AvgEngagementRate { get; set; }
            public int DonationReferrals { get; set; }
            public double EstimatedDonationValuePhp { get; set; }
            public double DonationValuePerPostPhp { get; set; }
        }

        public sealed class ContentInsightRow
        {
            public string ContentTopic { get; set; } = "";
            public int Posts { get; set; }
            public double AvgLikes { get; set; }
            public int DonationReferrals { get; set; }
            public double EstimatedDonationValuePhp { get; set; }
            public double DonationValuePerPostPhp { get; set; }
        }

        public sealed class TimeOfDayInsightRow
        {
            public string TimeBucket { get; set; } = "";
            public int Posts { get; set; }
            public double AvgEngagementRate { get; set; }
            public int DonationReferrals { get; set; }
            public double EstimatedDonationValuePhp { get; set; }
            public double DonationValuePerPostPhp { get; set; }
        }

        [HttpGet("insights-summary")]
        public async Task<ActionResult<object>> GetInsightsSummary(CancellationToken ct)
        {
            var posts = await _context.SocialMediaPosts
                .AsNoTracking()
                .Select(p => new
                {
                    p.Platform,
                    p.CreatedAt,
                    p.PostHour,
                    p.ContentTopic,
                    p.EngagementRate,
                    p.Likes,
                    p.DonationReferrals,
                    p.EstimatedDonationValuePhp,
                })
                .ToListAsync(ct);

            if (posts.Count == 0)
            {
                return Ok(new
                {
                    sampleSize = 0,
                    platformPerformance = Array.Empty<PlatformInsightRow>(),
                    contentPerformance = Array.Empty<ContentInsightRow>(),
                    timeOfDayPerformance = Array.Empty<TimeOfDayInsightRow>(),
                    recommendedPostsPerWeek = 0,
                    recommendationNote = "No historical social media posts were found.",
                });
            }

            static double SafeAvg(IEnumerable<double> vals) => vals.Any() ? vals.Average() : 0.0;

            var byPlatform = posts
                .GroupBy(p => p.Platform)
                .Select(g =>
                {
                    var postCount = g.Count();
                    var donationTotal = g.Sum(x => x.EstimatedDonationValuePhp);
                    return new PlatformInsightRow
                    {
                        Platform = g.Key,
                        Posts = postCount,
                        AvgEngagementRate = SafeAvg(g.Select(x => x.EngagementRate)),
                        DonationReferrals = g.Sum(x => x.DonationReferrals),
                        EstimatedDonationValuePhp = donationTotal,
                        DonationValuePerPostPhp = postCount > 0 ? donationTotal / postCount : 0,
                    };
                })
                .OrderByDescending(r => r.DonationValuePerPostPhp)
                .ThenByDescending(r => r.DonationReferrals)
                .ToList();

            var byContent = posts
                .GroupBy(p => p.ContentTopic)
                .Select(g =>
                {
                    var postCount = g.Count();
                    var donationTotal = g.Sum(x => x.EstimatedDonationValuePhp);
                    return new ContentInsightRow
                    {
                        ContentTopic = g.Key,
                        Posts = postCount,
                        AvgLikes = SafeAvg(g.Select(x => (double)x.Likes)),
                        DonationReferrals = g.Sum(x => x.DonationReferrals),
                        EstimatedDonationValuePhp = donationTotal,
                        DonationValuePerPostPhp = postCount > 0 ? donationTotal / postCount : 0,
                    };
                })
                .OrderByDescending(r => r.DonationValuePerPostPhp)
                .ThenByDescending(r => r.AvgLikes)
                .ToList();

            static string BucketForHour(int hour)
            {
                if (hour < 6) return "Late Night (12am-5am)";
                if (hour < 12) return "Morning (6am-11am)";
                if (hour < 18) return "Afternoon (12pm-5pm)";
                return "Evening (6pm-11pm)";
            }

            var byTime = posts
                .GroupBy(p => BucketForHour(p.PostHour))
                .Select(g =>
                {
                    var postCount = g.Count();
                    var donationTotal = g.Sum(x => x.EstimatedDonationValuePhp);
                    return new TimeOfDayInsightRow
                    {
                        TimeBucket = g.Key,
                        Posts = postCount,
                        AvgEngagementRate = SafeAvg(g.Select(x => x.EngagementRate)),
                        DonationReferrals = g.Sum(x => x.DonationReferrals),
                        EstimatedDonationValuePhp = donationTotal,
                        DonationValuePerPostPhp = postCount > 0 ? donationTotal / postCount : 0,
                    };
                })
                .OrderByDescending(r => r.DonationValuePerPostPhp)
                .ThenByDescending(r => r.DonationReferrals)
                .ToList();

            var byIsoWeek = posts
                .GroupBy(p => new
                {
                    Year = ISOWeek.GetYear(p.CreatedAt),
                    Week = ISOWeek.GetWeekOfYear(p.CreatedAt),
                })
                .Select(g => new
                {
                    Posts = g.Count(),
                    DonationPerPost = g.Sum(x => x.EstimatedDonationValuePhp) / Math.Max(1, g.Count()),
                })
                .ToList();

            var bestWeeks = byIsoWeek
                .OrderByDescending(w => w.DonationPerPost)
                .Take(Math.Max(1, (int)Math.Ceiling(byIsoWeek.Count * 0.25)))
                .ToList();

            var recommendedPostsPerWeek = (int)Math.Round(bestWeeks.Average(w => w.Posts));
            if (recommendedPostsPerWeek < 1) recommendedPostsPerWeek = 1;

            var recommendationNote =
                "Based on historical performance, weeks with around "
                + recommendedPostsPerWeek
                + " posts had the strongest donation value per post.";

            return Ok(new
            {
                sampleSize = posts.Count,
                platformPerformance = byPlatform,
                contentPerformance = byContent,
                timeOfDayPerformance = byTime,
                recommendedPostsPerWeek,
                recommendationNote,
            });
        }
    }
}
