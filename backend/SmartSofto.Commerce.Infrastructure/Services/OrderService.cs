using Microsoft.EntityFrameworkCore;
using SmartSofto.Commerce.Application.DTOs;
using SmartSofto.Commerce.Application.Interfaces;
using SmartSofto.Commerce.Domain.Models;

namespace SmartSofto.Commerce.Infrastructure.Services
{
    public class OrderService : IOrderService
    {
        private readonly ApplicationDbContext _context;
        private readonly IInventoryService _inventoryService;
        private readonly IOrderPricingService _pricingService;

        public OrderService(ApplicationDbContext context, IInventoryService inventoryService, IOrderPricingService pricingService)
        {
            _context = context;
            _inventoryService = inventoryService;
            _pricingService = pricingService;
        }

        public async Task<IReadOnlyList<OrderViewModel>> GetOrdersAsync(int tenantId, string? userId, bool isAdmin)
        {
            var query = _context.Orders.Where(o => o.TenantId == tenantId);

            if (!isAdmin)
            {
                if (string.IsNullOrWhiteSpace(userId))
                {
                    return Array.Empty<OrderViewModel>();
                }

                var client = await _context.Clients.FirstOrDefaultAsync(c => c.UserId == userId && c.TenantId == tenantId);
                if (client == null)
                {
                    return Array.Empty<OrderViewModel>();
                }

                query = query.Where(o => o.ClientId == client.Id);
            }

            return await query
                .AsNoTracking()
                .Select(o => new OrderViewModel
                {
                    Id = o.Id,
                    OrderNumber = o.OrderNumber,
                    OrderDate = o.OrderDate,
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
                    Notes = o.Notes,
                    ShippingAddress = o.ShippingAddressLine1 == null ? null : new AddressSnapshotDto
                    {
                        Name = o.ShippingName,
                        Phone = o.ShippingPhone,
                        Line1 = o.ShippingAddressLine1,
                        Line2 = o.ShippingAddressLine2,
                        City = o.ShippingCity,
                        State = o.ShippingState,
                        PostalCode = o.ShippingPostalCode,
                        Country = o.ShippingCountry
                    },
                    BillingAddress = o.ShippingAddressLine1 == null ? null : new AddressSnapshotDto
                    {
                        Name = o.ShippingName,
                        Phone = o.ShippingPhone,
                        Line1 = o.ShippingAddressLine1,
                        Line2 = o.ShippingAddressLine2,
                        City = o.ShippingCity,
                        State = o.ShippingState,
                        PostalCode = o.ShippingPostalCode,
                        Country = o.ShippingCountry
                    },
                    CreatedAt = o.CreatedAt,
                    UpdatedAt = o.UpdatedAt,
                    Items = o.Items.Select(i => new OrderItemViewModel
                    {
                        Id = i.Id,
                        ProductId = i.ProductId,
                        ProductName = i.Product != null ? i.Product.Name : null,
                        Quantity = i.Quantity,
                        UnitPrice = i.UnitPrice,
                        LineTotal = i.UnitPrice * i.Quantity
                    }).ToList()
                })
                .ToListAsync();
        }

        public async Task<OrderViewModel?> GetOrderAsync(int tenantId, int id, string? userId, bool isAdmin)
        {
            var query = _context.Orders.Where(o => o.TenantId == tenantId);

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

                query = query.Where(o => o.ClientId == client.Id);
            }

            return await query
                .AsNoTracking()
                .Where(o => o.Id == id)
                .Select(o => new OrderViewModel
                {
                    Id = o.Id,
                    OrderNumber = o.OrderNumber,
                    OrderDate = o.OrderDate,
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
                    Notes = o.Notes,
                    ShippingAddress = o.ShippingAddressLine1 == null ? null : new AddressSnapshotDto
                    {
                        Name = o.ShippingName,
                        Phone = o.ShippingPhone,
                        Line1 = o.ShippingAddressLine1,
                        Line2 = o.ShippingAddressLine2,
                        City = o.ShippingCity,
                        State = o.ShippingState,
                        PostalCode = o.ShippingPostalCode,
                        Country = o.ShippingCountry
                    },
                    BillingAddress = o.ShippingAddressLine1 == null ? null : new AddressSnapshotDto
                    {
                        Name = o.ShippingName,
                        Phone = o.ShippingPhone,
                        Line1 = o.ShippingAddressLine1,
                        Line2 = o.ShippingAddressLine2,
                        City = o.ShippingCity,
                        State = o.ShippingState,
                        PostalCode = o.ShippingPostalCode,
                        Country = o.ShippingCountry
                    },
                    CreatedAt = o.CreatedAt,
                    UpdatedAt = o.UpdatedAt,
                    Items = o.Items.Select(i => new OrderItemViewModel
                    {
                        Id = i.Id,
                        ProductId = i.ProductId,
                        ProductName = i.Product != null ? i.Product.Name : null,
                        Quantity = i.Quantity,
                        UnitPrice = i.UnitPrice,
                        LineTotal = i.UnitPrice * i.Quantity
                    }).ToList()
                })
                .FirstOrDefaultAsync();
        }

        public async Task<CartPriceViewModel> PriceCartAsync(int tenantId, PriceCartRequest request)
        {
            if (request == null || request.Items == null || request.Items.Count == 0)
            {
                throw new InvalidOperationException("Cart items are required");
            }

            var lines = request.Items.Select(item => new PricingLineInput
            {
                ProductId = item.ProductId,
                Quantity = item.Quantity,
                UnitPrice = item.UnitPrice,
                DiscountAmount = item.DiscountAmount
            }).ToList();

            var pricing = await _pricingService.PriceAsync(tenantId, lines, true);

            return new CartPriceViewModel
            {
                TotalItems = pricing.TotalItems,
                Subtotal = pricing.Subtotal,
                DiscountTotal = pricing.DiscountTotal,
                Total = pricing.Total,
                Items = pricing.Lines.Select(line => new CartPriceItemViewModel
                {
                    ProductId = line.ProductId,
                    ProductName = line.ProductName,
                    Quantity = line.Quantity,
                    UnitPrice = line.UnitPrice,
                    DiscountAmount = line.DiscountAmount,
                    LineTotal = line.LineNet
                }).ToList()
            };
        }


        private async Task<ClientAddress> ResolveShippingAddressAsync(int tenantId, Client client, MultiOrderRequest request)
        {
            if (request.ShippingAddressId.HasValue && request.ShippingAddressId.Value > 0)
            {
                var existing = await _context.ClientAddresses.FirstOrDefaultAsync(a => a.Id == request.ShippingAddressId.Value && a.TenantId == tenantId && a.ClientId == client.Id);
                if (existing == null)
                {
                    throw new InvalidOperationException("Shipping address not found");
                }
                return existing;
            }

            if (request.ShippingAddress == null)
            {
                throw new InvalidOperationException("Shipping address is required");
            }

            var hasAny = await _context.ClientAddresses.AnyAsync(a => a.ClientId == client.Id && a.TenantId == tenantId);
            var address = new ClientAddress
            {
                ClientId = client.Id,
                UserId = client.UserId,
                TenantId = tenantId,
                Label = string.IsNullOrWhiteSpace(request.ShippingAddress.Label) ? "Shipping" : request.ShippingAddress.Label,
                IsDefault = !hasAny,
                Name = request.ShippingAddress.Name ?? client.Name,
                Phone = request.ShippingAddress.Phone ?? client.PhoneNumber ?? string.Empty,
                AddressLine1 = request.ShippingAddress.Line1 ?? string.Empty,
                AddressLine2 = request.ShippingAddress.Line2,
                City = request.ShippingAddress.City ?? string.Empty,
                State = request.ShippingAddress.State ?? string.Empty,
                PostalCode = request.ShippingAddress.Pincode ?? string.Empty,
                Country = request.ShippingAddress.Country ?? "India"
            };

            _context.ClientAddresses.Add(address);
            await _context.SaveChangesAsync();
            return address;
        }

        public async Task<OrderCreateResult> CreateOrderAsync(int tenantId, MultiOrderRequest request)
        {
            var lines = request.Items ?? request.Lines;
            if (lines != null && lines.Any())
            {
                return await CreateMultipleOrdersAsync(tenantId, request, lines);
            }

            if (!request.ProductId.HasValue || request.ProductId.Value == 0)
            {
                throw new InvalidOperationException("ProductId is required");
            }

            if (!request.ClientId.HasValue || request.ClientId.Value == 0)
            {
                throw new InvalidOperationException("ClientId is required");
            }

            var client = await _context.Clients.FirstOrDefaultAsync(c => c.Id == request.ClientId.Value && c.TenantId == tenantId);
            if (client == null)
            {
                throw new InvalidOperationException("Client not found");
            }

            var quantity = request.Quantity > 0 ? request.Quantity : 1;
            var pricing = await _pricingService.PriceAsync(tenantId, new List<PricingLineInput>
            {
                new PricingLineInput
                {
                    ProductId = request.ProductId.Value,
                    Quantity = quantity
                }
            }, true);

            var line = pricing.Lines.First();

            if (!Enum.IsDefined(typeof(PaymentMethod), request.PaymentMethod ?? PaymentMethod.Cash))
            {
                throw new InvalidOperationException("Invalid payment method. Must be one of: Cash, UPI, Cheque");
            }

            var shippingAddress = await ResolveShippingAddressAsync(tenantId, client, request);

            var order = new Order
            {
                OrderDate = request.OrderDate ?? DateTime.UtcNow,
                ClientId = client.Id,
                ProductId = line.ProductId,
                Quantity = line.Quantity,
                PaymentMethod = request.PaymentMethod ?? PaymentMethod.Cash,
                Notes = request.Notes,
                OrderNumber = await GenerateOrderNumberAsync(),
                TenantId = client.TenantId,
                CreatedAt = DateTime.UtcNow,
                Status = OrderStatus.Pending,
                UnitPrice = line.UnitPrice,
                TotalAmount = pricing.Total,
                ShippingName = shippingAddress.Name,
                ShippingPhone = shippingAddress.Phone,
                ShippingAddressLine1 = shippingAddress.AddressLine1,
                ShippingAddressLine2 = shippingAddress.AddressLine2,
                ShippingCity = shippingAddress.City,
                ShippingState = shippingAddress.State,
                ShippingPostalCode = shippingAddress.PostalCode,
                ShippingCountry = shippingAddress.Country,
                Items = new List<OrderItem>
                {
                    new OrderItem
                    {
                        ProductId = line.ProductId,
                        Quantity = line.Quantity,
                        UnitPrice = line.UnitPrice,
                        DiscountAmount = line.DiscountAmount,
                        TenantId = client.TenantId
                    }
                }
            };

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                _context.Orders.Add(order);
                await _context.SaveChangesAsync();

                await _inventoryService.AdjustStock(
                    order.TenantId,
                    order.ProductId,
                    -order.Quantity,
                    "OrderPlaced",
                    "Order placed",
                    null,
                    "Order",
                    order.Id.ToString());

                var invoice = new Invoice
                {
                    OrderId = order.Id,
                    InvoiceNumber = await GenerateInvoiceNumberAsync(),
                    Amount = order.TotalAmount,
                    PaymentMethod = order.PaymentMethod,
                    Status = InvoiceStatus.Unpaid,
                    CreatedAt = DateTime.UtcNow,
                    CreatedUtc = DateTime.UtcNow,
                    TenantId = order.TenantId
                };
                _context.Invoices.Add(invoice);
                await _context.SaveChangesAsync();

                await transaction.CommitAsync();

                return new OrderCreateResult
                {
                    Id = order.Id,
                    OrderNumber = order.OrderNumber,
                    ClientId = order.ClientId,
                    ClientName = client.Name,
                    ProductId = order.ProductId,
                    ProductName = line.ProductName,
                    Quantity = order.Quantity,
                    UnitPrice = order.UnitPrice,
                    TotalAmount = order.TotalAmount,
                    Status = order.Status,
                    Notes = order.Notes,
                    PaymentMethod = order.PaymentMethod,
                    InvoiceId = invoice.Id,
                    InvoiceNumber = invoice.InvoiceNumber,
                    InvoiceStatus = invoice.Status,
                    CreatedAt = order.CreatedAt
                };
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        public async Task<bool> UpdateOrderAsync(int tenantId, Order order)
        {
            var existingOrder = await _context.Orders
                .Include(o => o.Product)
                .FirstOrDefaultAsync(o => o.Id == order.Id && o.TenantId == tenantId);

            if (existingOrder == null)
            {
                return false;
            }

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                if (existingOrder.ProductId != order.ProductId || existingOrder.Quantity != order.Quantity)
                {
                    var newProduct = await _context.Products.FirstOrDefaultAsync(p => p.Id == order.ProductId && p.TenantId == existingOrder.TenantId);
                    if (newProduct == null)
                    {
                        throw new InvalidOperationException("Product not found");
                    }

                    await _inventoryService.AdjustStock(
                        existingOrder.TenantId,
                        existingOrder.ProductId,
                        existingOrder.Quantity,
                        "OrderCancelled",
                        "Order updated",
                        null,
                        "Order",
                        existingOrder.Id.ToString());

                    await _inventoryService.AdjustStock(
                        existingOrder.TenantId,
                        order.ProductId,
                        -order.Quantity,
                        "OrderPlaced",
                        "Order updated",
                        null,
                        "Order",
                        existingOrder.Id.ToString());

                    order.UnitPrice = newProduct.Price;
                }

                order.TotalAmount = order.UnitPrice * order.Quantity;
                order.UpdatedAt = DateTime.UtcNow;
                order.TenantId = existingOrder.TenantId;
                _context.Entry(existingOrder).CurrentValues.SetValues(order);

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();
                return true;
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        public async Task<OrderStatusResult?> UpdateOrderStatusAsync(int tenantId, int id, OrderStatus newStatus, string? userId)
        {
            var order = await _context.Orders
                .Include(o => o.Items)
                .FirstOrDefaultAsync(o => o.Id == id && o.TenantId == tenantId);

            if (order == null)
            {
                return null;
            }

            if (order.Status == OrderStatus.Delivered && newStatus != OrderStatus.Delivered)
            {
                throw new InvalidOperationException("Cannot change status of a delivered order");
            }

            if (order.Status == OrderStatus.Cancelled && newStatus != OrderStatus.Cancelled)
            {
                throw new InvalidOperationException("Cannot change status of a cancelled order");
            }

            if (order.Status == OrderStatus.Cancelled && newStatus == OrderStatus.Cancelled)
            {
                return new OrderStatusResult
                {
                    Id = order.Id,
                    OrderNumber = order.OrderNumber,
                    Status = order.Status,
                    UpdatedAt = order.UpdatedAt
                };
            }

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                if (newStatus == OrderStatus.Cancelled)
                {
                    foreach (var line in GetOrderLines(order))
                    {
                        await _inventoryService.AdjustStock(
                            tenantId,
                            line.ProductId,
                            line.Quantity,
                            "OrderCancelled",
                            "Order cancelled",
                            userId,
                            "Order",
                            order.Id.ToString());
                    }
                }

                order.Status = newStatus;
                order.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return new OrderStatusResult
                {
                    Id = order.Id,
                    OrderNumber = order.OrderNumber,
                    Status = order.Status,
                    UpdatedAt = order.UpdatedAt
                };
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        public async Task<bool> DeleteOrderAsync(int tenantId, int id, string? userId)
        {
            var order = await _context.Orders
                .Include(o => o.Items)
                .FirstOrDefaultAsync(o => o.Id == id && o.TenantId == tenantId);

            if (order == null)
            {
                return false;
            }

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                if (order.Status != OrderStatus.Cancelled)
                {
                    foreach (var line in GetOrderLines(order))
                    {
                        await _inventoryService.AdjustStock(
                            tenantId,
                            line.ProductId,
                            line.Quantity,
                            "OrderCancelled",
                            "Order deleted",
                            userId,
                            "Order",
                            order.Id.ToString());
                    }
                }

                _context.Orders.Remove(order);
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();
                return true;
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        private async Task<OrderCreateResult> CreateMultipleOrdersAsync(int tenantId, MultiOrderRequest request, List<OrderLineRequest> lines)
        {
            Client? client = null;
            if (request.ClientId.HasValue && request.ClientId.Value > 0)
            {
                client = await _context.Clients.FirstOrDefaultAsync(c => c.Id == request.ClientId.Value && c.TenantId == tenantId);
            }
            else if (!string.IsNullOrWhiteSpace(request.Email))
            {
                client = await _context.Clients.FirstOrDefaultAsync(c => c.Email == request.Email && c.TenantId == tenantId);
            }

            if (client == null)
            {
                if (string.IsNullOrWhiteSpace(request.CustomerName))
                {
                    throw new InvalidOperationException("Client not found and no customer name provided");
                }

                client = new Client
                {
                    Name = request.CustomerName,
                    Email = request.Email,
                    PhoneNumber = request.Phone,
                    CreatedAt = DateTime.UtcNow,
                    TenantId = tenantId
                };
                _context.Clients.Add(client);
                await _context.SaveChangesAsync();
            }

            var paymentMethod = request.PaymentMethod ?? PaymentMethod.Cash;
            var now = DateTime.UtcNow;

            var pricingInputs = lines.Select(l => new PricingLineInput
            {
                ProductId = l.ProductId,
                Quantity = l.Quantity,
                UnitPrice = l.UnitPrice,
                DiscountAmount = l.DiscountAmount
            }).ToList();

            var pricing = await _pricingService.PriceAsync(tenantId, pricingInputs, true);

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var orderItems = pricing.Lines.Select(line => new OrderItem
                {
                    ProductId = line.ProductId,
                    Quantity = line.Quantity,
                    UnitPrice = line.UnitPrice,
                    DiscountAmount = line.DiscountAmount,
                    TenantId = client.TenantId
                }).ToList();

                var firstLine = pricing.Lines.First();

                var shippingAddress = await ResolveShippingAddressAsync(tenantId, client, request);

                var order = new Order
                {
                    OrderNumber = await GenerateOrderNumberAsync(),
                    OrderDate = request.OrderDate ?? now,
                    ClientId = client.Id,
                    Client = client,
                    ProductId = firstLine.ProductId,
                    Quantity = firstLine.Quantity,
                    UnitPrice = firstLine.UnitPrice,
                    TotalAmount = pricing.Total,
                    Status = OrderStatus.Pending,
                    PaymentMethod = paymentMethod,
                    InvoiceStatus = InvoiceStatus.Unpaid,
                    AmountPaid = 0,
                    Notes = request.Notes,
                    CreatedAt = now,
                    ShippingName = shippingAddress.Name,
                    ShippingPhone = shippingAddress.Phone,
                    ShippingAddressLine1 = shippingAddress.AddressLine1,
                    ShippingAddressLine2 = shippingAddress.AddressLine2,
                    ShippingCity = shippingAddress.City,
                    ShippingState = shippingAddress.State,
                    ShippingPostalCode = shippingAddress.PostalCode,
                    ShippingCountry = shippingAddress.Country,
                    Items = orderItems,
                    TenantId = client.TenantId
                };

                _context.Orders.Add(order);
                await _context.SaveChangesAsync();

                foreach (var line in pricing.Lines)
                {
                    await _inventoryService.AdjustStock(
                        order.TenantId,
                        line.ProductId,
                        -line.Quantity,
                        "OrderPlaced",
                        "Order placed",
                        null,
                        "Order",
                        order.Id.ToString());
                }

                var invoice = new Invoice
                {
                    OrderId = order.Id,
                    InvoiceNumber = await GenerateInvoiceNumberAsync(),
                    Amount = order.TotalAmount,
                    PaymentMethod = order.PaymentMethod,
                    Status = InvoiceStatus.Unpaid,
                    CreatedAt = DateTime.UtcNow,
                    CreatedUtc = DateTime.UtcNow,
                    TenantId = order.TenantId
                };
                _context.Invoices.Add(invoice);
                await _context.SaveChangesAsync();

                await transaction.CommitAsync();

                return new OrderCreateResult
                {
                    Id = order.Id,
                    OrderNumber = order.OrderNumber,
                    ClientId = order.ClientId,
                    ClientName = client.Name,
                    TotalAmount = order.TotalAmount,
                    Status = order.Status,
                    PaymentMethod = order.PaymentMethod,
                    AmountPaid = order.AmountPaid,
                    InvoiceId = invoice.Id,
                    InvoiceNumber = invoice.InvoiceNumber,
                    InvoiceStatus = invoice.Status,
                    CreatedAt = order.CreatedAt,
                    Items = pricing.Lines.Select(line => new OrderCreateItemResult
                    {
                        ProductId = line.ProductId,
                        ProductName = line.ProductName,
                        Quantity = line.Quantity,
                        UnitPrice = line.UnitPrice,
                        DiscountAmount = line.DiscountAmount,
                        LineTotal = line.LineNet
                    }).ToList()
                };
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        private async Task<string> GenerateOrderNumberAsync()
        {
            var lastOrder = await _context.Orders
                .OrderByDescending(o => o.OrderNumber)
                .FirstOrDefaultAsync();

            var nextNumber = 1;
            if (lastOrder != null && lastOrder.OrderNumber.StartsWith("O"))
            {
                if (int.TryParse(lastOrder.OrderNumber.Substring(1), out var lastNumber))
                {
                    nextNumber = lastNumber + 1;
                }
            }

            return $"O{nextNumber:D4}";
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

        private static List<(int ProductId, int Quantity)> GetOrderLines(Order order)
        {
            var lines = new List<(int ProductId, int Quantity)>();
            if (order.Items != null && order.Items.Count > 0)
            {
                foreach (var item in order.Items)
                {
                    if (item.Quantity > 0)
                    {
                        lines.Add((item.ProductId, item.Quantity));
                    }
                }
            }
            else if (order.Quantity > 0)
            {
                lines.Add((order.ProductId, order.Quantity));
            }

            return lines;
        }
    }
}








