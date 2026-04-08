namespace backend.ViewModels
{
    public class InKindDonationItemViewModel
    {
        public int ItemId { get; set; }
        public int DonationId { get; set; }
        public string ItemName { get; set; } = string.Empty;
        public string ItemCategory { get; set; } = string.Empty;
        public int Quantity { get; set; }
        public string UnitOfMeasure { get; set; } = string.Empty;
        public double EstimatedUnitValue { get; set; }
        public string IntendedUse { get; set; } = string.Empty;
        public string ReceivedCondition { get; set; } = string.Empty;
    }
}
