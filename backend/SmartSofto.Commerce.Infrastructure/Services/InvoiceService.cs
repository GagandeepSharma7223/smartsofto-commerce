using Microsoft.EntityFrameworkCore;
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

        public async Task<Invoice> CreateInvoiceAsync(int tenantId, Invoice invoice)
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

            if (invoice.Amount > order.TotalAmount - order.AmountPaid)
            {
                throw new InvalidOperationException($"Payment amount cannot exceed remaining amount of {order.TotalAmount - order.AmountPaid}");
            }

            invoice.InvoiceNumber = await GenerateInvoiceNumberAsync();
            invoice.CreatedAt = DateTime.UtcNow;
            invoice.CreatedUtc = DateTime.UtcNow;
            invoice.Status = InvoiceStatus.Unpaid;
            invoice.TenantId = tenantId;

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                _context.Invoices.Add(invoice);
                order.AmountPaid += invoice.Amount;
                order.InvoiceStatus = order.AmountPaid >= order.TotalAmount
                    ? InvoiceStatus.Paid
                    : InvoiceStatus.PartiallyPaid;
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
    }
}
