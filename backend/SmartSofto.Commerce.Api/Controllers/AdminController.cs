using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartSofto.Commerce.Application.DTOs;
using SmartSofto.Commerce.Application.Interfaces;
using SmartSofto.Commerce.Domain.Models;

namespace SmartSofto.Commerce.Api.Controllers
{
    [ApiController]
    [Route("api/admin")]
    [Authorize(Roles = "Admin")]
    public class AdminController : ControllerBase
    {
        private readonly IAdminService _adminService;
        private readonly ICurrentTenantService _tenantService;
        private readonly ICurrentUserService _currentUser;

        public AdminController(IAdminService adminService, ICurrentTenantService tenantService, ICurrentUserService currentUser)
        {
            _adminService = adminService;
            _tenantService = tenantService;
            _currentUser = currentUser;
        }

        // Summary metrics for dashboard
        [HttpGet("dashboard")]
        public async Task<IActionResult> GetDashboardSummary()
        {
            var tenantId = _tenantService.TenantId;
            if (!tenantId.HasValue) return Unauthorized("Tenant claim missing.");
            var summary = await _adminService.GetDashboardSummaryAsync(tenantId.Value);
            return Ok(summary);
        }

        // List orders for admin with optional status filter
        [HttpGet("orders")]
        public async Task<IActionResult> GetOrders([FromQuery] string? status = null)
        {
            var tenantId = _tenantService.TenantId;
            if (!tenantId.HasValue) return Unauthorized("Tenant claim missing.");

            OrderStatus? parsedStatus = null;
            if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<OrderStatus>(status, true, out var parsed))
            {
                parsedStatus = parsed;
            }

            var orders = await _adminService.GetOrdersAsync(tenantId.Value, parsedStatus);
            return Ok(orders);
        }

        // Update order status (admin)
        [HttpPut("orders/{id}/status")]
        public async Task<IActionResult> UpdateOrderStatus(int id, [FromBody] OrderStatus newStatus)
        {
            var tenantId = _tenantService.TenantId;
            if (!tenantId.HasValue)
            {
                return Unauthorized("Tenant claim missing.");
            }

            try
            {
                var result = await _adminService.UpdateOrderStatusAsync(tenantId.Value, id, newStatus, _currentUser.UserId);
                if (result == null) return NotFound();
                return Ok(result);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        // List invoices (optionally by order)
        [HttpGet("invoices")]
        public async Task<IActionResult> GetInvoices([FromQuery] int? orderId = null)
        {
            var tenantId = _tenantService.TenantId;
            if (!tenantId.HasValue) return Unauthorized("Tenant claim missing.");
            var invoices = await _adminService.GetInvoicesAsync(tenantId.Value, orderId);
            return Ok(invoices);
        }

        // Create invoice/payment record for an order
        [HttpPost("invoices")]
        public async Task<IActionResult> CreateInvoice([FromBody] AdminCreateInvoiceRequest request)
        {
            var tenantId = _tenantService.TenantId;
            if (!tenantId.HasValue) return Unauthorized("Tenant claim missing.");

            try
            {
                var invoice = await _adminService.CreateInvoiceAsync(tenantId.Value, request);
                return CreatedAtAction(nameof(GetInvoices), new { id = invoice.Id }, invoice);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        // Monthly revenue series for charts
        [HttpGet("analytics/monthly/{year}")]
        public async Task<IActionResult> GetMonthlyRevenue(int year)
        {
            var tenantId = _tenantService.TenantId;
            if (!tenantId.HasValue) return Unauthorized("Tenant claim missing.");
            var result = await _adminService.GetMonthlyRevenueAsync(tenantId.Value, year);
            return Ok(result);
        }

        // Total revenue for arbitrary date range
        [HttpGet("analytics/total")]
        public async Task<IActionResult> GetTotalForRange([FromQuery] DateTime startDate, [FromQuery] DateTime endDate)
        {
            var tenantId = _tenantService.TenantId;
            if (!tenantId.HasValue) return Unauthorized("Tenant claim missing.");

            try
            {
                var total = await _adminService.GetTotalForRangeAsync(tenantId.Value, startDate, endDate);
                return Ok(total);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
        }
    }
}
