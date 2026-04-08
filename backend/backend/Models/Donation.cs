using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace backend.Models;

[Table("donations")]
public partial class Donation
{
    [Key]
    [Column("donation_id")]
    public int DonationId { get; set; }

    [Column("supporter_id")]
    public int SupporterId { get; set; }

    [Column("donation_type")]
    [StringLength(50)]
    public string DonationType { get; set; } = null!;

    [Column("donation_date")]
    public DateOnly? DonationDate { get; set; }

    [Column("is_recurring")]
    public bool IsRecurring { get; set; }

    [Column("campaign_name")]
    public string? CampaignName { get; set; }

    [Column("channel_source")]
    [StringLength(50)]
    public string? ChannelSource { get; set; }

    [Column("currency_code")]
    [StringLength(50)]
    public string? CurrencyCode { get; set; }

    [Column("amount")]
    public double? Amount { get; set; }

    [Column("estimated_value")]
    public double EstimatedValue { get; set; }

    [Column("impact_unit")]
    [StringLength(50)]
    public string ImpactUnit { get; set; } = null!;

    [Column("notes")]
    public string? Notes { get; set; }

    [Column("referral_post_id")]
    public int? ReferralPostId { get; set; }

    [InverseProperty("Donation")]
    public virtual ICollection<DonationAllocation> DonationAllocations { get; set; } = new List<DonationAllocation>();

    [InverseProperty("Donation")]
    public virtual ICollection<InKindDonationItem> InKindDonationItems { get; set; } = new List<InKindDonationItem>();

    [ForeignKey("ReferralPostId")]
    [InverseProperty("Donations")]
    public virtual SocialMediaPost? ReferralPost { get; set; }

    [ForeignKey("SupporterId")]
    [InverseProperty("Donations")]
    public virtual Supporter Supporter { get; set; } = null!;
}
