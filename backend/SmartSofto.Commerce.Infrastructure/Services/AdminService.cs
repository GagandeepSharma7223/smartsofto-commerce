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
        private readonly IClientAccountService _clientAccountService;

        public AdminService(ApplicationDbContext context, IOrderService orderService, IClientAccountService clientAccountService)
        {
            _context = context;
            _orderService = orderService;
            _clientAccountService = clientAccountService;
        }

        public async Task<AdminDashboardSummaryDto> GetDashboardSummaryAsync(int tenantId)
        {
            var now = DateTime.UtcNow;
            var sevenDays = now.AddDays(-7);
            var thirtyDays = now.AddDays(-30);

            var orders = await _context.Orders
                .AsNoTracking()
                .Where(o => o.TenantId == tenantId)
                .Select(o => new
                {
                    o.Id,
                    o.Status,
                    o.TotalAmount,
                    o.AmountPaid,
                    o.AppliedCreditAmount
                })
                .ToListAsync();

            var adjustmentMap = await GetOrderAdjustmentMapAsync(tenantId, orders.Select(o => o.Id).ToList());

            var unpaid = 0;
            var partial = 0;
            foreach (var order in orders.Where(o => o.Status != OrderStatus.Cancelled))
            {
                var adjustedTotal = GetAdjustedTotal(order.TotalAmount, adjustmentMap.GetValueOrDefault(order.Id, 0m));
                var settled = order.AmountPaid + order.AppliedCreditAmount;
                if (adjustedTotal > 0m && settled <= 0m)
                {
                    unpaid++;
                }
                else if (settled > 0m && settled < adjustedTotal)
                {
                    partial++;
                }
            }

            return new AdminDashboardSummaryDto
            {
                ProductsCount = await _context.Products.Where(p => p.TenantId == tenantId).CountAsync(),
                OrdersCount = orders.Count,
                Revenue7d = await _context.Orders
                    .Where(o => o.TenantId == tenantId && (o.UpdatedAt ?? o.CreatedAt) >= sevenDays)
                    .SumAsync(o => o.AmountPaid),
                Revenue30d = await _context.Orders
                    .Where(o => o.TenantId == tenantId && (o.UpdatedAt ?? o.CreatedAt) >= thirtyDays)
                    .SumAsync(o => o.AmountPaid),
                UnpaidInvoices = unpaid,
                PartiallyPaidInvoices = partial
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

            var orders = await query
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
                    AppliedCreditAmount = o.AppliedCreditAmount,
                    SettledAmount = o.AmountPaid + o.AppliedCreditAmount,
                    OrderDate = o.OrderDate,
                    CreatedAt = o.CreatedAt,
                    UpdatedAt = o.UpdatedAt
                })
                .ToListAsync();

            var adjustmentMap = await GetOrderAdjustmentMapAsync(tenantId, orders.Select(o => o.Id).ToList());
            var adjustmentCountMap = await GetOrderAdjustmentCountMapAsync(tenantId, orders.Select(o => o.Id).ToList());

            foreach (var order in orders)
            {
                order.AdjustmentTotal = adjustmentMap.GetValueOrDefault(order.Id, 0m);
                order.AdjustedTotalAmount = GetAdjustedTotal(order.TotalAmount, order.AdjustmentTotal);
                order.AdjustmentCount = adjustmentCountMap.GetValueOrDefault(order.Id, 0);
                order.RemainingAmount = Math.Max(order.AdjustedTotalAmount - order.SettledAmount, 0m);
            }

            return orders;
        }

        public async Task<OrderStatusResult?> UpdateOrderStatusAsync(int tenantId, int id, OrderStatus newStatus, string? userId)
        {
            return await _orderService.UpdateOrderStatusAsync(tenantId, id, newStatus, userId);
        }

        public async Task<IReadOnlyList<AdminInvoiceSummaryDto>> GetInvoicesAsync(int tenantId, int? orderId, string? orderNumber = null)
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
            else if (!string.IsNullOrWhiteSpace(orderNumber))
            {
                var normalizedOrderNumber = orderNumber.Trim();
                query = query.Where(i => i.Order != null && i.Order.OrderNumber == normalizedOrderNumber);
            }

            var invoices = await query
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
                    InvoiceDate = i.InvoiceDate,
                    CreatedAt = i.CreatedAt,
                    UpdatedAt = i.UpdatedAt,
                    OrderTotalAmount = i.Order != null ? i.Order.TotalAmount : null,
                    OrderAmountPaid = i.Order != null ? i.Order.AmountPaid : null,
                    OrderAppliedCreditAmount = i.Order != null ? i.Order.AppliedCreditAmount : null,
                    OrderSettledAmount = i.Order != null ? i.Order.AmountPaid + i.Order.AppliedCreditAmount : null,
                    OrderInvoiceStatus = i.Order != null ? i.Order.InvoiceStatus : null
                })
                .ToListAsync();

            var adjustmentMap = await GetOrderAdjustmentMapAsync(tenantId, invoices.Select(i => i.OrderId).Distinct().ToList());
            var adjustmentCountMap = await GetOrderAdjustmentCountMapAsync(tenantId, invoices.Select(i => i.OrderId).Distinct().ToList());

            foreach (var invoice in invoices)
            {
                var adjustmentTotal = adjustmentMap.GetValueOrDefault(invoice.OrderId, 0m);
                invoice.OrderAdjustmentTotal = adjustmentTotal;
                invoice.OrderAdjustmentCount = adjustmentCountMap.GetValueOrDefault(invoice.OrderId, 0);
                invoice.OrderAdjustedTotalAmount = invoice.OrderTotalAmount.HasValue
                    ? GetAdjustedTotal(invoice.OrderTotalAmount.Value, adjustmentTotal)
                    : null;
            }

            return invoices;
        }

        public async Task<AdminInvoiceCreateResultDto> CreateInvoiceAsync(int tenantId, AdminCreateInvoiceRequest request, string? userId)
        {
            var order = await _context.Orders
                .Include(o => o.Client)
                .FirstOrDefaultAsync(o => o.Id == request.OrderId && o.TenantId == tenantId);
            if (order == null)
            {
                throw new InvalidOperationException("Order not found");
            }

            var adjustedTotal = await GetAdjustedOrderTotalAsync(tenantId, order);
            var remaining = adjustedTotal - (order.AmountPaid + order.AppliedCreditAmount);
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
                InvoiceDate = DateTime.UtcNow.Date,
                CreatedAt = DateTime.UtcNow,
                CreatedUtc = DateTime.UtcNow,
                TenantId = tenantId,
                SellerProfileId = await GetDefaultSellerProfileIdAsync(tenantId, userId),
                BuyerBusinessName = SnapshotBuyerBusinessName(order.Client),
                BuyerGstin = SnapshotBuyerGstin(order.Client),
                InvoiceNumber = await GenerateInvoiceNumberAsync()
            };

            using var tx = await _context.Database.BeginTransactionAsync();
            try
            {
                _context.Invoices.Add(invoice);

                order.AmountPaid += request.Amount;
                var settledAmount = order.AmountPaid + order.AppliedCreditAmount;
                order.InvoiceStatus = ResolveInvoiceStatus(adjustedTotal, settledAmount);
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
                CreatedAt = invoice.CreatedAt,
                InvoiceDate = invoice.InvoiceDate
            };
        }

        private static string? SnapshotBuyerBusinessName(Client? client)
        {
            return string.IsNullOrWhiteSpace(client?.CompanyName) ? null : client.CompanyName.Trim();
        }

        private static string? SnapshotBuyerGstin(Client? client)
        {
            return string.IsNullOrWhiteSpace(client?.Gstin) ? null : client.Gstin.Trim();
        }

        public async Task<IReadOnlyList<OrderAdjustmentDto>> GetOrderAdjustmentsAsync(int tenantId, int orderId)
        {
            return await _context.OrderAdjustments
                .AsNoTracking()
                .Where(a => a.TenantId == tenantId && a.OrderId == orderId)
                .Include(a => a.Invoice)
                .OrderByDescending(a => a.CreatedUtc)
                .Select(a => new OrderAdjustmentDto
                {
                    Id = a.Id,
                    OrderId = a.OrderId,
                    InvoiceId = a.InvoiceId,
                    InvoiceNumber = a.Invoice != null ? a.Invoice.InvoiceNumber : null,
                    TenantId = a.TenantId,
                    Type = a.Type,
                    Amount = a.Amount,
                    Reason = a.Reason,
                    Note = a.Note,
                    CreatedUtc = a.CreatedUtc
                })
                .ToListAsync();
        }

        public async Task<OrderAdjustmentDto> CreateOrderAdjustmentAsync(int tenantId, int orderId, AdminCreateOrderAdjustmentRequest request)
        {
            var order = await _context.Orders
                .Include(o => o.Client)
                .FirstOrDefaultAsync(o => o.Id == orderId && o.TenantId == tenantId);
            if (order == null)
            {
                throw new InvalidOperationException("Order not found");
            }

            if (order.Status != OrderStatus.Delivered)
            {
                throw new InvalidOperationException("Discount adjustments are only allowed for delivered orders.");
            }

            if (!Enum.IsDefined(typeof(OrderAdjustmentType), request.Type))
            {
                throw new InvalidOperationException("Invalid adjustment type.");
            }

            if (request.Amount <= 0)
            {
                throw new InvalidOperationException("Adjustment amount must be greater than 0.");
            }

            if (string.IsNullOrWhiteSpace(request.Reason))
            {
                throw new InvalidOperationException("Reason is required.");
            }

            var currentAdjustmentTotal = await GetOrderAdjustmentTotalAsync(tenantId, orderId);
            var currentAdjustedTotal = GetAdjustedTotal(order.TotalAmount, currentAdjustmentTotal);
            if (request.Amount > currentAdjustedTotal)
            {
                throw new InvalidOperationException($"Adjustment amount cannot exceed current adjusted total of {currentAdjustedTotal:0.00}.");
            }

            var rootInvoice = await _context.Invoices
                .Where(i => i.TenantId == tenantId && i.OrderId == orderId)
                .OrderBy(i => i.CreatedAt)
                .ThenBy(i => i.Id)
                .FirstOrDefaultAsync();

            var adjustment = new OrderAdjustment
            {
                OrderId = orderId,
                InvoiceId = rootInvoice?.Id,
                TenantId = tenantId,
                Type = request.Type,
                Amount = request.Amount,
                Reason = request.Reason.Trim(),
                Note = string.IsNullOrWhiteSpace(request.Note) ? null : request.Note.Trim(),
                CreatedUtc = DateTime.UtcNow
            };

            using var tx = await _context.Database.BeginTransactionAsync();
            try
            {
                _context.OrderAdjustments.Add(adjustment);
                await _context.SaveChangesAsync();

                var adjustmentTotal = currentAdjustmentTotal + request.Amount;
                var adjustedTotal = GetAdjustedTotal(order.TotalAmount, adjustmentTotal);
                var settledAmount = order.AmountPaid + order.AppliedCreditAmount;
                order.InvoiceStatus = ResolveInvoiceStatus(adjustedTotal, settledAmount);
                order.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                var existingOverpaymentCredits = await _context.ClientAccountTransactions
                    .Where(t => t.TenantId == tenantId && t.ClientId == order.ClientId && t.ReferenceType == "OrderAdjustmentOverpayment" && t.ReferenceId == order.Id.ToString())
                    .SumAsync(t => (decimal?)t.Amount) ?? 0m;

                var overpayment = Math.Max(settledAmount - adjustedTotal, 0m);
                var creditToGenerate = overpayment - existingOverpaymentCredits;
                if (creditToGenerate > 0m)
                {
                    await _clientAccountService.RecordAdjustmentCreditAsync(
                        tenantId,
                        order.ClientId,
                        creditToGenerate,
                        "OrderAdjustmentOverpayment",
                        order.Id.ToString(),
                        order.OrderNumber,
                        $"Overpayment moved to client credit after order discount adjustment. {adjustment.Reason}",
                        DateTime.UtcNow.Date);
                }

                await tx.CommitAsync();
            }
            catch
            {
                await tx.RollbackAsync();
                throw;
            }

            return new OrderAdjustmentDto
            {
                Id = adjustment.Id,
                OrderId = adjustment.OrderId,
                InvoiceId = adjustment.InvoiceId,
                InvoiceNumber = rootInvoice?.InvoiceNumber,
                TenantId = adjustment.TenantId,
                Type = adjustment.Type,
                Amount = adjustment.Amount,
                Reason = adjustment.Reason,
                Note = adjustment.Note,
                CreatedUtc = adjustment.CreatedUtc
            };
        }

        public async Task<IReadOnlyList<AdminMonthlyRevenueDto>> GetMonthlyRevenueAsync(int tenantId, int year)
        {
            var monthly = await _context.Invoices
                .Where(i => i.TenantId == tenantId && i.CreatedUtc.Year == year && i.Status != InvoiceStatus.Unpaid)
                .GroupBy(i => i.CreatedUtc.Month)
                .Select(g => new { Month = g.Key, Total = g.Sum(i => i.Amount) })
                .ToListAsync();

            return Enumerable.Range(1, 12)
                .Select(m => new AdminMonthlyRevenueDto
                {
                    Month = m,
                    Total = monthly.FirstOrDefault(x => x.Month == m)?.Total ?? 0m
                })
                .ToList();
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

        public async Task<IReadOnlyList<ClientCreditBalanceDto>> GetClientCreditBalancesAsync(int tenantId)
        {
            return await _clientAccountService.GetClientBalancesAsync(tenantId);
        }

        public async Task<ClientCreditBalanceDto> GetClientCreditBalanceAsync(int tenantId, int clientId)
        {
            var client = await _context.Clients.AsNoTracking().FirstOrDefaultAsync(c => c.Id == clientId && c.TenantId == tenantId);
            if (client == null)
            {
                throw new InvalidOperationException("Client not found");
            }

            return new ClientCreditBalanceDto
            {
                ClientId = client.Id,
                ClientName = client.Name,
                AvailableCredit = await _clientAccountService.GetAvailableCreditAsync(tenantId, clientId)
            };
        }

        public async Task<IReadOnlyList<ClientAccountTransactionDto>> GetClientCreditLedgerAsync(int tenantId, int clientId)
        {
            return await _clientAccountService.GetClientLedgerAsync(tenantId, clientId);
        }

        public async Task<ClientAccountTransactionDto> RecordAdvancePaymentAsync(int tenantId, int clientId, AdminCreateAdvancePaymentRequest request)
        {
            return await _clientAccountService.RecordAdvancePaymentAsync(tenantId, clientId, request);
        }

        private async Task<Dictionary<int, decimal>> GetOrderAdjustmentMapAsync(int tenantId, List<int> orderIds)
        {
            if (orderIds.Count == 0)
            {
                return new Dictionary<int, decimal>();
            }

            return await _context.OrderAdjustments
                .AsNoTracking()
                .Where(a => a.TenantId == tenantId && orderIds.Contains(a.OrderId))
                .GroupBy(a => a.OrderId)
                .Select(g => new { g.Key, Total = g.Sum(x => x.Amount) })
                .ToDictionaryAsync(x => x.Key, x => x.Total);
        }

        private async Task<Dictionary<int, int>> GetOrderAdjustmentCountMapAsync(int tenantId, List<int> orderIds)
        {
            if (orderIds.Count == 0)
            {
                return new Dictionary<int, int>();
            }

            return await _context.OrderAdjustments
                .AsNoTracking()
                .Where(a => a.TenantId == tenantId && orderIds.Contains(a.OrderId))
                .GroupBy(a => a.OrderId)
                .Select(g => new { g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.Key, x => x.Count);
        }

        private async Task<decimal> GetOrderAdjustmentTotalAsync(int tenantId, int orderId)
        {
            return await _context.OrderAdjustments
                .Where(a => a.TenantId == tenantId && a.OrderId == orderId)
                .SumAsync(a => (decimal?)a.Amount) ?? 0m;
        }

        private async Task<decimal> GetAdjustedOrderTotalAsync(int tenantId, Order order)
        {
            var adjustmentTotal = await GetOrderAdjustmentTotalAsync(tenantId, order.Id);
            return GetAdjustedTotal(order.TotalAmount, adjustmentTotal);
        }

        private static decimal GetAdjustedTotal(decimal originalTotal, decimal adjustmentTotal)
        {
            return Math.Max(originalTotal - adjustmentTotal, 0m);
        }

        private static InvoiceStatus ResolveInvoiceStatus(decimal effectiveTotal, decimal settledAmount)
        {
            if (settledAmount <= 0m)
            {
                return InvoiceStatus.Unpaid;
            }

            return settledAmount >= effectiveTotal ? InvoiceStatus.Paid : InvoiceStatus.PartiallyPaid;
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
