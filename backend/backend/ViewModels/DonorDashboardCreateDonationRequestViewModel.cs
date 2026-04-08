namespace backend.ViewModels;

public class DonorDashboardCreateDonationRequestViewModel
{
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
    public List<DonorDashboardCreateDonationAllocationRequestViewModel> DonationAllocations { get; set; } = new();
    public List<DonorDashboardCreateInKindDonationItemRequestViewModel> InKindDonationItems { get; set; } = new();
}

public class DonorDashboardCreateDonationAllocationRequestViewModel
{
    public int SafehouseId { get; set; }
    public string ProgramArea { get; set; } = string.Empty;
    public double AmountAllocated { get; set; }
    public DateOnly AllocationDate { get; set; }
    public string? AllocationNotes { get; set; }
}

public class DonorDashboardCreateInKindDonationItemRequestViewModel
{
    public string ItemName { get; set; } = string.Empty;
    public string ItemCategory { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public string UnitOfMeasure { get; set; } = string.Empty;
    public double EstimatedUnitValue { get; set; }
    public string IntendedUse { get; set; } = string.Empty;
    public string ReceivedCondition { get; set; } = string.Empty;
}

