using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers;

/// <summary>
/// Projects EF entities to snake_case JSON rows matching <c>data/*.csv</c> and the Python <c>build_master_from_api_payload</c> contract.
/// </summary>
internal static class ResidentWellbeingPayload
{
    public static async Task<object> BuildAsync(MainAppDbContext ctx, DateOnly asOf, CancellationToken ct)
    {
        var health = await ctx.HealthWellbeingRecords.AsNoTracking()
            .Select(h => new
            {
                health_record_id = h.HealthRecordId,
                resident_id = h.ResidentId,
                record_date = h.RecordDate.ToString("yyyy-MM-dd"),
                general_health_score = h.GeneralHealthScore,
                nutrition_score = h.NutritionScore,
                sleep_quality_score = h.SleepQualityScore,
                energy_level_score = h.EnergyLevelScore,
                height_cm = h.HeightCm,
                weight_kg = h.WeightKg,
                bmi = h.Bmi,
                medical_checkup_done = h.MedicalCheckupDone,
                dental_checkup_done = h.DentalCheckupDone,
                psychological_checkup_done = h.PsychologicalCheckupDone,
                notes = h.Notes,
            }).ToListAsync(ct);

        var process = await ctx.ProcessRecordings.AsNoTracking()
            .Select(p => new
            {
                recording_id = p.RecordingId,
                resident_id = p.ResidentId,
                session_date = p.SessionDate.ToString("yyyy-MM-dd"),
                social_worker = p.SocialWorker,
                session_type = p.SessionType,
                session_duration_minutes = p.SessionDurationMinutes,
                emotional_state_observed = p.EmotionalStateObserved,
                emotional_state_end = p.EmotionalStateEnd,
                session_narrative = p.SessionNarrative,
                interventions_applied = p.InterventionsApplied,
                follow_up_actions = p.FollowUpActions,
                progress_noted = p.ProgressNoted,
                concerns_flagged = p.ConcernsFlagged,
                referral_made = p.ReferralMade,
                notes_restricted = p.NotesRestricted,
            }).ToListAsync(ct);

        var visits = await ctx.HomeVisitations.AsNoTracking()
            .Select(v => new
            {
                visitation_id = v.VisitationId,
                resident_id = v.ResidentId,
                visit_date = v.VisitDate.ToString("yyyy-MM-dd"),
                social_worker = v.SocialWorker,
                visit_type = v.VisitType,
                location_visited = v.LocationVisited,
                family_members_present = v.FamilyMembersPresent,
                purpose = v.Purpose,
                observations = v.Observations,
                family_cooperation_level = v.FamilyCooperationLevel,
                safety_concerns_noted = v.SafetyConcernsNoted,
                follow_up_needed = v.FollowUpNeeded,
                follow_up_notes = v.FollowUpNotes,
                visit_outcome = v.VisitOutcome,
            }).ToListAsync(ct);

        var edu = await ctx.EducationRecords.AsNoTracking()
            .Select(e => new
            {
                education_record_id = e.EducationRecordId,
                resident_id = e.ResidentId,
                record_date = e.RecordDate.ToString("yyyy-MM-dd"),
                education_level = e.EducationLevel,
                school_name = e.SchoolName,
                enrollment_status = e.EnrollmentStatus,
                attendance_rate = e.AttendanceRate,
                progress_percent = e.ProgressPercent,
                completion_status = e.CompletionStatus,
                notes = e.Notes,
            }).ToListAsync(ct);

        var incidents = await ctx.IncidentReports.AsNoTracking()
            .Select(i => new
            {
                incident_id = i.IncidentId,
                resident_id = i.ResidentId,
                safehouse_id = i.SafehouseId,
                incident_date = i.IncidentDate.ToString("yyyy-MM-dd"),
                incident_type = i.IncidentType,
                severity = i.Severity,
                description = i.Description,
                response_taken = i.ResponseTaken,
                resolved = i.Resolved,
                resolution_date = i.ResolutionDate.HasValue ? i.ResolutionDate.Value.ToString("yyyy-MM-dd") : null,
                reported_by = i.ReportedBy,
                follow_up_required = i.FollowUpRequired,
            }).ToListAsync(ct);

        var plans = await ctx.InterventionPlans.AsNoTracking()
            .Select(p => new
            {
                plan_id = p.PlanId,
                resident_id = p.ResidentId,
                plan_category = p.PlanCategory,
                plan_description = p.PlanDescription,
                services_provided = p.ServicesProvided,
                target_value = p.TargetValue,
                target_date = p.TargetDate.ToString("yyyy-MM-dd"),
                status = p.Status,
                case_conference_date = p.CaseConferenceDate.HasValue ? p.CaseConferenceDate.Value.ToString("yyyy-MM-dd") : null,
                created_at = p.CreatedAt.ToString("yyyy-MM-dd HH:mm:ss"),
                updated_at = p.UpdatedAt.ToString("yyyy-MM-dd HH:mm:ss"),
            }).ToListAsync(ct);

        var residents = await ctx.Residents.AsNoTracking()
            .Select(r => new
            {
                resident_id = r.ResidentId,
                case_control_no = r.CaseControlNo,
                internal_code = r.InternalCode,
                safehouse_id = r.SafehouseId,
                case_status = r.CaseStatus,
                sex = r.Sex,
                date_of_birth = r.DateOfBirth.ToString("yyyy-MM-dd"),
                birth_status = r.BirthStatus,
                place_of_birth = r.PlaceOfBirth,
                religion = r.Religion,
                case_category = r.CaseCategory,
                sub_cat_orphaned = r.SubCatOrphaned,
                sub_cat_trafficked = r.SubCatTrafficked,
                sub_cat_child_labor = r.SubCatChildLabor,
                sub_cat_physical_abuse = r.SubCatPhysicalAbuse,
                sub_cat_sexual_abuse = r.SubCatSexualAbuse,
                sub_cat_osaec = r.SubCatOsaec,
                sub_cat_cicl = r.SubCatCicl,
                sub_cat_at_risk = r.SubCatAtRisk,
                sub_cat_street_child = r.SubCatStreetChild,
                sub_cat_child_with_hiv = r.SubCatChildWithHiv,
                is_pwd = r.IsPwd,
                pwd_type = r.PwdType,
                has_special_needs = r.HasSpecialNeeds,
                special_needs_diagnosis = r.SpecialNeedsDiagnosis,
                family_is_4ps = r.FamilyIs4ps,
                family_solo_parent = r.FamilySoloParent,
                family_indigenous = r.FamilyIndigenous,
                family_parent_pwd = r.FamilyParentPwd,
                family_informal_settler = r.FamilyInformalSettler,
                date_of_admission = r.DateOfAdmission.ToString("yyyy-MM-dd"),
                age_upon_admission = r.AgeUponAdmission,
                present_age = r.PresentAge,
                length_of_stay = r.LengthOfStay,
                referral_source = r.ReferralSource,
                referring_agency_person = r.ReferringAgencyPerson,
                date_colb_registered = r.DateColbRegistered.HasValue ? r.DateColbRegistered.Value.ToString("yyyy-MM-dd") : null,
                date_colb_obtained = r.DateColbObtained.HasValue ? r.DateColbObtained.Value.ToString("yyyy-MM-dd") : null,
                assigned_social_worker = r.AssignedSocialWorker,
                initial_case_assessment = r.InitialCaseAssessment,
                date_case_study_prepared = r.DateCaseStudyPrepared.HasValue ? r.DateCaseStudyPrepared.Value.ToString("yyyy-MM-dd") : null,
                reintegration_type = r.ReintegrationType,
                reintegration_status = r.ReintegrationStatus,
                initial_risk_level = r.InitialRiskLevel,
                current_risk_level = r.CurrentRiskLevel,
                date_enrolled = r.DateEnrolled.ToString("yyyy-MM-dd"),
                date_closed = r.DateClosed.HasValue ? r.DateClosed.Value.ToString("yyyy-MM-dd") : null,
                created_at = r.CreatedAt.ToString("yyyy-MM-dd HH:mm:ss"),
                notes_restricted = r.NotesRestricted,
            }).ToListAsync(ct);

        var houses = await ctx.Safehouses.AsNoTracking()
            .Select(s => new
            {
                safehouse_id = s.SafehouseId,
                safehouse_code = s.SafehouseCode,
                name = s.Name,
                region = s.Region,
                city = s.City,
                province = s.Province,
                country = s.Country,
                open_date = s.OpenDate.ToString("yyyy-MM-dd"),
                status = s.Status,
                capacity_girls = s.CapacityGirls,
                capacity_staff = s.CapacityStaff,
                current_occupancy = s.CurrentOccupancy,
                notes = s.Notes,
            }).ToListAsync(ct);

        return new
        {
            as_of = asOf.ToString("yyyy-MM-dd"),
            health_wellbeing_records = health,
            process_recordings = process,
            home_visitations = visits,
            education_records = edu,
            incident_reports = incidents,
            intervention_plans = plans,
            residents = residents,
            safehouses = houses,
        };
    }
}
