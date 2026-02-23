using SmartSofto.Commerce.Domain.Models;

namespace SmartSofto.Commerce.Application.Interfaces
{
    public interface IProductService
    {
        Task<IReadOnlyList<Product>> GetProductsAsync(int tenantId);
        Task<Product?> GetProductAsync(int tenantId, int id);
        Task<Product> CreateProductAsync(int tenantId, Product product);
        Task<bool> UpdateProductAsync(int tenantId, Product product);
        Task<bool> DeleteProductAsync(int tenantId, int id);
    }
}
