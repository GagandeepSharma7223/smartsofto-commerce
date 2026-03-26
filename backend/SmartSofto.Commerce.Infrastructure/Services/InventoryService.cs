using Microsoft.EntityFrameworkCore;
using SmartSofto.Commerce.Application.DTOs;
using SmartSofto.Commerce.Application.Interfaces;
using SmartSofto.Commerce.Domain.Models;

namespace SmartSofto.Commerce.Infrastructure.Services
{
    public class InventoryService : IInventoryService
    {
        private const int MaxBackdateDays = 7;
        private readonly ApplicationDbContext _context;

        public InventoryService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<InventoryTransaction> AdjustStock(
            int tenantId,
            int productId,
            int qtyDelta,
            string reason,
            string? note,
            string? userId,
            string referenceType = "Manual",
            string? referenceId = null,
            bool allowNegative = false,
            DateTime? effectiveDate = null,
            bool allowBackdating = false)
        {
            if (qtyDelta == 0)
            {
                throw new InvalidOperationException("Quantity delta must not be 0.");
            }

            var normalizedEffectiveDate = NormalizeEffectiveDate(effectiveDate, note, allowBackdating);

            var product = await _context.Products
                .FirstOrDefaultAsync(p => p.Id == productId && p.TenantId == tenantId);

            if (product == null)
            {
                throw new InvalidOperationException("Product not found for tenant.");
            }

            var allowNegativeReason = string.Equals(reason, "Correction", StringComparison.OrdinalIgnoreCase);
            var allowNegativeFinal = allowNegative || allowNegativeReason;
            if (!allowNegativeFinal && product.Quantity + qtyDelta < 0)
            {
                throw new InvalidOperationException("Insufficient stock for adjustment.");
            }

            var hadTransaction = _context.Database.CurrentTransaction != null;
            using var transaction = !hadTransaction
                ? await _context.Database.BeginTransactionAsync()
                : null;

            try
            {
                product.Quantity += qtyDelta;

                var entry = new InventoryTransaction
                {
                    TenantId = tenantId,
                    ProductId = productId,
                    QuantityDelta = qtyDelta,
                    Reason = reason,
                    ReferenceType = referenceType,
                    ReferenceId = referenceId,
                    Note = note,
                    EffectiveDate = normalizedEffectiveDate,
                    CreatedUtc = DateTime.UtcNow,
                    CreatedByUserId = userId
                };

                _context.InventoryTransactions.Add(entry);
                await _context.SaveChangesAsync();

                if (transaction != null)
                {
                    await transaction.CommitAsync();
                }

                return entry;
            }
            catch
            {
                if (transaction != null)
                {
                    await transaction.RollbackAsync();
                }
                throw;
            }
        }

        public async Task<IReadOnlyList<InventoryItemDto>> GetInventory(
            int tenantId,
            string? search,
            int page,
            int pageSize)
        {
            if (page < 1) page = 1;
            if (pageSize < 1) pageSize = 20;

            var query = _context.Products
                .AsNoTracking()
                .Where(p => p.TenantId == tenantId);

            if (!string.IsNullOrWhiteSpace(search))
            {
                var term = search.Trim();
                query = query.Where(p => p.Name.Contains(term) || p.SKU.Contains(term));
            }

            return await query
                .OrderBy(p => p.Name)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(p => new InventoryItemDto
                {
                    ProductId = p.Id,
                    Name = p.Name,
                    Quantity = p.Quantity,
                    Price = p.Price,
                    Unit = (int)p.Unit,
                    IsActive = p.IsActive
                })
                .ToListAsync();
        }

        public async Task<IReadOnlyList<InventoryTransactionDto>> GetTransactions(
            int tenantId,
            int? productId,
            DateTime? from,
            DateTime? to,
            int page,
            int pageSize)
        {
            if (page < 1) page = 1;
            if (pageSize < 1) pageSize = 20;

            var query = _context.InventoryTransactions
                .AsNoTracking()
                .Include(t => t.Product)
                .Where(t => t.TenantId == tenantId);

            if (productId.HasValue)
            {
                query = query.Where(t => t.ProductId == productId.Value);
            }

            if (from.HasValue)
            {
                var fromDate = from.Value.Date;
                query = query.Where(t => t.EffectiveDate >= fromDate);
            }

            if (to.HasValue)
            {
                var toDate = to.Value.Date;
                query = query.Where(t => t.EffectiveDate <= toDate);
            }

            return await query
                .OrderByDescending(t => t.EffectiveDate)
                .ThenByDescending(t => t.CreatedUtc)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(t => new InventoryTransactionDto
                {
                    Id = t.Id,
                    ProductId = t.ProductId,
                    ProductName = t.Product != null ? t.Product.Name : null,
                    QuantityDelta = t.QuantityDelta,
                    Reason = t.Reason,
                    ReferenceType = t.ReferenceType,
                    ReferenceId = t.ReferenceId,
                    Note = t.Note,
                    EffectiveDate = t.EffectiveDate,
                    CreatedUtc = t.CreatedUtc,
                    CreatedByUserId = t.CreatedByUserId
                })
                .ToListAsync();
        }

        private static DateTime NormalizeEffectiveDate(DateTime? effectiveDate, string? note, bool allowBackdating)
        {
            var today = GetBusinessToday();
            var requestedDate = effectiveDate?.Date ?? today;

            if (requestedDate > today)
            {
                throw new InvalidOperationException("Future-dated inventory entries are not allowed.");
            }

            var daysBack = (today - requestedDate).Days;
            if (daysBack > MaxBackdateDays)
            {
                throw new InvalidOperationException("Backdated inventory entries older than 7 days are not allowed.");
            }

            if (daysBack > 0)
            {
                if (!allowBackdating)
                {
                    throw new InvalidOperationException("Backdated inventory entries are only allowed for admin users.");
                }

                if (string.IsNullOrWhiteSpace(note))
                {
                    throw new InvalidOperationException("Backdated inventory entries require a note.");
                }
            }

            return requestedDate;
        }

        private static DateTime GetBusinessToday()
        {
            return TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, TimeZoneInfo.Local).Date;
        }
    }
}
