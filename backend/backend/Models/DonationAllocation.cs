using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace backend.Models;

[Table("donation_allocations")]
public partial class DonationAllocation
{
    [Key]
    [Column("allocation_id")]
    public int AllocationId { get; set; }

    [Column("donation_id")]
    public int DonationId { get; set; }

    [Column("safehouse_id")]
    public int SafehouseId { get; set; }

    [Column("program_area")]
    [StringLength(50)]
    public string ProgramArea { get; set; } = null!;

    [Column("amount_allocated")]
    public double AmountAllocated { get; set; }

    [Column("allocation_date")]
    public DateOnly AllocationDate { get; set; }

    [Column("allocation_notes")]
    [Unicode(false)]
    public string? AllocationNotes { get; set; }

    [ForeignKey("DonationId")]
    [InverseProperty("DonationAllocations")]
    public virtual Donation Donation { get; set; } = null!;

    [ForeignKey("SafehouseId")]
    [InverseProperty("DonationAllocations")]
    public virtual Safehouse Safehouse { get; set; } = null!;
}
