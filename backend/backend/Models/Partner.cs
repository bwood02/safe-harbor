using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace backend.Models;

[Table("partners")]
public partial class Partner
{
    [Key]
    [Column("partner_id")]
    public int PartnerId { get; set; }

    [Column("partner_name")]
    [StringLength(50)]
    public string PartnerName { get; set; } = null!;

    [Column("partner_type")]
    [StringLength(50)]
    public string PartnerType { get; set; } = null!;

    [Column("role_type")]
    [StringLength(50)]
    public string RoleType { get; set; } = null!;

    [Column("contact_name")]
    [StringLength(50)]
    public string ContactName { get; set; } = null!;

    [Column("email")]
    [StringLength(50)]
    public string Email { get; set; } = null!;

    [Column("phone")]
    [StringLength(50)]
    public string Phone { get; set; } = null!;

    [Column("region")]
    [StringLength(50)]
    public string Region { get; set; } = null!;

    [Column("status")]
    [StringLength(50)]
    public string Status { get; set; } = null!;

    [Column("start_date")]
    public DateOnly StartDate { get; set; }

    [Column("end_date")]
    public DateOnly? EndDate { get; set; }

    [Column("notes")]
    [StringLength(50)]
    public string Notes { get; set; } = null!;

    [InverseProperty("Partner")]
    public virtual ICollection<PartnerAssignment> PartnerAssignments { get; set; } = new List<PartnerAssignment>();
}
