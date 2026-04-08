using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace backend.Models;

[Table("social_media_posts")]
public partial class SocialMediaPost
{
    [Key]
    [Column("post_id")]
    public int PostId { get; set; }

    [Column("platform")]
    [StringLength(50)]
    public string Platform { get; set; } = null!;

    [Column("platform_post_id")]
    [StringLength(50)]
    public string PlatformPostId { get; set; } = null!;

    [Column("post_url")]
    [StringLength(100)]
    public string PostUrl { get; set; } = null!;

    [Column("created_at")]
    public DateTime CreatedAt { get; set; }

    [Column("day_of_week")]
    [StringLength(50)]
    public string DayOfWeek { get; set; } = null!;

    [Column("post_hour")]
    public int PostHour { get; set; }

    [Column("post_type")]
    [StringLength(50)]
    public string PostType { get; set; } = null!;

    [Column("media_type")]
    [StringLength(50)]
    public string MediaType { get; set; } = null!;

    [Column("caption")]
    [StringLength(250)]
    public string Caption { get; set; } = null!;

    [Column("hashtags")]
    [StringLength(100)]
    [Unicode(false)]
    public string? Hashtags { get; set; }

    [Column("num_hashtags")]
    public int NumHashtags { get; set; }

    [Column("mentions_count")]
    public int MentionsCount { get; set; }

    [Column("has_call_to_action")]
    public bool HasCallToAction { get; set; }

    [Column("call_to_action_type")]
    [StringLength(50)]
    public string? CallToActionType { get; set; }

    [Column("content_topic")]
    [StringLength(50)]
    public string ContentTopic { get; set; } = null!;

    [Column("sentiment_tone")]
    [StringLength(50)]
    public string SentimentTone { get; set; } = null!;

    [Column("caption_length")]
    public int CaptionLength { get; set; }

    [Column("features_resident_story")]
    public bool FeaturesResidentStory { get; set; }

    [Column("campaign_name")]
    [StringLength(50)]
    public string? CampaignName { get; set; }

    [Column("is_boosted")]
    public bool IsBoosted { get; set; }

    [Column("boost_budget_php")]
    public double? BoostBudgetPhp { get; set; }

    [Column("impressions")]
    public int Impressions { get; set; }

    [Column("reach")]
    public int Reach { get; set; }

    [Column("likes")]
    public int Likes { get; set; }

    [Column("comments")]
    public int Comments { get; set; }

    [Column("shares")]
    public int Shares { get; set; }

    [Column("saves")]
    public int Saves { get; set; }

    [Column("click_throughs", TypeName = "numeric(18, 0)")]
    public decimal ClickThroughs { get; set; }

    [Column("video_views")]
    public double? VideoViews { get; set; }

    [Column("engagement_rate")]
    public double EngagementRate { get; set; }

    [Column("profile_visits")]
    public int ProfileVisits { get; set; }

    [Column("donation_referrals")]
    public int DonationReferrals { get; set; }

    [Column("estimated_donation_value_php")]
    public double EstimatedDonationValuePhp { get; set; }

    [Column("follower_count_at_post")]
    public int FollowerCountAtPost { get; set; }

    [Column("watch_time_seconds")]
    public double? WatchTimeSeconds { get; set; }

    [Column("avg_view_duration_seconds")]
    public double? AvgViewDurationSeconds { get; set; }

    [Column("subscriber_count_at_post")]
    public double? SubscriberCountAtPost { get; set; }

    [Column("forwards")]
    public double? Forwards { get; set; }

    [InverseProperty("ReferralPost")]
    public virtual ICollection<Donation> Donations { get; set; } = new List<Donation>();
}
