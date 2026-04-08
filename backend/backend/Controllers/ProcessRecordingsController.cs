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
    };

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
}
