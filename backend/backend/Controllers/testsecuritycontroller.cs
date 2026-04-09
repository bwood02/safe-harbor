using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using backend.Models;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/test-security")]
    public class TestSecurityController : ControllerBase
    {
        [HttpGet("public")]
        [AllowAnonymous]
        public IActionResult Public()
        {
            return Ok(new { message = "Anyone can access this endpoint." });
        }

        [Authorize(Roles = AuthRoles.Admin)]
        [HttpGet("authenticated")]
        public IActionResult AuthenticatedOnly()
        {
            return Ok(new { message = "You are authenticated." });
        }

        [Authorize(Roles = AuthRoles.Admin)]
        [HttpGet("admin")]
        public IActionResult AdminOnly()
        {
            return Ok(new { message = "You are an admin." });
        }
    }
}