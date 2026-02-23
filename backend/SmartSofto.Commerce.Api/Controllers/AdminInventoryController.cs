using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartSofto.Commerce.Application.Interfaces;

namespace SmartSofto.Commerce.Api.Controllers
{
    [ApiController]
    [Route("api/admin/inventory")]
    [Authorize(Roles = "Admin")]
    public class AdminInventoryController : ControllerBase
    {
        private readonly IInventoryService _inventoryService;
        private readonly ICurrentTenantService _tenantService;

        public AdminInventoryController(IInventoryService inventoryService, ICurrentTenantService tenantService)
        {
            _inventoryService = inventoryService;
            _tenantService = tenantService;
        }

        [HttpGet]
        public async Task<IActionResult> GetInventory(
            [FromQuery] string? q,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20)
        {
            var tenantId = _tenantService.TenantId;
            if (!tenantId.HasValue)
            {
                return Unauthorized("Tenant claim missing.");
            }

            var items = await _inventoryService.GetInventory(tenantId.Value, q, page, pageSize);
            return Ok(items);
        }

        public class InventoryAdjustRequest
        {
            public int ProductId { get; set; }
            public int QtyDelta { get; set; }
            public string Reason { get; set; } = string.Empty;
            public string? Note { get; set; }
        }

        [HttpPost("adjust")]
        public async Task<IActionResult> AdjustInventory([FromBody] InventoryAdjustRequest request)
        {
            var tenantId = _tenantService.TenantId;
            if (!tenantId.HasValue)
            {
                return Unauthorized("Tenant claim missing.");
            }

            if (request.ProductId <= 0)
            {
                return BadRequest("ProductId is required.");
            }

            if (string.IsNullOrWhiteSpace(request.Reason))
            {
                return BadRequest("Reason is required.");
            }

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            try
            {
                var entry = await _inventoryService.AdjustStock(
                    tenantId.Value,
                    request.ProductId,
                    request.QtyDelta,
                    request.Reason,
                    request.Note,
                    userId,
                    "Manual",
                    null,
                    false);

                return Ok(entry);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpGet("transactions")]
        public async Task<IActionResult> GetTransactions(
            [FromQuery] int? productId,
            [FromQuery] DateTime? from,
            [FromQuery] DateTime? to,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 50)
        {
            var tenantId = _tenantService.TenantId;
            if (!tenantId.HasValue)
            {
                return Unauthorized("Tenant claim missing.");
            }

            var entries = await _inventoryService.GetTransactions(
                tenantId.Value,
                productId,
                from,
                to,
                page,
                pageSize);

            return Ok(entries);
        }
    }
}
