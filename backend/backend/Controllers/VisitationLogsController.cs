using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using backend.Models;

namespace backend.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize(Roles = AuthRoles.Admin)]
public class VisitationLogsController : ControllerBase
{
    private readonly MainAppDbContext _context;

    public VisitationLogsController(MainAppDbContext context)
    {
        _context = context;
    }

    public class VisitDto
    {
        public int VisitationId { get; set; }
        public int ResidentId { get; set; }
        public DateOnly VisitDate { get; set; }
        public string SocialWorker { get; set; } = "";
        public string VisitType { get; set; } = "";
        public string LocationVisited { get; set; } = "";
        public string FamilyMembersPresent { get; set; } = "";
        public string Purpose { get; set; } = "";
        public string? Observations { get; set; }
        public string FamilyCooperationLevel { get; set; } = "";
        public bool SafetyConcernsNoted { get; set; }
        public bool FollowUpNeeded { get; set; }
        public string? FollowUpNotes { get; set; }
        public string VisitOutcome { get; set; } = "";
    }

    public class VisitInput
    {
        public int ResidentId { get; set; }
        public DateOnly VisitDate { get; set; }
        public string SocialWorker { get; set; } = "";
        public string VisitType { get; set; } = "";
        public string LocationVisited { get; set; } = "";
        public string FamilyMembersPresent { get; set; } = "";
        public string Purpose { get; set; } = "";
        public string? Observations { get; set; }
        public string FamilyCooperationLevel { get; set; } = "";
        public bool SafetyConcernsNoted { get; set; }
        public bool FollowUpNeeded { get; set; }
        public string? FollowUpNotes { get; set; }
        public string VisitOutcome { get; set; } = "";
    }

    public class CaseConferenceDto
    {
        public int PlanId { get; set; }
        public int ResidentId { get; set; }
        public DateOnly CaseConferenceDate { get; set; }
        public string PlanCategory { get; set; } = "";
        public string PlanDescription { get; set; } = "";
        public string ServicesProvided { get; set; } = "";
        public string Status { get; set; } = "";
    }

    public class PagedResultDto<T>
    {
        public List<T> Items { get; set; } = new();
        public int TotalCount { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalPages { get; set; }
    }

    private static VisitDto ToDto(HomeVisitation v) => new()
    {
        VisitationId = v.VisitationId,
        ResidentId = v.ResidentId,
        VisitDate = v.VisitDate,
        SocialWorker = v.SocialWorker,
        VisitType = v.VisitType,
        LocationVisited = v.LocationVisited,
        FamilyMembersPresent = v.FamilyMembersPresent,
        Purpose = v.Purpose,
        Observations = v.Observations,
        FamilyCooperationLevel = v.FamilyCooperationLevel,
        SafetyConcernsNoted = v.SafetyConcernsNoted,
        FollowUpNeeded = v.FollowUpNeeded,
        FollowUpNotes = v.FollowUpNotes,
        VisitOutcome = v.VisitOutcome,
    };

    [HttpGet("visits")]
    public async Task<ActionResult<PagedResultDto<VisitDto>>> GetVisits(
        [FromQuery] int? residentId,
        [FromQuery] string? visitType,
        [FromQuery] DateOnly? fromDate,
        [FromQuery] DateOnly? toDate,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        try
        {
            var q = _context.HomeVisitations.AsQueryable();
            if (residentId.HasValue) q = q.Where(v => v.ResidentId == residentId.Value);
            if (!string.IsNullOrWhiteSpace(visitType)) q = q.Where(v => v.VisitType == visitType);
            if (fromDate.HasValue) q = q.Where(v => v.VisitDate >= fromDate.Value);
            if (toDate.HasValue) q = q.Where(v => v.VisitDate <= toDate.Value);

            var safePage = Math.Max(1, page);
            var safePageSize = Math.Clamp(pageSize, 5, 100);
            var totalCount = await q.CountAsync();
            var totalPages = totalCount == 0 ? 1 : (int)Math.Ceiling(totalCount / (double)safePageSize);
            var clampedPage = Math.Min(safePage, totalPages);

            var rows = await q
                .OrderByDescending(v => v.VisitDate)
                .ThenByDescending(v => v.VisitationId)
                .Skip((clampedPage - 1) * safePageSize)
                .Take(safePageSize)
                .ToListAsync();

            return Ok(new PagedResultDto<VisitDto>
            {
                Items = rows.Select(ToDto).ToList(),
                TotalCount = totalCount,
                Page = clampedPage,
                PageSize = safePageSize,
                TotalPages = totalPages
            });
        }
        catch (Exception ex)
        {
            return StatusCode(503, new { error = "Database unavailable", detail = ex.Message });
        }
    }

    [HttpGet("visits/{id:int}")]
    public async Task<ActionResult<VisitDto>> GetVisit(int id)
    {
        try
        {
            var v = await _context.HomeVisitations.FirstOrDefaultAsync(x => x.VisitationId == id);
            if (v == null) return NotFound();
            return Ok(ToDto(v));
        }
        catch (Exception ex)
        {
            return StatusCode(503, new { error = "Database unavailable", detail = ex.Message });
        }
    }

    [HttpPost("visits")]
    public async Task<ActionResult<VisitDto>> CreateVisit([FromBody] VisitInput input)
    {
        try
        {
            var v = new HomeVisitation
            {
                ResidentId = input.ResidentId,
                VisitDate = input.VisitDate,
                SocialWorker = input.SocialWorker,
                VisitType = input.VisitType,
                LocationVisited = input.LocationVisited,
                FamilyMembersPresent = input.FamilyMembersPresent,
                Purpose = input.Purpose,
                Observations = input.Observations,
                FamilyCooperationLevel = input.FamilyCooperationLevel,
                SafetyConcernsNoted = input.SafetyConcernsNoted,
                FollowUpNeeded = input.FollowUpNeeded,
                FollowUpNotes = input.FollowUpNotes,
                VisitOutcome = input.VisitOutcome,
            };
            _context.HomeVisitations.Add(v);
            await _context.SaveChangesAsync();
            return Ok(ToDto(v));
        }
        catch (Exception ex)
        {
            return StatusCode(503, new { error = "Database unavailable", detail = ex.Message });
        }
    }

    [HttpPut("visits/{id:int}")]
    public async Task<ActionResult<VisitDto>> UpdateVisit(int id, [FromBody] VisitInput input)
    {
        try
        {
            var v = await _context.HomeVisitations.FirstOrDefaultAsync(x => x.VisitationId == id);
            if (v == null) return NotFound();
            v.ResidentId = input.ResidentId;
            v.VisitDate = input.VisitDate;
            v.SocialWorker = input.SocialWorker;
            v.VisitType = input.VisitType;
            v.LocationVisited = input.LocationVisited;
            v.FamilyMembersPresent = input.FamilyMembersPresent;
            v.Purpose = input.Purpose;
            v.Observations = input.Observations;
            v.FamilyCooperationLevel = input.FamilyCooperationLevel;
            v.SafetyConcernsNoted = input.SafetyConcernsNoted;
            v.FollowUpNeeded = input.FollowUpNeeded;
            v.FollowUpNotes = input.FollowUpNotes;
            v.VisitOutcome = input.VisitOutcome;
            await _context.SaveChangesAsync();
            return Ok(ToDto(v));
        }
        catch (Exception ex)
        {
            return StatusCode(503, new { error = "Database unavailable", detail = ex.Message });
        }
    }

    [HttpDelete("visits/{id:int}")]
    public async Task<IActionResult> DeleteVisit(int id)
    {
        try
        {
            var v = await _context.HomeVisitations.FirstOrDefaultAsync(x => x.VisitationId == id);
            if (v == null) return NotFound();
            _context.HomeVisitations.Remove(v);
            await _context.SaveChangesAsync();
            return NoContent();
        }
        catch (Exception ex)
        {
            return StatusCode(503, new { error = "Database unavailable", detail = ex.Message });
        }
    }

    [HttpGet("case-conferences")]
    public async Task<ActionResult<IEnumerable<CaseConferenceDto>>> GetCaseConferences([FromQuery] int? residentId)
    {
        try
        {
            var q = _context.InterventionPlans.Where(p => p.CaseConferenceDate != null);
            if (residentId.HasValue) q = q.Where(p => p.ResidentId == residentId.Value);
            var rows = await q.OrderByDescending(p => p.CaseConferenceDate).ToListAsync();
            return Ok(rows.Select(p => new CaseConferenceDto
            {
                PlanId = p.PlanId,
                ResidentId = p.ResidentId,
                CaseConferenceDate = p.CaseConferenceDate!.Value,
                PlanCategory = p.PlanCategory,
                PlanDescription = p.PlanDescription,
                ServicesProvided = p.ServicesProvided,
                Status = p.Status,
            }));
        }
        catch (Exception ex)
        {
            return StatusCode(503, new { error = "Database unavailable", detail = ex.Message });
        }
    }
}
