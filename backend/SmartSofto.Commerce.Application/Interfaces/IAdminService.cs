using SmartSofto.Commerce.Application.DTOs;
using SmartSofto.Commerce.Domain.Models;

namespace SmartSofto.Commerce.Application.Interfaces
{
    public interface IAdminService
    {
        Task<AdminDashboardSummaryDto> GetDashboardSummaryAsync(int tenantId);
        Task<IReadOnlyList<AdminOrderSummaryDto>> GetOrdersAsync(int tenantId, OrderStatus? status);
        Task<OrderStatusResult?> UpdateOrderStatusAsync(int tenantId, int id, OrderStatus newStatus, string? userId);
        Task<IReadOnlyList<AdminInvoiceSummaryDto>> GetInvoicesAsync(int tenantId, int? orderId, string? orderNumber = null);
        Task<AdminInvoiceCreateResultDto> CreateInvoiceAsync(int tenantId, AdminCreateInvoiceRequest request, string? userId);
        Task<IReadOnlyList<AdminMonthlyRevenueDto>> GetMonthlyRevenueAsync(int tenantId, int year);
        Task<AdminTotalRevenueDto> GetTotalForRangeAsync(int tenantId, DateTime startDate, DateTime endDate);
        Task<IReadOnlyList<ClientCreditBalanceDto>> GetClientCreditBalancesAsync(int tenantId);
        Task<ClientCreditBalanceDto> GetClientCreditBalanceAsync(int tenantId, int clientId);
        Task<IReadOnlyList<ClientAccountTransactionDto>> GetClientCreditLedgerAsync(int tenantId, int clientId);
        Task<ClientAccountTransactionDto> RecordAdvancePaymentAsync(int tenantId, int clientId, AdminCreateAdvancePaymentRequest request);
        Task<IReadOnlyList<OrderAdjustmentDto>> GetOrderAdjustmentsAsync(int tenantId, int orderId);
        Task<OrderAdjustmentDto> CreateOrderAdjustmentAsync(int tenantId, int orderId, AdminCreateOrderAdjustmentRequest request);
    }
}
