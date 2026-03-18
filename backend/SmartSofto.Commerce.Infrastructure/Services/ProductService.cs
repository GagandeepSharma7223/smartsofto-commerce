using Microsoft.EntityFrameworkCore;
using SmartSofto.Commerce.Application.Exceptions;
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

        public async Task<IReadOnlyList<Product>> GetProductsAsync(int tenantId, bool includeInactive = false)
        {
            var query = _context.Products.Where(p => p.TenantId == tenantId);
            if (!includeInactive)
            {
                query = query.Where(p => p.IsActive);
            }

            return await query.ToListAsync();
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

            product.IsActive = true;
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

            var isReferenced =
                await _context.OrderItems.AnyAsync(oi => oi.TenantId == tenantId && oi.ProductId == id) ||
                await _context.Orders.AnyAsync(o => o.TenantId == tenantId && o.ProductId == id) ||
                await _context.InventoryTransactions.AnyAsync(it => it.TenantId == tenantId && it.ProductId == id) ||
                await _context.SaleItems.AnyAsync(si => si.ProductId == id && si.Sale.TenantId == tenantId);

            if (isReferenced)
            {
                throw new BusinessConflictException(
                    "This product cannot be deleted because it is already used in orders or inventory history. Archive it instead.");
            }

            _context.Products.Remove(product);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> ArchiveProductAsync(int tenantId, int id)
        {
            var product = await _context.Products.FirstOrDefaultAsync(p => p.Id == id && p.TenantId == tenantId);
            if (product == null)
            {
                return false;
            }

            if (product.IsActive)
            {
                product.IsActive = false;
                product.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
            }

            return true;
        }

        public async Task<bool> RestoreProductAsync(int tenantId, int id)
        {
            var product = await _context.Products.FirstOrDefaultAsync(p => p.Id == id && p.TenantId == tenantId);
            if (product == null)
            {
                return false;
            }

            if (!product.IsActive)
            {
                product.IsActive = true;
                product.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
            }

            return true;
        }
    }
}
