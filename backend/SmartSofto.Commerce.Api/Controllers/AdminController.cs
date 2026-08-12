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
        private readonly IInvoicePdfService _invoicePdfService;
        private readonly ICurrentTenantService _tenantService;
        private readonly ICurrentUserService _currentUser;

        public AdminController(IAdminService adminService, IInvoicePdfService invoicePdfService, ICurrentTenantService tenantService, ICurrentUserService currentUser)
        {
            _adminService = adminService;
            _invoicePdfService = invoicePdfService;
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


        [HttpGet("orders/{orderId}/adjustments")]
        public async Task<IActionResult> GetOrderAdjustments(int orderId)
        {
            var tenantId = _tenantService.TenantId;
            if (!tenantId.HasValue) return Unauthorized("Tenant claim missing.");
            var adjustments = await _adminService.GetOrderAdjustmentsAsync(tenantId.Value, orderId);
            return Ok(adjustments);
        }

        [HttpPost("orders/{orderId}/adjustments")]
        public async Task<IActionResult> CreateOrderAdjustment(int orderId, [FromBody] AdminCreateOrderAdjustmentRequest request)
        {
            var tenantId = _tenantService.TenantId;
            if (!tenantId.HasValue) return Unauthorized("Tenant claim missing.");
            try
            {
                var adjustment = await _adminService.CreateOrderAdjustmentAsync(tenantId.Value, orderId, request);
                return Ok(adjustment);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        // List invoices (optionally by order)
        [HttpGet("invoices")]
        public async Task<IActionResult> GetInvoices([FromQuery] int? orderId = null, [FromQuery] string? orderNumber = null)
        {
            var tenantId = _tenantService.TenantId;
            if (!tenantId.HasValue) return Unauthorized("Tenant claim missing.");
            var invoices = await _adminService.GetInvoicesAsync(tenantId.Value, orderId, orderNumber);
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
                var invoice = await _adminService.CreateInvoiceAsync(tenantId.Value, request, _currentUser.UserId);
                return CreatedAtAction(nameof(GetInvoices), new { id = invoice.Id }, invoice);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpGet("invoices/{invoiceId}/pdf")]
        public async Task<IActionResult> DownloadInvoicePdf(int invoiceId)
        {
            var tenantId = _tenantService.TenantId;
            if (!tenantId.HasValue) return Unauthorized("Tenant claim missing.");

            try
            {
                var pdf = await _invoicePdfService.GenerateInvoicePdfAsync(tenantId.Value, invoiceId);
                if (pdf == null) return NotFound();

                return File(pdf.Content, pdf.ContentType, pdf.FileName);
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(ex.Message);
            }
        }

        [HttpGet("clients/credit-balances")]
        public async Task<IActionResult> GetClientCreditBalances()
        {
            var tenantId = _tenantService.TenantId;
            if (!tenantId.HasValue) return Unauthorized("Tenant claim missing.");
            var balances = await _adminService.GetClientCreditBalancesAsync(tenantId.Value);
            return Ok(balances);
        }

        [HttpGet("clients/{clientId}/credit-balance")]
        public async Task<IActionResult> GetClientCreditBalance(int clientId)
        {
            var tenantId = _tenantService.TenantId;
            if (!tenantId.HasValue) return Unauthorized("Tenant claim missing.");
            try
            {
                var balance = await _adminService.GetClientCreditBalanceAsync(tenantId.Value, clientId);
                return Ok(balance);
            }
            catch (InvalidOperationException ex)
            {
                return NotFound(ex.Message);
            }
        }

        [HttpGet("clients/{clientId}/credit-ledger")]
        public async Task<IActionResult> GetClientCreditLedger(int clientId)
        {
            var tenantId = _tenantService.TenantId;
            if (!tenantId.HasValue) return Unauthorized("Tenant claim missing.");
            try
            {
                var ledger = await _adminService.GetClientCreditLedgerAsync(tenantId.Value, clientId);
                return Ok(ledger);
            }
            catch (InvalidOperationException ex)
            {
                return NotFound(ex.Message);
            }
        }

        [HttpPost("clients/{clientId}/advance-payments")]
        public async Task<IActionResult> RecordAdvancePayment(int clientId, [FromBody] AdminCreateAdvancePaymentRequest request)
        {
            var tenantId = _tenantService.TenantId;
            if (!tenantId.HasValue) return Unauthorized("Tenant claim missing.");
            try
            {
                var transaction = await _adminService.RecordAdvancePaymentAsync(tenantId.Value, clientId, request);
                return Ok(transaction);
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
