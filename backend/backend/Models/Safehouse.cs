using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace backend.Models;

[Table("safehouses")]
public partial class Safehouse
{
    [Key]
    [Column("safehouse_id")]
    public int SafehouseId { get; set; }

    [Column("safehouse_code")]
    [StringLength(50)]
    public string SafehouseCode { get; set; } = null!;

    [Column("name")]
    [StringLength(50)]
    public string Name { get; set; } = null!;

    [Column("region")]
    [StringLength(50)]
    public string Region { get; set; } = null!;

    [Column("city")]
    [StringLength(50)]
    public string City { get; set; } = null!;

    [Column("province")]
    [StringLength(50)]
    public string Province { get; set; } = null!;

    [Column("country")]
    [StringLength(50)]
    public string Country { get; set; } = null!;

    [Column("open_date")]
    public DateOnly OpenDate { get; set; }

    [Column("status")]
    [StringLength(50)]
    public string Status { get; set; } = null!;

    [Column("capacity_girls")]
    public byte CapacityGirls { get; set; }

    [Column("capacity_staff")]
    public byte CapacityStaff { get; set; }

    [Column("current_occupancy")]
    public byte CurrentOccupancy { get; set; }

    [Column("notes")]
    [StringLength(1)]
    public string? Notes { get; set; }

    [InverseProperty("Safehouse")]
    public virtual ICollection<DonationAllocation> DonationAllocations { get; set; } = new List<DonationAllocation>();

    [InverseProperty("Safehouse")]
    public virtual ICollection<IncidentReport> IncidentReports { get; set; } = new List<IncidentReport>();

    [InverseProperty("Safehouse")]
    public virtual ICollection<PartnerAssignment> PartnerAssignments { get; set; } = new List<PartnerAssignment>();

    [InverseProperty("Safehouse")]
    public virtual ICollection<Resident> Residents { get; set; } = new List<Resident>();

    [InverseProperty("Safehouse")]
    public virtual ICollection<SafehouseMonthlyMetric> SafehouseMonthlyMetrics { get; set; } = new List<SafehouseMonthlyMetric>();
}
