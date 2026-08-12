using Microsoft.EntityFrameworkCore;
using SmartSofto.Commerce.Application.Exceptions;
using SmartSofto.Commerce.Application.Interfaces;
using SmartSofto.Commerce.Domain.Models;

namespace SmartSofto.Commerce.Infrastructure.Services
{
    public class InvoiceService : IInvoiceService
    {
        private readonly ApplicationDbContext _context;

        public InvoiceService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IReadOnlyList<Invoice>> GetInvoicesAsync(int tenantId, string? userId, bool isAdmin)
        {
            var query = _context.Invoices
                .Where(i => i.TenantId == tenantId)
                .Include(i => i.Order)
                    .ThenInclude(o => o.Client)
                .AsQueryable();

            if (!isAdmin)
            {
                if (string.IsNullOrWhiteSpace(userId))
                {
                    return Array.Empty<Invoice>();
                }

                var client = await _context.Clients.FirstOrDefaultAsync(c => c.UserId == userId && c.TenantId == tenantId);
                if (client == null)
                {
                    return Array.Empty<Invoice>();
                }

                query = query.Where(i => i.Order != null && i.Order.ClientId == client.Id);
            }

            var invoices = await query.OrderByDescending(i => i.CreatedAt).ToListAsync();
            foreach (var invoice in invoices)
            {
                invoice.OrderNumber = invoice.Order?.OrderNumber;
                invoice.ClientName = invoice.Order?.Client?.Name;
            }

            return invoices;
        }

        public async Task<Invoice?> GetInvoiceAsync(int tenantId, int id, string? userId, bool isAdmin)
        {
            var query = _context.Invoices
                .Where(i => i.TenantId == tenantId)
                .Include(i => i.Order)
                    .ThenInclude(o => o.Client)
                .AsQueryable();

            if (!isAdmin)
            {
                if (string.IsNullOrWhiteSpace(userId))
                {
                    return null;
                }

                var client = await _context.Clients.FirstOrDefaultAsync(c => c.UserId == userId && c.TenantId == tenantId);
                if (client == null)
                {
                    return null;
                }

                query = query.Where(i => i.Order != null && i.Order.ClientId == client.Id);
            }

            var invoice = await query.FirstOrDefaultAsync(i => i.Id == id);
            if (invoice == null)
            {
                return null;
            }

            invoice.OrderNumber = invoice.Order?.OrderNumber;
            invoice.ClientName = invoice.Order?.Client?.Name;
            return invoice;
        }

        public async Task<Invoice> CreateInvoiceAsync(int tenantId, Invoice invoice, string? userId)
        {
            var order = await _context.Orders
                .Where(o => o.TenantId == tenantId)
                .Include(o => o.Client)
                .FirstOrDefaultAsync(o => o.Id == invoice.OrderId);

            if (order == null)
            {
                throw new InvalidOperationException("Order not found");
            }

            if (order.InvoiceStatus == InvoiceStatus.Paid)
            {
                throw new InvalidOperationException("Order is already fully paid");
            }

            if (invoice.Amount <= 0)
            {
                throw new InvalidOperationException("Payment amount must be greater than 0");
            }

            var adjustmentAmounts = await _context.OrderAdjustments
                .Where(a => a.TenantId == tenantId && a.OrderId == order.Id)
                .Select(a => a.Amount)
                .ToListAsync();
            var adjustmentTotal = adjustmentAmounts.Sum();
            var effectiveTotal = Math.Max(order.TotalAmount - adjustmentTotal, 0m);
            var remainingAmount = effectiveTotal - (order.AmountPaid + order.AppliedCreditAmount);
            if (invoice.Amount > remainingAmount)
            {
                throw new InvalidOperationException($"Payment amount cannot exceed remaining amount of {remainingAmount}");
            }

            invoice.InvoiceNumber = await GenerateInvoiceNumberAsync();
            invoice.InvoiceDate = invoice.InvoiceDate == default ? DateTime.UtcNow.Date : invoice.InvoiceDate.Date;
            invoice.CreatedAt = DateTime.UtcNow;
            invoice.CreatedUtc = DateTime.UtcNow;
            invoice.Status = InvoiceStatus.Unpaid;
            invoice.TenantId = tenantId;
            invoice.SellerProfileId = await GetDefaultSellerProfileIdAsync(tenantId, userId);
            invoice.BuyerBusinessName = SnapshotBuyerBusinessName(order.Client);
            invoice.BuyerGstin = SnapshotBuyerGstin(order.Client);

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                _context.Invoices.Add(invoice);
                order.AmountPaid += invoice.Amount;
                var settledAmount = order.AmountPaid + order.AppliedCreditAmount;
                order.InvoiceStatus = settledAmount >= effectiveTotal
                    ? InvoiceStatus.Paid
                    : settledAmount > 0 ? InvoiceStatus.PartiallyPaid : InvoiceStatus.Unpaid;
                order.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }

            invoice.OrderNumber = order.OrderNumber;
            invoice.ClientName = order.Client?.Name;
            return invoice;
        }

        private static string? SnapshotBuyerBusinessName(Client? client)
        {
            return string.IsNullOrWhiteSpace(client?.CompanyName) ? null : client.CompanyName.Trim();
        }

        private static string? SnapshotBuyerGstin(Client? client)
        {
            return string.IsNullOrWhiteSpace(client?.Gstin) ? null : client.Gstin.Trim();
        }

        public async Task<IReadOnlyList<Invoice>> GetInvoicesForOrderAsync(int tenantId, int orderId, string? userId, bool isAdmin)
        {
            var query = _context.Invoices
                .Where(i => i.TenantId == tenantId)
                .Include(i => i.Order)
                    .ThenInclude(o => o.Client)
                .AsQueryable();

            if (!isAdmin)
            {
                if (string.IsNullOrWhiteSpace(userId))
                {
                    return Array.Empty<Invoice>();
                }

                var client = await _context.Clients.FirstOrDefaultAsync(c => c.UserId == userId && c.TenantId == tenantId);
                if (client == null)
                {
                    return Array.Empty<Invoice>();
                }

                query = query.Where(i => i.Order != null && i.Order.ClientId == client.Id);
            }

            var invoices = await query
                .Where(i => i.OrderId == orderId)
                .OrderByDescending(i => i.CreatedAt)
                .ToListAsync();

            foreach (var invoice in invoices)
            {
                invoice.OrderNumber = invoice.Order?.OrderNumber;
                invoice.ClientName = invoice.Order?.Client?.Name;
            }

            return invoices;
        }

        public async Task<bool> DeleteInvoiceAsync(int tenantId, int id)
        {
            var invoice = await _context.Invoices
                .FirstOrDefaultAsync(i => i.Id == id && i.TenantId == tenantId);

            if (invoice == null)
            {
                return false;
            }

            throw new BusinessConflictException(
                "Issued invoices cannot be deleted. Please void the invoice instead.");
        }

        private async Task<string> GenerateInvoiceNumberAsync()
        {
            var lastInvoice = await _context.Invoices
                .OrderByDescending(i => i.InvoiceNumber)
                .FirstOrDefaultAsync();

            var nextNumber = 1;
            if (lastInvoice?.InvoiceNumber.StartsWith("INV") == true)
            {
                if (int.TryParse(lastInvoice.InvoiceNumber.Substring(3), out var lastNumber))
                {
                    nextNumber = lastNumber + 1;
                }
            }

            return $"INV{nextNumber:D4}";
        }

        private async Task<int?> GetDefaultSellerProfileIdAsync(int tenantId, string? userId)
        {
            var query = _context.SellerProfiles.Where(profile => profile.TenantId == tenantId);
            if (!string.IsNullOrWhiteSpace(userId))
            {
                var userProfileId = await query
                    .Where(profile => profile.AdminUserId == userId)
                    .Select(profile => (int?)profile.Id)
                    .FirstOrDefaultAsync();

                if (userProfileId.HasValue)
                {
                    return userProfileId;
                }
            }

            return await query
                .OrderBy(profile => profile.Id)
                .Select(profile => (int?)profile.Id)
                .FirstOrDefaultAsync();
        }
    }
}
