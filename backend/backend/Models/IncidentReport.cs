using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace backend.Models;

[Table("incident_reports")]
public partial class IncidentReport
{
    [Key]
    [Column("incident_id")]
    public int IncidentId { get; set; }

    [Column("resident_id")]
    public int ResidentId { get; set; }

    [Column("safehouse_id")]
    public int SafehouseId { get; set; }

    [Column("incident_date")]
    public DateOnly IncidentDate { get; set; }

    [Column("incident_type")]
    [StringLength(50)]
    public string IncidentType { get; set; } = null!;

    [Column("severity")]
    [StringLength(50)]
    public string Severity { get; set; } = null!;

    [Column("description")]
    public string Description { get; set; } = null!;

    [Column("response_taken")]
    public string ResponseTaken { get; set; } = null!;

    [Column("resolved")]
    public bool Resolved { get; set; }

    [Column("resolution_date")]
    public DateOnly? ResolutionDate { get; set; }

    [Column("reported_by")]
    [StringLength(50)]
    public string ReportedBy { get; set; } = null!;

    [Column("follow_up_required")]
    public bool FollowUpRequired { get; set; }

    [ForeignKey("ResidentId")]
    [InverseProperty("IncidentReports")]
    public virtual Resident Resident { get; set; } = null!;

    [ForeignKey("SafehouseId")]
    [InverseProperty("IncidentReports")]
    public virtual Safehouse Safehouse { get; set; } = null!;
}
