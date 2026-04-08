using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace backend.Models;

[Table("home_visitations")]
public partial class HomeVisitation
{
    [Key]
    [Column("visitation_id")]
    public int VisitationId { get; set; }

    [Column("resident_id")]
    public int ResidentId { get; set; }

    [Column("visit_date")]
    public DateOnly VisitDate { get; set; }

    [Column("social_worker")]
    [StringLength(50)]
    public string SocialWorker { get; set; } = null!;

    [Column("visit_type")]
    [StringLength(50)]
    public string VisitType { get; set; } = null!;

    [Column("location_visited")]
    [StringLength(50)]
    public string LocationVisited { get; set; } = null!;

    [Column("family_members_present")]
    [StringLength(50)]
    public string FamilyMembersPresent { get; set; } = null!;

    [Column("purpose")]
    [StringLength(50)]
    public string Purpose { get; set; } = null!;

    [Column("observations")]
    public string? Observations { get; set; }

    [Column("family_cooperation_level")]
    [StringLength(50)]
    public string FamilyCooperationLevel { get; set; } = null!;

    [Column("safety_concerns_noted")]
    public bool SafetyConcernsNoted { get; set; }

    [Column("follow_up_needed")]
    public bool FollowUpNeeded { get; set; }

    [Column("follow_up_notes")]
    [StringLength(50)]
    public string? FollowUpNotes { get; set; }

    [Column("visit_outcome")]
    [StringLength(50)]
    public string VisitOutcome { get; set; } = null!;

    [ForeignKey("ResidentId")]
    [InverseProperty("HomeVisitations")]
    public virtual Resident Resident { get; set; } = null!;
}
