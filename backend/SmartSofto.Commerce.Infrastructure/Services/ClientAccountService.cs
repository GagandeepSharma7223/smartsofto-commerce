using Microsoft.EntityFrameworkCore;
using SmartSofto.Commerce.Application.DTOs;
using SmartSofto.Commerce.Application.Interfaces;
using SmartSofto.Commerce.Domain.Models;

namespace SmartSofto.Commerce.Infrastructure.Services
{
    public class ClientAccountService : IClientAccountService
    {
        private const int MaxBackdateDays = 7;
        private readonly ApplicationDbContext _context;

        public ClientAccountService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<decimal> GetAvailableCreditAsync(int tenantId, int clientId)
        {
            await EnsureClientExistsAsync(tenantId, clientId);

            var transactions = await _context.ClientAccountTransactions
                .AsNoTracking()
                .Where(t => t.TenantId == tenantId && t.ClientId == clientId)
                .ToListAsync();

            return transactions.Sum(GetSignedAmount);
        }

        public async Task<IReadOnlyList<ClientCreditBalanceDto>> GetClientBalancesAsync(int tenantId)
        {
            var clients = await _context.Clients
                .AsNoTracking()
                .Where(c => c.TenantId == tenantId)
                .Select(c => new { c.Id, c.Name })
                .ToListAsync();

            var transactions = await _context.ClientAccountTransactions
                .AsNoTracking()
                .Where(t => t.TenantId == tenantId)
                .ToListAsync();

            var grouped = transactions
                .GroupBy(t => t.ClientId)
                .ToDictionary(g => g.Key, g => g.Sum(GetSignedAmount));

            return clients
                .Select(c => new ClientCreditBalanceDto
                {
                    ClientId = c.Id,
                    ClientName = c.Name,
                    AvailableCredit = grouped.TryGetValue(c.Id, out var balance) ? balance : 0m
                })
                .ToList();
        }

        public async Task<IReadOnlyList<ClientAccountTransactionDto>> GetClientLedgerAsync(int tenantId, int clientId)
        {
            await EnsureClientExistsAsync(tenantId, clientId);

            var transactions = await _context.ClientAccountTransactions
                .AsNoTracking()
                .Where(t => t.TenantId == tenantId && t.ClientId == clientId)
                .OrderByDescending(t => t.EffectiveDate)
                .ThenByDescending(t => t.CreatedUtc)
                .ThenByDescending(t => t.Id)
                .ToListAsync();

            return transactions.Select(Map).ToList();
        }

        public async Task<ClientAccountTransactionDto> RecordAdvancePaymentAsync(int tenantId, int clientId, AdminCreateAdvancePaymentRequest request)
        {
            if (request.Amount <= 0)
            {
                throw new InvalidOperationException("Advance payment amount must be greater than 0.");
            }

            if (!Enum.IsDefined(typeof(PaymentMethod), request.PaymentMethod))
            {
                throw new InvalidOperationException("A valid payment method is required.");
            }

            var effectiveDate = NormalizeEffectiveDate(request.EffectiveDate, request.Note);
            await EnsureClientExistsAsync(tenantId, clientId);

            var transaction = new ClientAccountTransaction
            {
                ClientId = clientId,
                TenantId = tenantId,
                Type = ClientAccountTransactionType.AdvanceReceived,
                Amount = request.Amount,
                PaymentMethod = request.PaymentMethod,
                ReferenceType = "AdvancePayment",
                ReferenceId = null,
                ReferenceNumber = string.IsNullOrWhiteSpace(request.ReferenceNumber) ? null : request.ReferenceNumber.Trim(),
                Note = string.IsNullOrWhiteSpace(request.Note) ? null : request.Note.Trim(),
                EffectiveDate = effectiveDate,
                CreatedUtc = DateTime.UtcNow
            };

            _context.ClientAccountTransactions.Add(transaction);
            await _context.SaveChangesAsync();

            return Map(transaction);
        }

        public async Task<ClientAccountTransactionDto> ApplyCreditAsync(int tenantId, int clientId, decimal amount, string referenceType, string? referenceId, string? note, DateTime effectiveDate)
        {
            if (amount <= 0)
            {
                throw new InvalidOperationException("Applied credit amount must be greater than 0.");
            }

            await EnsureClientExistsAsync(tenantId, clientId);

            var available = await GetAvailableCreditAsync(tenantId, clientId);
            if (amount > available)
            {
                throw new InvalidOperationException($"Applied credit amount cannot exceed available balance of {available:0.00}.");
            }

            var transaction = new ClientAccountTransaction
            {
                ClientId = clientId,
                TenantId = tenantId,
                Type = ClientAccountTransactionType.CreditApplied,
                Amount = amount,
                ReferenceType = string.IsNullOrWhiteSpace(referenceType) ? "Order" : referenceType.Trim(),
                ReferenceId = referenceId,
                Note = string.IsNullOrWhiteSpace(note) ? null : note.Trim(),
                EffectiveDate = effectiveDate.Date,
                CreatedUtc = DateTime.UtcNow
            };

            _context.ClientAccountTransactions.Add(transaction);
            await _context.SaveChangesAsync();

            return Map(transaction);
        }

        public async Task<ClientAccountTransactionDto> RecordAdjustmentCreditAsync(int tenantId, int clientId, decimal amount, string referenceType, string? referenceId, string? referenceNumber, string? note, DateTime effectiveDate)
        {
            if (amount <= 0)
            {
                throw new InvalidOperationException("Credit amount must be greater than 0.");
            }

            await EnsureClientExistsAsync(tenantId, clientId);

            var transaction = new ClientAccountTransaction
            {
                ClientId = clientId,
                TenantId = tenantId,
                Type = ClientAccountTransactionType.Adjustment,
                Amount = amount,
                ReferenceType = string.IsNullOrWhiteSpace(referenceType) ? "OrderAdjustment" : referenceType.Trim(),
                ReferenceId = referenceId,
                ReferenceNumber = string.IsNullOrWhiteSpace(referenceNumber) ? null : referenceNumber.Trim(),
                Note = string.IsNullOrWhiteSpace(note) ? null : note.Trim(),
                EffectiveDate = effectiveDate.Date,
                CreatedUtc = DateTime.UtcNow
            };

            _context.ClientAccountTransactions.Add(transaction);
            await _context.SaveChangesAsync();

            return Map(transaction);
        }

        public async Task<ClientAccountTransactionDto?> RestoreCreditAsync(int tenantId, int clientId, decimal amount, string referenceType, string? referenceId, string? referenceNumber, string? note, DateTime effectiveDate)
        {
            if (amount <= 0)
            {
                return null;
            }

            await EnsureClientExistsAsync(tenantId, clientId);

            var normalizedReferenceType = string.IsNullOrWhiteSpace(referenceType) ? "Order" : referenceType.Trim();
            var alreadyRestored = await _context.ClientAccountTransactions
                .Where(t => t.TenantId == tenantId
                    && t.ClientId == clientId
                    && t.Type == ClientAccountTransactionType.CreditRestored
                    && t.ReferenceType == normalizedReferenceType
                    && t.ReferenceId == referenceId)
                .SumAsync(t => (decimal?)t.Amount) ?? 0m;

            var remainingToRestore = amount - alreadyRestored;
            if (remainingToRestore <= 0)
            {
                return null;
            }

            var transaction = new ClientAccountTransaction
            {
                ClientId = clientId,
                TenantId = tenantId,
                Type = ClientAccountTransactionType.CreditRestored,
                Amount = remainingToRestore,
                ReferenceType = normalizedReferenceType,
                ReferenceId = referenceId,
                ReferenceNumber = string.IsNullOrWhiteSpace(referenceNumber) ? null : referenceNumber.Trim(),
                Note = string.IsNullOrWhiteSpace(note) ? null : note.Trim(),
                EffectiveDate = effectiveDate.Date,
                CreatedUtc = DateTime.UtcNow
            };

            _context.ClientAccountTransactions.Add(transaction);
            await _context.SaveChangesAsync();

            return Map(transaction);
        }

        private async Task EnsureClientExistsAsync(int tenantId, int clientId)
        {
            var exists = await _context.Clients.AnyAsync(c => c.Id == clientId && c.TenantId == tenantId);
            if (!exists)
            {
                throw new InvalidOperationException("Client not found.");
            }
        }

        private static decimal GetSignedAmount(ClientAccountTransaction transaction)
        {
            return transaction.Type switch
            {
                ClientAccountTransactionType.AdvanceReceived => transaction.Amount,
                ClientAccountTransactionType.CreditApplied => -transaction.Amount,
                ClientAccountTransactionType.Refund => -transaction.Amount,
                ClientAccountTransactionType.Adjustment => transaction.Amount,
                ClientAccountTransactionType.CreditRestored => transaction.Amount,
                ClientAccountTransactionType.RefundToCredit => transaction.Amount,
                _ => 0m
            };
        }

        private static DateTime NormalizeEffectiveDate(DateTime? requestedDate, string? note)
        {
            var today = GetBusinessToday();
            var effectiveDate = requestedDate?.Date ?? today;

            if (effectiveDate > today)
            {
                throw new InvalidOperationException("Future-dated advance payments are not allowed.");
            }

            var daysBack = (today - effectiveDate).Days;
            if (daysBack > MaxBackdateDays)
            {
                throw new InvalidOperationException("Backdated advance payments older than 7 days are not allowed.");
            }

            if (daysBack > 0 && string.IsNullOrWhiteSpace(note))
            {
                throw new InvalidOperationException("Backdated advance payments require a note.");
            }

            return effectiveDate;
        }

        private static DateTime GetBusinessToday()
        {
            return TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, TimeZoneInfo.Local).Date;
        }

        private static ClientAccountTransactionDto Map(ClientAccountTransaction transaction)
        {
            return new ClientAccountTransactionDto
            {
                Id = transaction.Id,
                ClientId = transaction.ClientId,
                TenantId = transaction.TenantId,
                Type = transaction.Type,
                Amount = transaction.Amount,
                PaymentMethod = transaction.PaymentMethod,
                ReferenceType = transaction.ReferenceType,
                ReferenceId = transaction.ReferenceId,
                ReferenceNumber = transaction.ReferenceNumber,
                Note = transaction.Note,
                EffectiveDate = transaction.EffectiveDate,
                CreatedUtc = transaction.CreatedUtc
            };
        }
    }
}
