namespace backend.ViewModels;

public class DonationAllocationViewModel
{
    public int AllocationId { get; set; }
    public int DonationId { get; set; }
    public int SafehouseId { get; set; }
    public string ProgramArea { get; set; } = string.Empty;
    public double AmountAllocated { get; set; }
    public DateOnly AllocationDate { get; set; }
    public string? AllocationNotes { get; set; }
}