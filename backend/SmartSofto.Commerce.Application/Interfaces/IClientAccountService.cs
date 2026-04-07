using SmartSofto.Commerce.Application.DTOs;
using SmartSofto.Commerce.Domain.Models;

namespace SmartSofto.Commerce.Application.Interfaces
{
    public interface IClientAccountService
    {
        Task<decimal> GetAvailableCreditAsync(int tenantId, int clientId);
        Task<IReadOnlyList<ClientCreditBalanceDto>> GetClientBalancesAsync(int tenantId);
        Task<IReadOnlyList<ClientAccountTransactionDto>> GetClientLedgerAsync(int tenantId, int clientId);
        Task<ClientAccountTransactionDto> RecordAdvancePaymentAsync(int tenantId, int clientId, AdminCreateAdvancePaymentRequest request);
        Task<ClientAccountTransactionDto> ApplyCreditAsync(int tenantId, int clientId, decimal amount, string referenceType, string? referenceId, string? note, DateTime effectiveDate);
        Task<ClientAccountTransactionDto> RecordAdjustmentCreditAsync(int tenantId, int clientId, decimal amount, string referenceType, string? referenceId, string? referenceNumber, string? note, DateTime effectiveDate);
        Task<ClientAccountTransactionDto?> RestoreCreditAsync(int tenantId, int clientId, decimal amount, string referenceType, string? referenceId, string? referenceNumber, string? note, DateTime effectiveDate);
    }
}
