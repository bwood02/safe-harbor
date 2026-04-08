using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace backend.Models;

[Table("partner_assignments")]
public partial class PartnerAssignment
{
    [Key]
    [Column("assignment_id")]
    public int AssignmentId { get; set; }

    [Column("partner_id")]
    public int PartnerId { get; set; }

    [Column("safehouse_id")]
    public int? SafehouseId { get; set; }

    [Column("program_area")]
    [StringLength(50)]
    public string ProgramArea { get; set; } = null!;

    [Column("assignment_start")]
    public DateOnly AssignmentStart { get; set; }

    [Column("assignment_end")]
    public DateOnly? AssignmentEnd { get; set; }

    [Column("responsibility_notes")]
    [StringLength(250)]
    public string ResponsibilityNotes { get; set; } = null!;

    [Column("is_primary")]
    public bool IsPrimary { get; set; }

    [Column("status")]
    [StringLength(50)]
    public string Status { get; set; } = null!;

    [ForeignKey("PartnerId")]
    [InverseProperty("PartnerAssignments")]
    public virtual Partner Partner { get; set; } = null!;

    [ForeignKey("SafehouseId")]
    [InverseProperty("PartnerAssignments")]
    public virtual Safehouse? Safehouse { get; set; }
}
