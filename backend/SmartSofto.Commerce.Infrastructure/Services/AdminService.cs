using Microsoft.EntityFrameworkCore;
using SmartSofto.Commerce.Application.DTOs;
using SmartSofto.Commerce.Application.Interfaces;
using SmartSofto.Commerce.Domain.Models;

namespace SmartSofto.Commerce.Infrastructure.Services
{
    public class AdminService : IAdminService
    {
        private readonly ApplicationDbContext _context;
        private readonly IOrderService _orderService;

        public AdminService(ApplicationDbContext context, IOrderService orderService)
        {
            _context = context;
            _orderService = orderService;
        }

        public async Task<AdminDashboardSummaryDto> GetDashboardSummaryAsync(int tenantId)
        {
            var now = DateTime.UtcNow;
            var sevenDays = now.AddDays(-7);
            var thirtyDays = now.AddDays(-30);

            return new AdminDashboardSummaryDto
            {
                ProductsCount = await _context.Products.Where(p => p.TenantId == tenantId).CountAsync(),
                OrdersCount = await _context.Orders.Where(o => o.TenantId == tenantId).CountAsync(),
                Revenue7d = await _context.Orders
                    .Where(o => o.TenantId == tenantId && (o.UpdatedAt ?? o.CreatedAt) >= sevenDays)
                    .SumAsync(o => o.AmountPaid),
                Revenue30d = await _context.Orders
                    .Where(o => o.TenantId == tenantId && (o.UpdatedAt ?? o.CreatedAt) >= thirtyDays)
                    .SumAsync(o => o.AmountPaid),
                UnpaidInvoices = await _context.Orders
                    .Where(o => o.TenantId == tenantId && o.Status != OrderStatus.Cancelled && o.TotalAmount > 0 && o.AmountPaid <= 0)
                    .CountAsync(),
                PartiallyPaidInvoices = await _context.Orders
                    .Where(o => o.TenantId == tenantId && o.Status != OrderStatus.Cancelled && o.AmountPaid > 0 && o.AmountPaid < o.TotalAmount)
                    .CountAsync()
            };
        }

        public async Task<IReadOnlyList<AdminOrderSummaryDto>> GetOrdersAsync(int tenantId, OrderStatus? status)
        {
            var query = _context.Orders
                .Where(o => o.TenantId == tenantId)
                .Include(o => o.Client)
                .Include(o => o.Product)
                .AsQueryable();

            if (status.HasValue)
            {
                query = query.Where(o => o.Status == status.Value);
            }

            return await query
                .OrderByDescending(o => o.CreatedAt)
                .Select(o => new AdminOrderSummaryDto
                {
                    Id = o.Id,
                    OrderNumber = o.OrderNumber,
                    ClientId = o.ClientId,
                    ClientName = o.Client != null ? o.Client.Name : null,
                    ProductId = o.ProductId,
                    ProductName = o.Product != null ? o.Product.Name : null,
                    Quantity = o.Quantity,
                    UnitPrice = o.UnitPrice,
                    TotalAmount = o.TotalAmount,
                    Status = o.Status,
                    PaymentMethod = o.PaymentMethod,
                    InvoiceStatus = o.InvoiceStatus,
                    AmountPaid = o.AmountPaid,
                    CreatedAt = o.CreatedAt,
                    UpdatedAt = o.UpdatedAt,
                    RemainingAmount = o.TotalAmount - o.AmountPaid
                })
                .ToListAsync();
        }

        public async Task<OrderStatusResult?> UpdateOrderStatusAsync(int tenantId, int id, OrderStatus newStatus, string? userId)
        {
            return await _orderService.UpdateOrderStatusAsync(tenantId, id, newStatus, userId);
        }

        public async Task<IReadOnlyList<AdminInvoiceSummaryDto>> GetInvoicesAsync(int tenantId, int? orderId)
        {
            var query = _context.Invoices
                .Where(i => i.TenantId == tenantId)
                .Include(i => i.Order)
                    .ThenInclude(o => o.Client)
                .AsQueryable();

            if (orderId.HasValue)
            {
                query = query.Where(i => i.OrderId == orderId.Value);
            }

            return await query
                .OrderByDescending(i => i.CreatedAt)
                .Select(i => new AdminInvoiceSummaryDto
                {
                    Id = i.Id,
                    InvoiceNumber = i.InvoiceNumber,
                    OrderId = i.OrderId,
                    OrderNumber = i.Order != null ? i.Order.OrderNumber : null,
                    ClientName = i.Order != null ? i.Order.Client != null ? i.Order.Client.Name : null : null,
                    Amount = i.Amount,
                    PaymentMethod = i.PaymentMethod,
                    ReferenceNumber = i.ReferenceNumber,
                    Status = i.Status,
                    Notes = i.Notes,
                    CreatedAt = i.CreatedAt,
                    UpdatedAt = i.UpdatedAt,
                    OrderTotalAmount = i.Order != null ? i.Order.TotalAmount : null,
                    OrderAmountPaid = i.Order != null ? i.Order.AmountPaid : null,
                    OrderInvoiceStatus = i.Order != null ? i.Order.InvoiceStatus : null
                })
                .ToListAsync();
        }

        public async Task<AdminInvoiceCreateResultDto> CreateInvoiceAsync(int tenantId, AdminCreateInvoiceRequest request)
        {
            var order = await _context.Orders.FirstOrDefaultAsync(o => o.Id == request.OrderId && o.TenantId == tenantId);
            if (order == null)
            {
                throw new InvalidOperationException("Order not found");
            }

            var remaining = order.TotalAmount - order.AmountPaid;
            if (request.Amount <= 0)
            {
                throw new InvalidOperationException("Amount must be greater than 0");
            }
            if (request.Amount > remaining)
            {
                throw new InvalidOperationException($"Amount exceeds remaining balance ({remaining})");
            }

            var invoice = new Invoice
            {
                OrderId = request.OrderId,
                Amount = request.Amount,
                PaymentMethod = request.PaymentMethod,
                ReferenceNumber = request.ReferenceNumber,
                Notes = request.Notes,
                Status = InvoiceStatus.Paid,
                CreatedAt = DateTime.UtcNow,
                CreatedUtc = DateTime.UtcNow,
                TenantId = tenantId,
                InvoiceNumber = await GenerateInvoiceNumberAsync()
            };

            using var tx = await _context.Database.BeginTransactionAsync();
            try
            {
                _context.Invoices.Add(invoice);

                order.AmountPaid += request.Amount;
                order.InvoiceStatus = order.AmountPaid >= order.TotalAmount
                    ? InvoiceStatus.Paid
                    : InvoiceStatus.PartiallyPaid;
                order.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();
                await tx.CommitAsync();
            }
            catch
            {
                await tx.RollbackAsync();
                throw;
            }

            return new AdminInvoiceCreateResultDto
            {
                Id = invoice.Id,
                InvoiceNumber = invoice.InvoiceNumber,
                OrderId = invoice.OrderId,
                Amount = invoice.Amount,
                PaymentMethod = invoice.PaymentMethod,
                Status = invoice.Status,
                ReferenceNumber = invoice.ReferenceNumber,
                Notes = invoice.Notes,
                CreatedAt = invoice.CreatedAt
            };
        }

        public async Task<IReadOnlyList<AdminMonthlyRevenueDto>> GetMonthlyRevenueAsync(int tenantId, int year)
        {
            var monthly = await _context.Invoices
                .Where(i => i.TenantId == tenantId && i.CreatedUtc.Year == year && i.Status != InvoiceStatus.Unpaid)
                .GroupBy(i => i.CreatedUtc.Month)
                .Select(g => new { Month = g.Key, Total = g.Sum(i => i.Amount) })
                .ToListAsync();

            var result = Enumerable.Range(1, 12)
                .Select(m => new AdminMonthlyRevenueDto
                {
                    Month = m,
                    Total = monthly.FirstOrDefault(x => x.Month == m)?.Total ?? 0m
                })
                .ToList();

            return result;
        }

        public async Task<AdminTotalRevenueDto> GetTotalForRangeAsync(int tenantId, DateTime startDate, DateTime endDate)
        {
            if (endDate < startDate)
            {
                throw new InvalidOperationException("endDate must be after startDate");
            }

            var total = await _context.Orders
                .Where(o => o.TenantId == tenantId && (o.UpdatedAt ?? o.CreatedAt) >= startDate && (o.UpdatedAt ?? o.CreatedAt) <= endDate)
                .SumAsync(o => o.AmountPaid);

            return new AdminTotalRevenueDto { Total = total };
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
