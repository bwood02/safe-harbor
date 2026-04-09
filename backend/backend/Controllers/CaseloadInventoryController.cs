using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Models;

namespace backend.Controllers;

[Route("api/[controller]")]
[ApiController]
public class CaseloadInventoryController : ControllerBase
{
    private readonly MainAppDbContext _context;

    public CaseloadInventoryController(MainAppDbContext context)
    {
        _context = context;
    }

    public record ResidentListItemDto(
        int ResidentId,
        string CaseControlNo,
        decimal InternalCode,
        int SafehouseId,
        string SafehouseName,
        string CaseStatus,
        string CaseCategory,
        string PresentAge,
        DateOnly DateOfAdmission,
        string LengthOfStay,
        string AssignedSocialWorker,
        string CurrentRiskLevel,
        string ReintegrationStatus);

    public record ResidentDetailDto(
        Resident Resident,
        string SafehouseName,
        int ProcessRecordingCount,
        int HomeVisitCount,
        int OpenInterventionPlansCount,
        int IncidentCount);

    public record PagedResultDto<T>(
        List<T> Items,
        int TotalCount,
        int Page,
        int PageSize,
        int TotalPages);

    public class ResidentInputDto
    {
        public string CaseControlNo { get; set; } = "";
        public decimal InternalCode { get; set; }
        public int SafehouseId { get; set; }
        public string CaseStatus { get; set; } = "Active";
        public string Sex { get; set; } = "F";
        public DateOnly DateOfBirth { get; set; }
        public string BirthStatus { get; set; } = "";
        public string PlaceOfBirth { get; set; } = "";
        public string Religion { get; set; } = "";
        public string CaseCategory { get; set; } = "";
        public bool SubCatOrphaned { get; set; }
        public bool SubCatTrafficked { get; set; }
        public bool SubCatChildLabor { get; set; }
        public bool SubCatPhysicalAbuse { get; set; }
        public bool SubCatSexualAbuse { get; set; }
        public bool SubCatOsaec { get; set; }
        public bool SubCatCicl { get; set; }
        public bool SubCatAtRisk { get; set; }
        public bool SubCatStreetChild { get; set; }
        public bool SubCatChildWithHiv { get; set; }
        public bool IsPwd { get; set; }
        public string? PwdType { get; set; }
        public bool HasSpecialNeeds { get; set; }
        public string? SpecialNeedsDiagnosis { get; set; }
        public bool FamilyIs4ps { get; set; }
        public bool FamilySoloParent { get; set; }
        public bool FamilyIndigenous { get; set; }
        public bool FamilyParentPwd { get; set; }
        public bool FamilyInformalSettler { get; set; }
        public DateOnly DateOfAdmission { get; set; }
        public string AgeUponAdmission { get; set; } = "";
        public string PresentAge { get; set; } = "";
        public string LengthOfStay { get; set; } = "";
        public string ReferralSource { get; set; } = "";
        public string? ReferringAgencyPerson { get; set; }
        public DateOnly? DateColbRegistered { get; set; }
        public DateOnly? DateColbObtained { get; set; }
        public string AssignedSocialWorker { get; set; } = "";
        public string InitialCaseAssessment { get; set; } = "";
        public DateOnly? DateCaseStudyPrepared { get; set; }
        public string ReintegrationType { get; set; } = "";
        public string ReintegrationStatus { get; set; } = "";
        public string InitialRiskLevel { get; set; } = "";
        public string CurrentRiskLevel { get; set; } = "";
    }

    [HttpGet("residents")]
    public async Task<IActionResult> GetResidents(
        [FromQuery] string? search,
        [FromQuery] string? status,
        [FromQuery] int? safehouseId,
        [FromQuery] string? category,
        [FromQuery] string? riskLevel,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 25)
    {
        try
        {
            var q = _context.Residents.AsNoTracking().Include(r => r.Safehouse).AsQueryable();

            if (!string.IsNullOrWhiteSpace(search))
            {
                var s = search.Trim();
                q = q.Where(r => r.CaseControlNo.Contains(s));
            }
            if (!string.IsNullOrWhiteSpace(status))
                q = q.Where(r => r.CaseStatus == status);
            if (safehouseId.HasValue)
                q = q.Where(r => r.SafehouseId == safehouseId.Value);
            if (!string.IsNullOrWhiteSpace(category))
                q = q.Where(r => r.CaseCategory == category);
            if (!string.IsNullOrWhiteSpace(riskLevel))
                q = q.Where(r => r.CurrentRiskLevel == riskLevel);

            var safePage = Math.Max(1, page);
            var safePageSize = Math.Clamp(pageSize, 5, 100);
            var totalCount = await q.CountAsync();
            var totalPages = totalCount == 0 ? 1 : (int)Math.Ceiling(totalCount / (double)safePageSize);
            var clampedPage = Math.Min(safePage, totalPages);

            var rows = await q
                .OrderByDescending(r => r.DateOfAdmission)
                .Skip((clampedPage - 1) * safePageSize)
                .Take(safePageSize)
                .Select(r => new ResidentListItemDto(
                    r.ResidentId,
                    r.CaseControlNo,
                    r.InternalCode,
                    r.SafehouseId,
                    r.Safehouse.Name,
                    r.CaseStatus,
                    r.CaseCategory,
                    r.PresentAge,
                    r.DateOfAdmission,
                    r.LengthOfStay,
                    r.AssignedSocialWorker,
                    r.CurrentRiskLevel,
                    r.ReintegrationStatus))
                .ToListAsync();

            return Ok(new PagedResultDto<ResidentListItemDto>(
                rows,
                totalCount,
                clampedPage,
                safePageSize,
                totalPages));
        }
        catch (Exception ex)
        {
            return StatusCode(503, new { error = "Database unavailable", message = ex.Message });
        }
    }

    [HttpGet("residents/{id:int}")]
    public async Task<IActionResult> GetResident(int id)
    {
        try
        {
            var resident = await _context.Residents.AsNoTracking()
                .Include(r => r.Safehouse)
                .FirstOrDefaultAsync(r => r.ResidentId == id);
            if (resident == null) return NotFound();

            var processRecordingCount = await _context.ProcessRecordings.CountAsync(p => p.ResidentId == id);
            var homeVisitCount = await _context.HomeVisitations.CountAsync(h => h.ResidentId == id);
            var openInterventionPlansCount = await _context.InterventionPlans
                .CountAsync(p => p.ResidentId == id && p.Status != "Completed" && p.Status != "Closed");
            var incidentCount = await _context.IncidentReports.CountAsync(i => i.ResidentId == id);

            var safehouseName = resident.Safehouse?.Name ?? "";
            resident.Safehouse = null!;
            return Ok(new ResidentDetailDto(
                resident, safehouseName,
                processRecordingCount, homeVisitCount,
                openInterventionPlansCount, incidentCount));
        }
        catch (Exception ex)
        {
            return StatusCode(503, new { error = "Database unavailable", message = ex.Message });
        }
    }

    [HttpPost("residents")]
    public async Task<IActionResult> CreateResident([FromBody] ResidentInputDto dto)
    {
        try
        {
            var r = new Resident();
            ApplyInput(r, dto);
            r.DateEnrolled = dto.DateOfAdmission;
            r.CreatedAt = DateTime.UtcNow;
            _context.Residents.Add(r);
            await _context.SaveChangesAsync();
            return Ok(r);
        }
        catch (Exception ex)
        {
            return StatusCode(503, new { error = "Database unavailable", message = ex.Message });
        }
    }

    [HttpPut("residents/{id:int}")]
    public async Task<IActionResult> UpdateResident(int id, [FromBody] ResidentInputDto dto)
    {
        try
        {
            var r = await _context.Residents.FirstOrDefaultAsync(x => x.ResidentId == id);
            if (r == null) return NotFound();
            ApplyInput(r, dto);
            await _context.SaveChangesAsync();
            return Ok(r);
        }
        catch (Exception ex)
        {
            return StatusCode(503, new { error = "Database unavailable", message = ex.Message });
        }
    }

    [HttpDelete("residents/{id:int}")]
    public async Task<IActionResult> SoftDeleteResident(int id)
    {
        try
        {
            var r = await _context.Residents.FirstOrDefaultAsync(x => x.ResidentId == id);
            if (r == null) return NotFound();
            r.CaseStatus = "Closed";
            r.DateClosed = DateOnly.FromDateTime(DateTime.UtcNow);
            await _context.SaveChangesAsync();
            return Ok(new { residentId = r.ResidentId, caseStatus = r.CaseStatus, dateClosed = r.DateClosed });
        }
        catch (Exception ex)
        {
            return StatusCode(503, new { error = "Database unavailable", message = ex.Message });
        }
    }

    [HttpGet("safehouses")]
    public async Task<IActionResult> GetSafehouses()
    {
        try
        {
            var rows = await _context.Safehouses.AsNoTracking()
                .OrderBy(s => s.Name)
                .Select(s => new { safehouseId = s.SafehouseId, name = s.Name, safehouseCode = s.SafehouseCode })
                .ToListAsync();
            return Ok(rows);
        }
        catch (Exception ex)
        {
            return StatusCode(503, new { error = "Database unavailable", message = ex.Message });
        }
    }

    [HttpGet("filters")]
    public async Task<IActionResult> GetFilters()
    {
        try
        {
            var statuses = await _context.Residents.AsNoTracking()
                .Select(r => r.CaseStatus).Distinct().OrderBy(s => s).ToListAsync();
            var categories = await _context.Residents.AsNoTracking()
                .Select(r => r.CaseCategory).Distinct().OrderBy(s => s).ToListAsync();
            var riskLevels = await _context.Residents.AsNoTracking()
                .Select(r => r.CurrentRiskLevel).Distinct().OrderBy(s => s).ToListAsync();
            var socialWorkers = await _context.Residents.AsNoTracking()
                .Select(r => r.AssignedSocialWorker).Distinct().OrderBy(s => s).ToListAsync();
            return Ok(new { statuses, categories, riskLevels, socialWorkers });
        }
        catch (Exception ex)
        {
            return StatusCode(503, new { error = "Database unavailable", message = ex.Message });
        }
    }

    private static void ApplyInput(Resident r, ResidentInputDto d)
    {
        r.CaseControlNo = d.CaseControlNo;
        r.InternalCode = d.InternalCode;
        r.SafehouseId = d.SafehouseId;
        r.CaseStatus = d.CaseStatus;
        r.Sex = d.Sex;
        r.DateOfBirth = d.DateOfBirth;
        r.BirthStatus = d.BirthStatus;
        r.PlaceOfBirth = d.PlaceOfBirth;
        r.Religion = d.Religion;
        r.CaseCategory = d.CaseCategory;
        r.SubCatOrphaned = d.SubCatOrphaned;
        r.SubCatTrafficked = d.SubCatTrafficked;
        r.SubCatChildLabor = d.SubCatChildLabor;
        r.SubCatPhysicalAbuse = d.SubCatPhysicalAbuse;
        r.SubCatSexualAbuse = d.SubCatSexualAbuse;
        r.SubCatOsaec = d.SubCatOsaec;
        r.SubCatCicl = d.SubCatCicl;
        r.SubCatAtRisk = d.SubCatAtRisk;
        r.SubCatStreetChild = d.SubCatStreetChild;
        r.SubCatChildWithHiv = d.SubCatChildWithHiv;
        r.IsPwd = d.IsPwd;
        r.PwdType = d.PwdType;
        r.HasSpecialNeeds = d.HasSpecialNeeds;
        r.SpecialNeedsDiagnosis = d.SpecialNeedsDiagnosis;
        r.FamilyIs4ps = d.FamilyIs4ps;
        r.FamilySoloParent = d.FamilySoloParent;
        r.FamilyIndigenous = d.FamilyIndigenous;
        r.FamilyParentPwd = d.FamilyParentPwd;
        r.FamilyInformalSettler = d.FamilyInformalSettler;
        r.DateOfAdmission = d.DateOfAdmission;
        r.AgeUponAdmission = d.AgeUponAdmission;
        r.PresentAge = d.PresentAge;
        r.LengthOfStay = d.LengthOfStay;
        r.ReferralSource = d.ReferralSource;
        r.ReferringAgencyPerson = d.ReferringAgencyPerson;
        r.DateColbRegistered = d.DateColbRegistered;
        r.DateColbObtained = d.DateColbObtained;
        r.AssignedSocialWorker = d.AssignedSocialWorker;
        r.InitialCaseAssessment = d.InitialCaseAssessment;
        r.DateCaseStudyPrepared = d.DateCaseStudyPrepared;
        r.ReintegrationType = d.ReintegrationType;
        r.ReintegrationStatus = d.ReintegrationStatus;
        r.InitialRiskLevel = d.InitialRiskLevel;
        r.CurrentRiskLevel = d.CurrentRiskLevel;
    }
}
