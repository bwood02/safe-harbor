using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace backend.Models;

[Table("safehouse_monthly_metrics")]
public partial class SafehouseMonthlyMetric
{
    [Key]
    [Column("metric_id")]
    public int MetricId { get; set; }

    [Column("safehouse_id")]
    public int SafehouseId { get; set; }

    [Column("month_start")]
    public DateOnly MonthStart { get; set; }

    [Column("month_end")]
    public DateOnly MonthEnd { get; set; }

    [Column("active_residents")]
    public int ActiveResidents { get; set; }

    [Column("avg_education_progress")]
    public double? AvgEducationProgress { get; set; }

    [Column("avg_health_score")]
    public double? AvgHealthScore { get; set; }

    [Column("process_recording_count")]
    public int ProcessRecordingCount { get; set; }

    [Column("home_visitation_count")]
    public int HomeVisitationCount { get; set; }

    [Column("incident_count")]
    public int IncidentCount { get; set; }

    [Column("notes")]
    public string? Notes { get; set; }

    [ForeignKey("SafehouseId")]
    [InverseProperty("SafehouseMonthlyMetrics")]
    public virtual Safehouse Safehouse { get; set; } = null!;
}
