using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartSofto.Commerce.Application.DTOs;
using SmartSofto.Commerce.Application.Interfaces;
using SmartSofto.Commerce.Domain.Models;

namespace SmartSofto.Commerce.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class OrdersController : ControllerBase
    {
        private readonly IOrderService _orderService;
        private readonly ICurrentTenantService _tenantService;
        private readonly ICurrentUserService _currentUser;

        public OrdersController(IOrderService orderService, ICurrentTenantService tenantService, ICurrentUserService currentUser)
        {
            _orderService = orderService;
            _tenantService = tenantService;
            _currentUser = currentUser;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<OrderViewModel>>> GetOrders()
        {
            var tenantId = _tenantService.TenantId;
            if (!tenantId.HasValue) return Unauthorized("Tenant claim missing.");

            var isAdmin = _currentUser.IsInRole("Admin");
            var orders = await _orderService.GetOrdersAsync(tenantId.Value, _currentUser.UserId, isAdmin);
            return Ok(orders);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<OrderViewModel>> GetOrder(int id)
        {
            var tenantId = _tenantService.TenantId;
            if (!tenantId.HasValue) return Unauthorized("Tenant claim missing.");

            var isAdmin = _currentUser.IsInRole("Admin");
            var order = await _orderService.GetOrderAsync(tenantId.Value, id, _currentUser.UserId, isAdmin);
            if (order == null) return NotFound();
            return Ok(order);
        }

        [AllowAnonymous]
        [HttpPost("price")]
        public async Task<ActionResult<CartPriceViewModel>> PriceCart([FromBody] PriceCartRequest request)
        {
            try
            {
                var tenantId = _tenantService.GetTenantIdOrDefault(1);
                var response = await _orderService.PriceCartAsync(tenantId, request);
                return Ok(response);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [AllowAnonymous]
        [HttpPost]
        public async Task<ActionResult> CreateOrder([FromBody] MultiOrderRequest request)
        {
            try
            {
                var tenantId = _tenantService.GetTenantIdOrDefault(1);
                var result = await _orderService.CreateOrderAsync(tenantId, request);

                var isMulti = (request.Items != null && request.Items.Count > 0) || (request.Lines != null && request.Lines.Count > 0);
                if (isMulti)
                {
                    return CreatedAtAction(nameof(GetOrder), new { id = result.Id }, new
                    {
                        result.Id,
                        result.OrderNumber,
                        result.ClientId,
                        ClientName = result.ClientName,
                        result.TotalAmount,
                        result.Status,
                        result.PaymentMethod,
                        result.AmountPaid,
                        InvoiceId = result.InvoiceId,
                        InvoiceNumber = result.InvoiceNumber,
                        InvoiceStatus = result.InvoiceStatus,
                        result.CreatedAt,
                        Items = result.Items.Select(i => new
                        {
                            i.ProductId,
                            i.ProductName,
                            i.Quantity,
                            i.UnitPrice,
                            i.LineTotal
                        })
                    });
                }

                return CreatedAtAction(nameof(GetOrder), new { id = result.Id }, new
                {
                    result.Id,
                    result.OrderNumber,
                    result.ClientId,
                    ClientName = result.ClientName,
                    result.ProductId,
                    ProductName = result.ProductName,
                    result.Quantity,
                    result.UnitPrice,
                    result.TotalAmount,
                    result.Status,
                    result.Notes,
                    result.PaymentMethod,
                    InvoiceId = result.InvoiceId,
                    InvoiceNumber = result.InvoiceNumber,
                    InvoiceStatus = result.InvoiceStatus,
                    result.CreatedAt
                });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
            catch
            {
                return StatusCode(500, "An error occurred while creating the order");
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateOrder(int id, Order order)
        {
            if (id != order.Id) return BadRequest();

            var tenantId = _tenantService.TenantId;
            if (!tenantId.HasValue) return Unauthorized("Tenant claim missing.");

            try
            {
                var updated = await _orderService.UpdateOrderAsync(tenantId.Value, order);
                if (!updated) return NotFound();
                return NoContent();
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPut("{id}/status")]
        public async Task<IActionResult> UpdateOrderStatus(int id, [FromBody] OrderStatus newStatus)
        {
            var tenantId = _tenantService.TenantId;
            if (!tenantId.HasValue)
            {
                return Unauthorized("Tenant claim missing.");
            }

            try
            {
                var result = await _orderService.UpdateOrderStatusAsync(tenantId.Value, id, newStatus, _currentUser.UserId);
                if (result == null) return NotFound();
                return Ok(result);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteOrder(int id)
        {
            var tenantId = _tenantService.TenantId;
            if (!tenantId.HasValue)
            {
                return Unauthorized("Tenant claim missing.");
            }

            try
            {
                var deleted = await _orderService.DeleteOrderAsync(tenantId.Value, id, _currentUser.UserId);
                if (!deleted) return NotFound();
                return NoContent();
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
        }
    }
}
