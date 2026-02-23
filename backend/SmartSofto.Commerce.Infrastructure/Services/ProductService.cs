using Microsoft.EntityFrameworkCore;
using SmartSofto.Commerce.Application.Interfaces;
using SmartSofto.Commerce.Domain.Models;

namespace SmartSofto.Commerce.Infrastructure.Services
{
    public class ProductService : IProductService
    {
        private readonly ApplicationDbContext _context;

        public ProductService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IReadOnlyList<Product>> GetProductsAsync(int tenantId)
        {
            return await _context.Products
                .Where(p => p.TenantId == tenantId)
                .ToListAsync();
        }

        public async Task<Product?> GetProductAsync(int tenantId, int id)
        {
            return await _context.Products
                .FirstOrDefaultAsync(p => p.Id == id && p.TenantId == tenantId);
        }

        public async Task<Product> CreateProductAsync(int tenantId, Product product)
        {
            product.TenantId = tenantId;
            if (product.CreatedAt == default)
            {
                product.CreatedAt = DateTime.UtcNow;
            }

            _context.Products.Add(product);
            await _context.SaveChangesAsync();
            return product;
        }

        public async Task<bool> UpdateProductAsync(int tenantId, Product product)
        {
            var existing = await _context.Products.FirstOrDefaultAsync(p => p.Id == product.Id && p.TenantId == tenantId);
            if (existing == null)
            {
                return false;
            }

            product.TenantId = tenantId;
            product.UpdatedAt = DateTime.UtcNow;
            _context.Entry(existing).CurrentValues.SetValues(product);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteProductAsync(int tenantId, int id)
        {
            var product = await _context.Products.FirstOrDefaultAsync(p => p.Id == id && p.TenantId == tenantId);
            if (product == null)
            {
                return false;
            }

            _context.Products.Remove(product);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
