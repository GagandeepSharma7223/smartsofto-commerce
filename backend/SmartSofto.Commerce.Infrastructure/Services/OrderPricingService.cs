using Microsoft.EntityFrameworkCore;
using SmartSofto.Commerce.Application.DTOs;
using SmartSofto.Commerce.Application.Interfaces;

namespace SmartSofto.Commerce.Infrastructure.Services
{
    public class OrderPricingService : IOrderPricingService
    {
        private readonly ApplicationDbContext _context;

        public OrderPricingService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<OrderPricingResult> PriceAsync(int tenantId, IReadOnlyList<PricingLineInput> lines, bool validateStock)
        {
            if (lines == null || lines.Count == 0)
            {
                throw new InvalidOperationException("Cart items are required");
            }

            var productIds = lines.Select(l => l.ProductId).Distinct().ToList();
            var products = await _context.Products
                .AsNoTracking()
                .Where(p => productIds.Contains(p.Id) && p.TenantId == tenantId)
                .ToDictionaryAsync(p => p.Id);

            var result = new OrderPricingResult();

            foreach (var line in lines)
            {
                if (!products.TryGetValue(line.ProductId, out var product))
                {
                    throw new InvalidOperationException($"Product not found: {line.ProductId}");
                }

                if (line.Quantity <= 0)
                {
                    throw new InvalidOperationException($"Quantity must be greater than 0 for product {line.ProductId}");
                }

                var unitPrice = line.UnitPrice ?? product.Price;
                if (unitPrice < 0)
                {
                    throw new InvalidOperationException($"Unit price must be >= 0 for product {line.ProductId}");
                }

                var gross = unitPrice * line.Quantity;
                var discount = line.DiscountAmount ?? 0m;
                if (discount < 0)
                {
                    throw new InvalidOperationException($"Discount must be >= 0 for product {line.ProductId}");
                }
                if (discount > gross)
                {
                    throw new InvalidOperationException($"Discount cannot exceed line total for product {line.ProductId}");
                }

                if (validateStock && product.Quantity < line.Quantity)
                {
                    throw new InvalidOperationException($"Insufficient stock for product {line.ProductId}. Available: {product.Quantity}");
                }

                var net = gross - discount;

                result.Lines.Add(new PricingLineResult
                {
                    ProductId = product.Id,
                    ProductName = product.Name,
                    Quantity = line.Quantity,
                    UnitPrice = unitPrice,
                    DiscountAmount = discount,
                    LineGross = gross,
                    LineNet = net,
                    AvailableQuantity = product.Quantity
                });

                result.TotalItems += line.Quantity;
                result.Subtotal += net;
                result.DiscountTotal += discount;
            }

            result.Total = result.Subtotal;
            return result;
        }
    }
}
