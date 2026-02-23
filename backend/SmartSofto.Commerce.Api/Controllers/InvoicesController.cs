using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartSofto.Commerce.Application.Interfaces;
using SmartSofto.Commerce.Domain.Models;

namespace SmartSofto.Commerce.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class InvoicesController : ControllerBase
    {
        private readonly IInvoiceService _invoiceService;
        private readonly ICurrentTenantService _tenantService;
        private readonly ICurrentUserService _currentUser;

        public InvoicesController(IInvoiceService invoiceService, ICurrentTenantService tenantService, ICurrentUserService currentUser)
        {
            _invoiceService = invoiceService;
            _tenantService = tenantService;
            _currentUser = currentUser;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Invoice>>> GetInvoices()
        {
            var tenantId = _tenantService.TenantId;
            if (!tenantId.HasValue) return Unauthorized("Tenant claim missing.");
            var invoices = await _invoiceService.GetInvoicesAsync(tenantId.Value, _currentUser.UserId, _currentUser.IsInRole("Admin"));
            return Ok(invoices);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Invoice>> GetInvoice(int id)
        {
            var tenantId = _tenantService.TenantId;
            if (!tenantId.HasValue) return Unauthorized("Tenant claim missing.");
            var invoice = await _invoiceService.GetInvoiceAsync(tenantId.Value, id, _currentUser.UserId, _currentUser.IsInRole("Admin"));
            if (invoice == null) return NotFound();
            return Ok(invoice);
        }

        [Authorize(Roles = "Admin")]
        [HttpPost]
        public async Task<ActionResult<Invoice>> CreateInvoice(Invoice invoice)
        {
            var tenantId = _tenantService.TenantId;
            if (!tenantId.HasValue) return Unauthorized("Tenant claim missing.");

            try
            {
                var created = await _invoiceService.CreateInvoiceAsync(tenantId.Value, invoice);
                return CreatedAtAction(nameof(GetInvoice), new { id = created.Id }, created);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpGet("order/{orderId}")]
        public async Task<ActionResult<IEnumerable<Invoice>>> GetInvoicesForOrder(int orderId)
        {
            var tenantId = _tenantService.TenantId;
            if (!tenantId.HasValue) return Unauthorized("Tenant claim missing.");
            var invoices = await _invoiceService.GetInvoicesForOrderAsync(tenantId.Value, orderId, _currentUser.UserId, _currentUser.IsInRole("Admin"));
            return Ok(invoices);
        }
    }
}
