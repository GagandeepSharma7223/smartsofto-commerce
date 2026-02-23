using SmartSofto.Commerce.Application.DTOs;
using SmartSofto.Commerce.Domain.Models;

namespace SmartSofto.Commerce.Application.Interfaces
{
    public interface IAdminService
    {
        Task<AdminDashboardSummaryDto> GetDashboardSummaryAsync(int tenantId);
        Task<IReadOnlyList<AdminOrderSummaryDto>> GetOrdersAsync(int tenantId, OrderStatus? status);
        Task<OrderStatusResult?> UpdateOrderStatusAsync(int tenantId, int id, OrderStatus newStatus, string? userId);
        Task<IReadOnlyList<AdminInvoiceSummaryDto>> GetInvoicesAsync(int tenantId, int? orderId);
        Task<AdminInvoiceCreateResultDto> CreateInvoiceAsync(int tenantId, AdminCreateInvoiceRequest request);
        Task<IReadOnlyList<AdminMonthlyRevenueDto>> GetMonthlyRevenueAsync(int tenantId, int year);
        Task<AdminTotalRevenueDto> GetTotalForRangeAsync(int tenantId, DateTime startDate, DateTime endDate);
    }
}
