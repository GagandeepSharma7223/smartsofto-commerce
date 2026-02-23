using SmartSofto.Commerce.Domain.Models;

namespace SmartSofto.Commerce.Application.Interfaces
{
    public interface IInvoiceService
    {
        Task<IReadOnlyList<Invoice>> GetInvoicesAsync(int tenantId, string? userId, bool isAdmin);
        Task<Invoice?> GetInvoiceAsync(int tenantId, int id, string? userId, bool isAdmin);
        Task<Invoice> CreateInvoiceAsync(int tenantId, Invoice invoice);
        Task<IReadOnlyList<Invoice>> GetInvoicesForOrderAsync(int tenantId, int orderId, string? userId, bool isAdmin);
    }
}
