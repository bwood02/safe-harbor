namespace backend.ViewModels;

public class DonorDashboardDonationViewModel
{
    public int DonationId { get; set; }
    public int SupporterId { get; set; }
    public string DonationType { get; set; } = string.Empty;
    public DateOnly? DonationDate { get; set; }
    public bool IsRecurring { get; set; }
    public string? CampaignName { get; set; }
    public string? ChannelSource { get; set; }
    public string? CurrencyCode { get; set; }
    public double? Amount { get; set; }
    public double EstimatedValue { get; set; }
    public string ImpactUnit { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public int? ReferralPostId { get; set; }
    public List<DonationAllocationViewModel> DonationAllocations { get; set; } = new();
    public List<InKindDonationItemViewModel> InKindDonationItems { get; set; } = new();
}