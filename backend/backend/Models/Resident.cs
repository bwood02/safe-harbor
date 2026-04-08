using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace backend.Models;

[Table("residents")]
public partial class Resident
{
    [Key]
    [Column("resident_id")]
    public int ResidentId { get; set; }

    [Column("case_control_no")]
    [StringLength(50)]
    public string CaseControlNo { get; set; } = null!;

    [Column("internal_code", TypeName = "money")]
    public decimal InternalCode { get; set; }

    [Column("safehouse_id")]
    public int SafehouseId { get; set; }

    [Column("case_status")]
    [StringLength(50)]
    public string CaseStatus { get; set; } = null!;

    [Column("sex")]
    [StringLength(50)]
    public string Sex { get; set; } = null!;

    [Column("date_of_birth")]
    public DateOnly DateOfBirth { get; set; }

    [Column("birth_status")]
    [StringLength(50)]
    public string BirthStatus { get; set; } = null!;

    [Column("place_of_birth")]
    [StringLength(50)]
    public string PlaceOfBirth { get; set; } = null!;

    [Column("religion")]
    [StringLength(50)]
    public string Religion { get; set; } = null!;

    [Column("case_category")]
    [StringLength(50)]
    public string CaseCategory { get; set; } = null!;

    [Column("sub_cat_orphaned")]
    public bool SubCatOrphaned { get; set; }

    [Column("sub_cat_trafficked")]
    public bool SubCatTrafficked { get; set; }

    [Column("sub_cat_child_labor")]
    public bool SubCatChildLabor { get; set; }

    [Column("sub_cat_physical_abuse")]
    public bool SubCatPhysicalAbuse { get; set; }

    [Column("sub_cat_sexual_abuse")]
    public bool SubCatSexualAbuse { get; set; }

    [Column("sub_cat_osaec")]
    public bool SubCatOsaec { get; set; }

    [Column("sub_cat_cicl")]
    public bool SubCatCicl { get; set; }

    [Column("sub_cat_at_risk")]
    public bool SubCatAtRisk { get; set; }

    [Column("sub_cat_street_child")]
    public bool SubCatStreetChild { get; set; }

    [Column("sub_cat_child_with_hiv")]
    public bool SubCatChildWithHiv { get; set; }

    [Column("is_pwd")]
    public bool IsPwd { get; set; }

    [Column("pwd_type")]
    [StringLength(50)]
    public string? PwdType { get; set; }

    [Column("has_special_needs")]
    public bool HasSpecialNeeds { get; set; }

    [Column("special_needs_diagnosis")]
    [StringLength(50)]
    public string? SpecialNeedsDiagnosis { get; set; }

    [Column("family_is_4ps")]
    public bool FamilyIs4ps { get; set; }

    [Column("family_solo_parent")]
    public bool FamilySoloParent { get; set; }

    [Column("family_indigenous")]
    public bool FamilyIndigenous { get; set; }

    [Column("family_parent_pwd")]
    public bool FamilyParentPwd { get; set; }

    [Column("family_informal_settler")]
    public bool FamilyInformalSettler { get; set; }

    [Column("date_of_admission")]
    public DateOnly DateOfAdmission { get; set; }

    [Column("age_upon_admission")]
    [StringLength(50)]
    public string AgeUponAdmission { get; set; } = null!;

    [Column("present_age")]
    [StringLength(50)]
    public string PresentAge { get; set; } = null!;

    [Column("length_of_stay")]
    [StringLength(50)]
    public string LengthOfStay { get; set; } = null!;

    [Column("referral_source")]
    [StringLength(50)]
    public string ReferralSource { get; set; } = null!;

    [Column("referring_agency_person")]
    [StringLength(50)]
    public string? ReferringAgencyPerson { get; set; }

    [Column("date_colb_registered")]
    public DateOnly? DateColbRegistered { get; set; }

    [Column("date_colb_obtained")]
    public DateOnly? DateColbObtained { get; set; }

    [Column("assigned_social_worker")]
    [StringLength(50)]
    public string AssignedSocialWorker { get; set; } = null!;

    [Column("initial_case_assessment")]
    [StringLength(50)]
    public string InitialCaseAssessment { get; set; } = null!;

    [Column("date_case_study_prepared")]
    public DateOnly? DateCaseStudyPrepared { get; set; }

    [Column("reintegration_type")]
    [StringLength(50)]
    public string ReintegrationType { get; set; } = null!;

    [Column("reintegration_status")]
    [StringLength(50)]
    public string ReintegrationStatus { get; set; } = null!;

    [Column("initial_risk_level")]
    [StringLength(50)]
    public string InitialRiskLevel { get; set; } = null!;

    [Column("current_risk_level")]
    [StringLength(50)]
    public string CurrentRiskLevel { get; set; } = null!;

    [Column("date_enrolled")]
    public DateOnly DateEnrolled { get; set; }

    [Column("date_closed")]
    public DateOnly? DateClosed { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; }

    [Column("notes_restricted")]
    [StringLength(1)]
    public string? NotesRestricted { get; set; }

    [InverseProperty("Resident")]
    public virtual ICollection<EducationRecord> EducationRecords { get; set; } = new List<EducationRecord>();

    [InverseProperty("Resident")]
    public virtual ICollection<HealthWellbeingRecord> HealthWellbeingRecords { get; set; } = new List<HealthWellbeingRecord>();

    [InverseProperty("Resident")]
    public virtual ICollection<HomeVisitation> HomeVisitations { get; set; } = new List<HomeVisitation>();

    [InverseProperty("Resident")]
    public virtual ICollection<IncidentReport> IncidentReports { get; set; } = new List<IncidentReport>();

    [InverseProperty("Resident")]
    public virtual ICollection<InterventionPlan> InterventionPlans { get; set; } = new List<InterventionPlan>();

    [InverseProperty("Resident")]
    public virtual ICollection<ProcessRecording> ProcessRecordings { get; set; } = new List<ProcessRecording>();

    [ForeignKey("SafehouseId")]
    [InverseProperty("Residents")]
    public virtual Safehouse Safehouse { get; set; } = null!;
}
