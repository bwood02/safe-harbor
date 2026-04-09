using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using backend.Models;

namespace backend.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize(Roles = AuthRoles.Admin)]
public class ProcessRecordingsController : ControllerBase
{
    private readonly MainAppDbContext _context;

    public ProcessRecordingsController(MainAppDbContext context)
    {
        _context = context;
    }

    public class ProcessRecordingDto
    {
        public int RecordingId { get; set; }
        public int ResidentId { get; set; }
        public DateOnly SessionDate { get; set; }
        public string SocialWorker { get; set; } = "";
        public string SessionType { get; set; } = "";
        public int SessionDurationMinutes { get; set; }
        public string EmotionalStateObserved { get; set; } = "";
        public string EmotionalStateEnd { get; set; } = "";
        public string SessionNarrative { get; set; } = "";
        public string InterventionsApplied { get; set; } = "";
        public string FollowUpActions { get; set; } = "";
        public bool ProgressNoted { get; set; }
        public bool ConcernsFlagged { get; set; }
        public bool ReferralMade { get; set; }
        public string? NotesRestricted { get; set; }
    }

    public class PagedResultDto<T>
    {
        public List<T> Items { get; set; } = new();
        public int TotalCount { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalPages { get; set; }
    }

    private static ProcessRecordingDto ToDto(ProcessRecording r) => new()
    {
        RecordingId = r.RecordingId,
        ResidentId = r.ResidentId,
        SessionDate = r.SessionDate,
        SocialWorker = r.SocialWorker,
        SessionType = r.SessionType,
        SessionDurationMinutes = r.SessionDurationMinutes,
        EmotionalStateObserved = r.EmotionalStateObserved,
        EmotionalStateEnd = r.EmotionalStateEnd,
        SessionNarrative = r.SessionNarrative,
        InterventionsApplied = r.InterventionsApplied,
        FollowUpActions = r.FollowUpActions,
        ProgressNoted = r.ProgressNoted,
        ConcernsFlagged = r.ConcernsFlagged,
        ReferralMade = r.ReferralMade,
        NotesRestricted = r.NotesRestricted,
    };

    public class CreateProcessRecordingRequest
    {
        public int ResidentId { get; set; }
        public DateOnly SessionDate { get; set; }
        public string SocialWorker { get; set; } = "";
        public string SessionType { get; set; } = "";
        public int SessionDurationMinutes { get; set; }
        public string EmotionalStateObserved { get; set; } = "";
        public string EmotionalStateEnd { get; set; } = "";
        public string SessionNarrative { get; set; } = "";
        public string InterventionsApplied { get; set; } = "";
        public string FollowUpActions { get; set; } = "";
        public bool ProgressNoted { get; set; }
        public bool ConcernsFlagged { get; set; }
        public bool ReferralMade { get; set; }
        public string? NotesRestricted { get; set; }
    }

    /// <summary>
    /// Update payload: no primary key or foreign keys — recording is identified by the route; resident cannot be changed.
    /// </summary>
    public class UpdateProcessRecordingRequest
    {
        public DateOnly SessionDate { get; set; }
        public string SocialWorker { get; set; } = "";
        public string SessionType { get; set; } = "";
        public int SessionDurationMinutes { get; set; }
        public string EmotionalStateObserved { get; set; } = "";
        public string EmotionalStateEnd { get; set; } = "";
        public string SessionNarrative { get; set; } = "";
        public string InterventionsApplied { get; set; } = "";
        public string FollowUpActions { get; set; } = "";
        public bool ProgressNoted { get; set; }
        public bool ConcernsFlagged { get; set; }
        public bool ReferralMade { get; set; }
        public string? NotesRestricted { get; set; }
    }

    [HttpGet]
    public async Task<ActionResult<PagedResultDto<ProcessRecordingDto>>> GetByResident(
        [FromQuery] int residentId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        if (residentId <= 0)
            return BadRequest(new { error = "residentId query parameter is required" });

        try
        {
            var safePage = Math.Max(1, page);
            var safePageSize = Math.Clamp(pageSize, 5, 100);

            var baseQuery = _context.ProcessRecordings
                .Where(r => r.ResidentId == residentId)
                .OrderByDescending(r => r.SessionDate)
                .ThenByDescending(r => r.RecordingId);

            var totalCount = await baseQuery.CountAsync();
            var totalPages = totalCount == 0 ? 1 : (int)Math.Ceiling(totalCount / (double)safePageSize);
            var clampedPage = Math.Min(safePage, totalPages);

            var rows = await baseQuery
                .Skip((clampedPage - 1) * safePageSize)
                .Take(safePageSize)
                .ToListAsync();

            return Ok(new PagedResultDto<ProcessRecordingDto>
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

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ProcessRecordingDto>> GetOne(int id)
    {
        try
        {
            var r = await _context.ProcessRecordings.FirstOrDefaultAsync(x => x.RecordingId == id);
            if (r == null) return NotFound();
            return Ok(ToDto(r));
        }
        catch (Exception ex)
        {
            return StatusCode(503, new { error = "Database unavailable", detail = ex.Message });
        }
    }

    [HttpPost]
    public async Task<ActionResult<ProcessRecordingDto>> Create([FromBody] CreateProcessRecordingRequest request)
    {
        if (request == null)
            return BadRequest(new { error = "Request body is required" });
        if (request.ResidentId <= 0)
            return BadRequest(new { error = "residentId must be a positive integer" });
        if (string.IsNullOrWhiteSpace(request.SocialWorker))
            return BadRequest(new { error = "socialWorker is required" });
        if (string.IsNullOrWhiteSpace(request.SessionType))
            return BadRequest(new { error = "sessionType is required" });
        if (request.SessionDurationMinutes <= 0)
            return BadRequest(new { error = "sessionDurationMinutes must be positive" });
        if (string.IsNullOrWhiteSpace(request.EmotionalStateObserved))
            return BadRequest(new { error = "emotionalStateObserved is required" });
        if (string.IsNullOrWhiteSpace(request.EmotionalStateEnd))
            return BadRequest(new { error = "emotionalStateEnd is required" });
        if (string.IsNullOrWhiteSpace(request.SessionNarrative))
            return BadRequest(new { error = "sessionNarrative is required" });
        if (string.IsNullOrWhiteSpace(request.InterventionsApplied))
            return BadRequest(new { error = "interventionsApplied is required" });
        if (string.IsNullOrWhiteSpace(request.FollowUpActions))
            return BadRequest(new { error = "followUpActions is required" });

        try
        {
            var residentExists = await _context.Residents
                .AsNoTracking()
                .AnyAsync(r => r.ResidentId == request.ResidentId);
            if (!residentExists)
                return BadRequest(new { error = $"Resident {request.ResidentId} does not exist." });

            var entity = new ProcessRecording
            {
                ResidentId = request.ResidentId,
                SessionDate = request.SessionDate,
                SocialWorker = request.SocialWorker.Trim(),
                SessionType = request.SessionType.Trim(),
                SessionDurationMinutes = request.SessionDurationMinutes,
                EmotionalStateObserved = request.EmotionalStateObserved.Trim(),
                EmotionalStateEnd = request.EmotionalStateEnd.Trim(),
                SessionNarrative = request.SessionNarrative.Trim(),
                InterventionsApplied = request.InterventionsApplied.Trim(),
                FollowUpActions = request.FollowUpActions.Trim(),
                ProgressNoted = request.ProgressNoted,
                ConcernsFlagged = request.ConcernsFlagged,
                ReferralMade = request.ReferralMade,
                NotesRestricted = string.IsNullOrWhiteSpace(request.NotesRestricted) ? null : request.NotesRestricted.Trim(),
            };

            _context.ProcessRecordings.Add(entity);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetOne), new { id = entity.RecordingId }, ToDto(entity));
        }
        catch (Exception ex)
        {
            return StatusCode(503, new { error = "Database unavailable", detail = ex.Message });
        }
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<ProcessRecordingDto>> Update(int id, [FromBody] UpdateProcessRecordingRequest request)
    {
        if (request == null)
            return BadRequest(new { error = "Request body is required" });
        if (string.IsNullOrWhiteSpace(request.SocialWorker))
            return BadRequest(new { error = "socialWorker is required" });
        if (string.IsNullOrWhiteSpace(request.SessionType))
            return BadRequest(new { error = "sessionType is required" });
        if (request.SessionDurationMinutes <= 0)
            return BadRequest(new { error = "sessionDurationMinutes must be positive" });
        if (string.IsNullOrWhiteSpace(request.EmotionalStateObserved))
            return BadRequest(new { error = "emotionalStateObserved is required" });
        if (string.IsNullOrWhiteSpace(request.EmotionalStateEnd))
            return BadRequest(new { error = "emotionalStateEnd is required" });
        if (string.IsNullOrWhiteSpace(request.SessionNarrative))
            return BadRequest(new { error = "sessionNarrative is required" });
        if (string.IsNullOrWhiteSpace(request.InterventionsApplied))
            return BadRequest(new { error = "interventionsApplied is required" });
        if (string.IsNullOrWhiteSpace(request.FollowUpActions))
            return BadRequest(new { error = "followUpActions is required" });

        try
        {
            var entity = await _context.ProcessRecordings.FirstOrDefaultAsync(x => x.RecordingId == id);
            if (entity == null)
                return NotFound();

            entity.SessionDate = request.SessionDate;
            entity.SocialWorker = request.SocialWorker.Trim();
            entity.SessionType = request.SessionType.Trim();
            entity.SessionDurationMinutes = request.SessionDurationMinutes;
            entity.EmotionalStateObserved = request.EmotionalStateObserved.Trim();
            entity.EmotionalStateEnd = request.EmotionalStateEnd.Trim();
            entity.SessionNarrative = request.SessionNarrative.Trim();
            entity.InterventionsApplied = request.InterventionsApplied.Trim();
            entity.FollowUpActions = request.FollowUpActions.Trim();
            entity.ProgressNoted = request.ProgressNoted;
            entity.ConcernsFlagged = request.ConcernsFlagged;
            entity.ReferralMade = request.ReferralMade;
            entity.NotesRestricted = string.IsNullOrWhiteSpace(request.NotesRestricted)
                ? null
                : request.NotesRestricted.Trim();

            await _context.SaveChangesAsync();
            return Ok(ToDto(entity));
        }
        catch (Exception ex)
        {
            return StatusCode(503, new { error = "Database unavailable", detail = ex.Message });
        }
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        try
        {
            var entity = await _context.ProcessRecordings.FirstOrDefaultAsync(x => x.RecordingId == id);
            if (entity == null)
                return NotFound();

            _context.ProcessRecordings.Remove(entity);
            await _context.SaveChangesAsync();
            return NoContent();
        }
        catch (Exception ex)
        {
            return StatusCode(503, new { error = "Database unavailable", detail = ex.Message });
        }
    }
}
