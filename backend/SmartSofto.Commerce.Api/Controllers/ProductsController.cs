using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using SmartSofto.Commerce.Domain.Models;
using SmartSofto.Commerce.Application.Interfaces;

namespace SmartSofto.Commerce.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProductsController : ControllerBase
    {
        private readonly IProductService _productService;
        private readonly ICurrentTenantService _tenantService;

        public ProductsController(IProductService productService, ICurrentTenantService tenantService)
        {
            _productService = productService;
            _tenantService = tenantService;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Product>>> GetProducts()
        {
            var tenantId = _tenantService.GetTenantIdOrDefault(1);
            var products = await _productService.GetProductsAsync(tenantId);
            return Ok(products);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Product>> GetProduct(int id)
        {
            var tenantId = _tenantService.GetTenantIdOrDefault(1);
            var product = await _productService.GetProductAsync(tenantId, id);
            if (product == null)
            {
                return NotFound();
            }

            return Ok(product);
        }

        [Authorize(Roles = "Admin")]
        [HttpPut("{id}")]
        public async Task<IActionResult> PutProduct(int id, Product product)
        {
            var tenantId = _tenantService.TenantId;
            if (!tenantId.HasValue) return Unauthorized("Tenant claim missing.");
            if (id != product.Id)
            {
                return BadRequest();
            }

            var updated = await _productService.UpdateProductAsync(tenantId.Value, product);
            if (!updated)
            {
                return NotFound();
            }

            return NoContent();
        }

        [Authorize(Roles = "Admin")]
        [HttpPost]
        public async Task<ActionResult<Product>> PostProduct(Product product)
        {
            var tenantId = _tenantService.TenantId;
            if (!tenantId.HasValue) return Unauthorized("Tenant claim missing.");

            var created = await _productService.CreateProductAsync(tenantId.Value, product);
            return CreatedAtAction(nameof(GetProduct), new { id = created.Id }, created);
        }

        [Authorize(Roles = "Admin")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteProduct(int id)
        {
            var tenantId = _tenantService.TenantId;
            if (!tenantId.HasValue) return Unauthorized("Tenant claim missing.");

            var deleted = await _productService.DeleteProductAsync(tenantId.Value, id);
            if (!deleted)
            {
                return NotFound();
            }

            return NoContent();
        }
    }
}
