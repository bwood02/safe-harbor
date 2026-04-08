using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using backend.Models;

namespace backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class MainAppController : ControllerBase
    {
        private MainAppDbContext _context;

        public MainAppController(MainAppDbContext context)
        {
            _context = context;
        }

        [HttpGet(Name ="GetDonations")]
        public List<Donation> GetDonations() 
        {
            var donations = _context.Donations.ToList();
            return donations;
        }
    }
}
