using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace backend.Models;

[Table("supporters")]
public partial class Supporter
{
    [Key]
    [Column("supporter_id")]
    public int SupporterId { get; set; }

    [Column("supporter_type")]
    [StringLength(50)]
    public string SupporterType { get; set; } = null!;

    [Column("display_name")]
    [StringLength(50)]
    public string DisplayName { get; set; } = null!;

    [Column("organization_name")]
    [StringLength(50)]
    public string? OrganizationName { get; set; }

    [Column("first_name")]
    [StringLength(50)]
    public string? FirstName { get; set; }

    [Column("last_name")]
    [StringLength(50)]
    public string? LastName { get; set; }

    [Column("relationship_type")]
    [StringLength(50)]
    public string RelationshipType { get; set; } = null!;

    [Column("region")]
    [StringLength(50)]
    public string Region { get; set; } = null!;

    [Column("country")]
    [StringLength(50)]
    public string Country { get; set; } = null!;

    [Column("email")]
    [StringLength(50)]
    public string Email { get; set; } = null!;

    [Column("phone")]
    [StringLength(50)]
    public string Phone { get; set; } = null!;

    [Column("status")]
    [StringLength(50)]
    public string Status { get; set; } = null!;

    [Column("created_at")]
    public DateTime CreatedAt { get; set; }

    [Column("first_donation_date")]
    public DateOnly? FirstDonationDate { get; set; }

    [Column("acquisition_channel")]
    [StringLength(50)]
    public string AcquisitionChannel { get; set; } = null!;

    [InverseProperty("Supporter")]
    public virtual ICollection<Donation> Donations { get; set; } = new List<Donation>();
}
