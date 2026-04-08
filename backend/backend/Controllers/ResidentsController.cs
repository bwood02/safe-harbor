using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Models;

namespace backend.Controllers;

[Route("api/[controller]")]
[ApiController]
public class ResidentsController : ControllerBase
{
    private readonly MainAppDbContext _context;

    public ResidentsController(MainAppDbContext context)
    {
        _context = context;
    }

    public class ResidentPickerDto
    {
        public int ResidentId { get; set; }
        public string CaseControlNo { get; set; } = "";
        public int SafehouseId { get; set; }
        public string CaseStatus { get; set; } = "";
        public string PresentAge { get; set; } = "";
        public string AssignedSocialWorker { get; set; } = "";
        public string CurrentRiskLevel { get; set; } = "";
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ResidentPickerDto>>> GetResidents(
        [FromQuery] string? status,
        [FromQuery] int? safehouseId,
        [FromQuery] string? search)
    {
        try
        {
            var q = _context.Residents.AsQueryable();

            if (!string.IsNullOrWhiteSpace(status))
                q = q.Where(r => r.CaseStatus == status);
            if (safehouseId.HasValue)
                q = q.Where(r => r.SafehouseId == safehouseId.Value);
            if (!string.IsNullOrWhiteSpace(search))
                q = q.Where(r => r.CaseControlNo.Contains(search));

            var rows = await q
                .OrderBy(r => r.CaseControlNo)
                .Take(200)
                .Select(r => new ResidentPickerDto
                {
                    ResidentId = r.ResidentId,
                    CaseControlNo = r.CaseControlNo,
                    SafehouseId = r.SafehouseId,
                    CaseStatus = r.CaseStatus,
                    PresentAge = r.PresentAge,
                    AssignedSocialWorker = r.AssignedSocialWorker,
                    CurrentRiskLevel = r.CurrentRiskLevel,
                })
                .ToListAsync();

            return Ok(rows);
        }
        catch (Exception ex)
        {
            return StatusCode(503, new { error = "Database unavailable", detail = ex.Message });
        }
    }
}
