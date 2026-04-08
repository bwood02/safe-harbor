using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace backend.Models;

[Table("process_recordings")]
public partial class ProcessRecording
{
    [Key]
    [Column("recording_id")]
    public int RecordingId { get; set; }

    [Column("resident_id")]
    public int ResidentId { get; set; }

    [Column("session_date")]
    public DateOnly SessionDate { get; set; }

    [Column("social_worker")]
    [StringLength(50)]
    public string SocialWorker { get; set; } = null!;

    [Column("session_type")]
    [StringLength(50)]
    public string SessionType { get; set; } = null!;

    [Column("session_duration_minutes")]
    public int SessionDurationMinutes { get; set; }

    [Column("emotional_state_observed")]
    [StringLength(50)]
    public string EmotionalStateObserved { get; set; } = null!;

    [Column("emotional_state_end")]
    [StringLength(50)]
    public string EmotionalStateEnd { get; set; } = null!;

    [Column("session_narrative")]
    [StringLength(100)]
    public string SessionNarrative { get; set; } = null!;

    [Column("interventions_applied")]
    [StringLength(50)]
    public string InterventionsApplied { get; set; } = null!;

    [Column("follow_up_actions")]
    [StringLength(50)]
    public string FollowUpActions { get; set; } = null!;

    [Column("progress_noted")]
    public bool ProgressNoted { get; set; }

    [Column("concerns_flagged")]
    public bool ConcernsFlagged { get; set; }

    [Column("referral_made")]
    public bool ReferralMade { get; set; }

    [Column("notes_restricted")]
    public string? NotesRestricted { get; set; }

    [ForeignKey("ResidentId")]
    [InverseProperty("ProcessRecordings")]
    public virtual Resident Resident { get; set; } = null!;
}
