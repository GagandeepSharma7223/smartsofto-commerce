using SmartSofto.Commerce.Application.DTOs;
using SmartSofto.Commerce.Domain.Models;

namespace SmartSofto.Commerce.Application.Interfaces
{
    public interface IInventoryService
    {
        Task<InventoryTransaction> AdjustStock(
            int tenantId,
            int productId,
            int qtyDelta,
            string reason,
            string? note,
            string? userId,
            string referenceType = "Manual",
            string? referenceId = null,
            bool allowNegative = false);

        Task<IReadOnlyList<InventoryItemDto>> GetInventory(
            int tenantId,
            string? search,
            int page,
            int pageSize);

        Task<IReadOnlyList<InventoryTransactionDto>> GetTransactions(
            int tenantId,
            int? productId,
            DateTime? from,
            DateTime? to,
            int page,
            int pageSize);
    }
}
