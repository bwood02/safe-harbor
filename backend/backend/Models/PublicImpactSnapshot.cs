using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace backend.Models;

[Table("public_impact_snapshots")]
public partial class PublicImpactSnapshot
{
    [Key]
    [Column("snapshot_id")]
    public int SnapshotId { get; set; }

    [Column("snapshot_date")]
    public DateOnly SnapshotDate { get; set; }

    [Column("headline")]
    [StringLength(100)]
    public string Headline { get; set; } = null!;

    [Column("summary_text")]
    [StringLength(250)]
    public string SummaryText { get; set; } = null!;

    [Column("metric_payload_json")]
    [StringLength(250)]
    public string MetricPayloadJson { get; set; } = null!;

    [Column("is_published")]
    [StringLength(50)]
    public string IsPublished { get; set; } = null!;

    [Column("published_at")]
    public DateOnly PublishedAt { get; set; }
}
