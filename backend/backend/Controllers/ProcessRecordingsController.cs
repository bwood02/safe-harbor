using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Models;

namespace backend.Controllers;

[Route("api/[controller]")]
[ApiController]
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

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ProcessRecordingDto>>> GetByResident([FromQuery] int residentId)
    {
        if (residentId <= 0)
            return BadRequest(new { error = "residentId query parameter is required" });

        try
        {
            var rows = await _context.ProcessRecordings
                .Where(r => r.ResidentId == residentId)
                .OrderByDescending(r => r.SessionDate)
                .ToListAsync();

            return Ok(rows.Select(ToDto));
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
}
