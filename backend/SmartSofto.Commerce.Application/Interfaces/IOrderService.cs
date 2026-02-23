using SmartSofto.Commerce.Application.DTOs;
using SmartSofto.Commerce.Domain.Models;

namespace SmartSofto.Commerce.Application.Interfaces
{
    public interface IOrderService
    {
        Task<IReadOnlyList<OrderViewModel>> GetOrdersAsync(int tenantId, string? userId, bool isAdmin);
        Task<OrderViewModel?> GetOrderAsync(int tenantId, int id, string? userId, bool isAdmin);
        Task<CartPriceViewModel> PriceCartAsync(int tenantId, PriceCartRequest request);
        Task<OrderCreateResult> CreateOrderAsync(int tenantId, MultiOrderRequest request);
        Task<bool> UpdateOrderAsync(int tenantId, Order order);
        Task<OrderStatusResult?> UpdateOrderStatusAsync(int tenantId, int id, OrderStatus newStatus, string? userId);
        Task<bool> DeleteOrderAsync(int tenantId, int id, string? userId);
    }
}
