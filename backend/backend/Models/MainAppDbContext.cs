using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;

namespace backend.Models;

public partial class MainAppDbContext : DbContext
{
    public MainAppDbContext()
    {
    }

    public MainAppDbContext(DbContextOptions<MainAppDbContext> options)
        : base(options)
    {
    }

    public virtual DbSet<Donation> Donations { get; set; }

    public virtual DbSet<DonationAllocation> DonationAllocations { get; set; }

    public virtual DbSet<EducationRecord> EducationRecords { get; set; }

    public virtual DbSet<HealthWellbeingRecord> HealthWellbeingRecords { get; set; }

    public virtual DbSet<HomeVisitation> HomeVisitations { get; set; }

    public virtual DbSet<InKindDonationItem> InKindDonationItems { get; set; }

    public virtual DbSet<IncidentReport> IncidentReports { get; set; }

    public virtual DbSet<InterventionPlan> InterventionPlans { get; set; }

    public virtual DbSet<Partner> Partners { get; set; }

    public virtual DbSet<PartnerAssignment> PartnerAssignments { get; set; }

    public virtual DbSet<ProcessRecording> ProcessRecordings { get; set; }

    public virtual DbSet<PublicImpactSnapshot> PublicImpactSnapshots { get; set; }

    public virtual DbSet<Resident> Residents { get; set; }

    public virtual DbSet<Safehouse> Safehouses { get; set; }

    public virtual DbSet<SafehouseMonthlyMetric> SafehouseMonthlyMetrics { get; set; }

    public virtual DbSet<SocialMediaPost> SocialMediaPosts { get; set; }

    public virtual DbSet<Supporter> Supporters { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Donation>(entity =>
        {
            entity.Property(e => e.DonationId).ValueGeneratedOnAdd();

            entity.HasOne(d => d.ReferralPost).WithMany(p => p.Donations).HasConstraintName("FK_donations_social_media_posts");

            entity.HasOne(d => d.Supporter).WithMany(p => p.Donations)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_donations_supporters");
        });

        modelBuilder.Entity<DonationAllocation>(entity =>
        {
            entity.Property(e => e.AllocationId).ValueGeneratedOnAdd();

            entity.HasOne(d => d.Donation).WithMany(p => p.DonationAllocations)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_donation_allocations_donations");

            entity.HasOne(d => d.Safehouse).WithMany(p => p.DonationAllocations)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_donation_allocations_safehouses");
        });

        modelBuilder.Entity<EducationRecord>(entity =>
        {
            entity.Property(e => e.EducationRecordId).ValueGeneratedOnAdd();

            entity.HasOne(d => d.Resident).WithMany(p => p.EducationRecords)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_education_records_residents");
        });

        modelBuilder.Entity<HealthWellbeingRecord>(entity =>
        {
            entity.HasKey(e => e.HealthRecordId).HasName("PK_health_wellbeing_Records");

            entity.Property(e => e.HealthRecordId).ValueGeneratedOnAdd();

            entity.HasOne(d => d.Resident).WithMany(p => p.HealthWellbeingRecords)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_health_records_residents");
        });

        modelBuilder.Entity<HomeVisitation>(entity =>
        {
            entity.Property(e => e.VisitationId).ValueGeneratedOnAdd();

            entity.HasOne(d => d.Resident).WithMany(p => p.HomeVisitations)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_home_visitations_residents");
        });

        modelBuilder.Entity<InKindDonationItem>(entity =>
        {
            entity.Property(e => e.ItemId).ValueGeneratedOnAdd();

            entity.HasOne(d => d.Donation).WithMany(p => p.InKindDonationItems)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_in_kind_items_donations");
        });

        modelBuilder.Entity<IncidentReport>(entity =>
        {
            entity.Property(e => e.IncidentId).ValueGeneratedOnAdd();

            entity.HasOne(d => d.Resident).WithMany(p => p.IncidentReports)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_incident_reports_residents");

            entity.HasOne(d => d.Safehouse).WithMany(p => p.IncidentReports)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_incident_reports_safehouses");
        });

        modelBuilder.Entity<InterventionPlan>(entity =>
        {
            entity.Property(e => e.PlanId).ValueGeneratedOnAdd();

            entity.HasOne(d => d.Resident).WithMany(p => p.InterventionPlans)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_intervention_plans_residents");
        });

        modelBuilder.Entity<Partner>(entity =>
        {
            entity.Property(e => e.PartnerId).ValueGeneratedOnAdd();
        });

        modelBuilder.Entity<PartnerAssignment>(entity =>
        {
            entity.Property(e => e.AssignmentId).ValueGeneratedOnAdd();

            entity.HasOne(d => d.Partner).WithMany(p => p.PartnerAssignments)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_partner_assignments_partners");

            entity.HasOne(d => d.Safehouse).WithMany(p => p.PartnerAssignments).HasConstraintName("FK_partner_assignments_safehouses");
        });

        modelBuilder.Entity<ProcessRecording>(entity =>
        {
            entity.Property(e => e.RecordingId).ValueGeneratedOnAdd();

            entity.HasOne(d => d.Resident).WithMany(p => p.ProcessRecordings)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_process_recordings_residents");
        });

        modelBuilder.Entity<PublicImpactSnapshot>(entity =>
        {
            entity.Property(e => e.SnapshotId).ValueGeneratedOnAdd();
        });

        modelBuilder.Entity<Resident>(entity =>
        {
            entity.Property(e => e.ResidentId).ValueGeneratedOnAdd();

            entity.HasOne(d => d.Safehouse).WithMany(p => p.Residents)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_residents_safehouses");
        });

        modelBuilder.Entity<Safehouse>(entity =>
        {
            entity.Property(e => e.SafehouseId).ValueGeneratedOnAdd();
        });

        modelBuilder.Entity<SafehouseMonthlyMetric>(entity =>
        {
            entity.Property(e => e.MetricId).ValueGeneratedOnAdd();

            entity.HasOne(d => d.Safehouse).WithMany(p => p.SafehouseMonthlyMetrics)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_safehouse_metrics_safehouses");
        });

        modelBuilder.Entity<SocialMediaPost>(entity =>
        {
            entity.Property(e => e.PostId).ValueGeneratedOnAdd();
        });

        modelBuilder.Entity<Supporter>(entity =>
        {
            entity.Property(e => e.SupporterId).ValueGeneratedOnAdd();
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
