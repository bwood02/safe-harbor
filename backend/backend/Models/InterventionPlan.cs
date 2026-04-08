using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace backend.Models;

[Table("intervention_plans")]
public partial class InterventionPlan
{
    [Key]
    [Column("plan_id")]
    public int PlanId { get; set; }

    [Column("resident_id")]
    public int ResidentId { get; set; }

    [Column("plan_category")]
    [StringLength(50)]
    public string PlanCategory { get; set; } = null!;

    [Column("plan_description")]
    public string PlanDescription { get; set; } = null!;

    [Column("services_provided")]
    public string ServicesProvided { get; set; } = null!;

    [Column("target_value")]
    public double TargetValue { get; set; }

    [Column("target_date")]
    public DateOnly TargetDate { get; set; }

    [Column("status")]
    [StringLength(50)]
    public string Status { get; set; } = null!;

    [Column("case_conference_date")]
    public DateOnly? CaseConferenceDate { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; }

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; }

    [ForeignKey("ResidentId")]
    [InverseProperty("InterventionPlans")]
    public virtual Resident Resident { get; set; } = null!;
}
