using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace backend.Models;

[Table("in_kind_donation_items")]
public partial class InKindDonationItem
{
    [Key]
    [Column("item_id")]
    public int ItemId { get; set; }

    [Column("donation_id")]
    public int DonationId { get; set; }

    [Column("item_name")]
    [StringLength(50)]
    public string ItemName { get; set; } = null!;

    [Column("item_category")]
    [StringLength(50)]
    public string ItemCategory { get; set; } = null!;

    [Column("quantity")]
    public int Quantity { get; set; }

    [Column("unit_of_measure")]
    [StringLength(50)]
    public string UnitOfMeasure { get; set; } = null!;

    [Column("estimated_unit_value")]
    public double EstimatedUnitValue { get; set; }

    [Column("intended_use")]
    [StringLength(50)]
    public string IntendedUse { get; set; } = null!;

    [Column("received_condition")]
    [StringLength(50)]
    public string ReceivedCondition { get; set; } = null!;

    [ForeignKey("DonationId")]
    [InverseProperty("InKindDonationItems")]
    public virtual Donation Donation { get; set; } = null!;
}
