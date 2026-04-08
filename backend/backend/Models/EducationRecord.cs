using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace backend.Models;

[Table("education_records")]
public partial class EducationRecord
{
    [Key]
    [Column("education_record_id")]
    public int EducationRecordId { get; set; }

    [Column("resident_id")]
    public int ResidentId { get; set; }

    [Column("record_date")]
    public DateOnly RecordDate { get; set; }

    [Column("education_level")]
    [StringLength(50)]
    public string EducationLevel { get; set; } = null!;

    [Column("school_name")]
    [StringLength(50)]
    public string SchoolName { get; set; } = null!;

    [Column("enrollment_status")]
    [StringLength(50)]
    public string EnrollmentStatus { get; set; } = null!;

    [Column("attendance_rate")]
    public double AttendanceRate { get; set; }

    [Column("progress_percent")]
    public double ProgressPercent { get; set; }

    [Column("completion_status")]
    [StringLength(50)]
    public string CompletionStatus { get; set; } = null!;

    [Column("notes")]
    public string? Notes { get; set; }

    [ForeignKey("ResidentId")]
    [InverseProperty("EducationRecords")]
    public virtual Resident Resident { get; set; } = null!;
}
