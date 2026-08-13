using Microsoft.EntityFrameworkCore;
using SmartSofto.Commerce.Application.DTOs;
using SmartSofto.Commerce.Application.Exceptions;
using SmartSofto.Commerce.Application.Interfaces;
using SmartSofto.Commerce.Domain.Models;

namespace SmartSofto.Commerce.Infrastructure.Services
{
    public class OrderService : IOrderService
    {
        private readonly ApplicationDbContext _context;
        private readonly IInventoryService _inventoryService;
        private readonly IOrderPricingService _pricingService;
        private readonly IClientAccountService _clientAccountService;

        public OrderService(ApplicationDbContext context, IInventoryService inventoryService, IOrderPricingService pricingService, IClientAccountService clientAccountService)
        {
            _context = context;
            _inventoryService = inventoryService;
            _pricingService = pricingService;
            _clientAccountService = clientAccountService;
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
                    AppliedCreditAmount = o.AppliedCreditAmount,
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
                        Sku = i.Product != null ? i.Product.SKU : null,
                        Quantity = i.Quantity,
                        UnitPrice = i.UnitPrice,
                        DiscountAmount = i.DiscountAmount ?? 0m,
                        LineTotal = Math.Max((i.UnitPrice * i.Quantity) - (i.DiscountAmount ?? 0m), 0m)
                    }).ToList()
                })
                .ToListAsync();
        }

        public async Task<OrderViewModel?> GetOrderAsync(int tenantId, int id, string? userId, bool isAdmin)
        {
            var query = _context.Orders
                .AsNoTracking()
                .Include(o => o.Client)
                .Include(o => o.Product)
                .Include(o => o.Items)
                    .ThenInclude(i => i.Product)
                .Where(o => o.TenantId == tenantId);

            if (!isAdmin)
            {
                if (string.IsNullOrWhiteSpace(userId))
                {
                    return null;
                }

                var client = await _context.Clients.AsNoTracking().FirstOrDefaultAsync(c => c.UserId == userId && c.TenantId == tenantId);
                if (client == null)
                {
                    return null;
                }

                query = query.Where(o => o.ClientId == client.Id);
            }

            var order = await query.FirstOrDefaultAsync(o => o.Id == id);
            if (order == null)
            {
                return null;
            }

            var invoices = await _context.Invoices
                .AsNoTracking()
                .Where(i => i.TenantId == tenantId && i.OrderId == order.Id)
                .OrderBy(i => i.CreatedUtc)
                .ThenBy(i => i.Id)
                .ToListAsync();

            var adjustments = await _context.OrderAdjustments
                .AsNoTracking()
                .Where(a => a.TenantId == tenantId && a.OrderId == order.Id)
                .OrderByDescending(a => a.CreatedUtc)
                .ToListAsync();

            var primaryInvoice = invoices.FirstOrDefault();
            var paymentRows = primaryInvoice == null
                ? invoices.Where(i => i.Status == InvoiceStatus.Paid).ToList()
                : invoices.Where(i => i.Id != primaryInvoice.Id && i.Status == InvoiceStatus.Paid).ToList();

            var paymentHistory = paymentRows
                .Select(i => new OrderPaymentViewModel
                {
                    InvoiceId = i.Id,
                    InvoiceNumber = i.InvoiceNumber,
                    Amount = i.Amount,
                    PaymentMethod = i.PaymentMethod,
                    Status = i.Status,
                    ReferenceNumber = i.ReferenceNumber,
                    Note = i.Notes,
                    InvoiceDate = i.InvoiceDate,
                    CreatedAt = i.CreatedUtc == default ? i.CreatedAt : i.CreatedUtc
                })
                .ToList();

            var recordedPaymentTotal = paymentRows.Sum(i => i.Amount);
            if (order.AmountPaid > recordedPaymentTotal)
            {
                paymentHistory.Add(new OrderPaymentViewModel
                {
                    InvoiceId = primaryInvoice?.Id ?? 0,
                    InvoiceNumber = primaryInvoice?.InvoiceNumber ?? string.Empty,
                    Amount = order.AmountPaid - recordedPaymentTotal,
                    PaymentMethod = order.PaymentMethod,
                    Status = InvoiceStatus.Paid,
                    Note = paymentRows.Count == 0
                        ? "Captured at order creation."
                        : "Captured at order creation or migrated from legacy payment data.",
                    InvoiceDate = order.OrderDate,
                    CreatedAt = order.CreatedAt
                });
            }

            paymentHistory = paymentHistory
                .OrderByDescending(p => p.CreatedAt)
                .ThenByDescending(p => p.InvoiceId)
                .ToList();

            var adjustmentTotal = adjustments.Sum(a => a.Amount);
            var adjustedTotal = Math.Max(order.TotalAmount - adjustmentTotal, 0m);
            var settledAmount = order.AmountPaid + order.AppliedCreditAmount;
            var balanceDue = Math.Max(adjustedTotal - settledAmount, 0m);

            return new OrderViewModel
            {
                Id = order.Id,
                OrderNumber = order.OrderNumber,
                OrderDate = order.OrderDate,
                ClientId = order.ClientId,
                ClientName = order.Client?.Name,
                ClientEmail = order.Client?.Email,
                ClientPhone = order.Client?.PhoneNumber,
                ProductId = order.ProductId,
                ProductName = order.Product?.Name,
                Quantity = order.Quantity,
                UnitPrice = order.UnitPrice,
                TotalAmount = order.TotalAmount,
                AdjustmentTotal = adjustmentTotal,
                AdjustedTotalAmount = adjustedTotal,
                SettledAmount = settledAmount,
                BalanceDue = balanceDue,
                Status = order.Status,
                PaymentMethod = order.PaymentMethod,
                InvoiceStatus = order.InvoiceStatus,
                AmountPaid = order.AmountPaid,
                AppliedCreditAmount = order.AppliedCreditAmount,
                Notes = order.Notes,
                InvoiceId = primaryInvoice?.Id,
                InvoiceNumber = primaryInvoice?.InvoiceNumber,
                InvoiceDate = primaryInvoice?.InvoiceDate,
                ShippingAddress = MapAddress(order),
                BillingAddress = MapAddress(order),
                CreatedAt = order.CreatedAt,
                UpdatedAt = order.UpdatedAt,
                Items = order.Items
                    .OrderBy(i => i.Id)
                    .Select(i => new OrderItemViewModel
                    {
                        Id = i.Id,
                        ProductId = i.ProductId,
                        ProductName = i.Product?.Name,
                        Sku = i.Product?.SKU,
                        Quantity = i.Quantity,
                        UnitPrice = i.UnitPrice,
                        DiscountAmount = i.DiscountAmount ?? 0m,
                        LineTotal = Math.Max((i.UnitPrice * i.Quantity) - (i.DiscountAmount ?? 0m), 0m)
                    })
                    .ToList(),
                Payments = paymentHistory,
                Adjustments = adjustments.Select(a => new OrderAdjustmentViewModel
                {
                    Id = a.Id,
                    InvoiceId = a.InvoiceId,
                    InvoiceNumber = invoices.FirstOrDefault(i => i.Id == a.InvoiceId)?.InvoiceNumber,
                    Type = a.Type.ToString(),
                    Amount = a.Amount,
                    Reason = a.Reason,
                    Note = a.Note,
                    CreatedUtc = a.CreatedUtc
                }).ToList()
            };
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


        private static AddressSnapshotDto? MapAddress(Order order)
        {
            if (string.IsNullOrWhiteSpace(order.ShippingAddressLine1))
            {
                return null;
            }

            return new AddressSnapshotDto
            {
                Name = order.ShippingName,
                Phone = order.ShippingPhone,
                Line1 = order.ShippingAddressLine1,
                Line2 = order.ShippingAddressLine2,
                City = order.ShippingCity,
                State = order.ShippingState,
                PostalCode = order.ShippingPostalCode,
                Country = order.ShippingCountry
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

        public async Task<OrderCreateResult> CreateOrderAsync(int tenantId, MultiOrderRequest request, bool allowBackdating)
        {
            var lines = request.Items ?? request.Lines;
            if (lines != null && lines.Any())
            {
                return await CreateMultipleOrdersAsync(tenantId, request, lines, allowBackdating);
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

            var quantity = request.Quantity > 0 ? request.Quantity : 1m;
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

            ValidateCreditRequest(request);
            await ValidateAvailableCreditAsync(tenantId, client.Id, request.ApplyCreditAmount, pricing.Total);

            var shippingAddress = await ResolveShippingAddressAsync(tenantId, client, request);
            var sellerProfile = await ResolveSellerProfileAsync(tenantId);
            var businessOrderDate = ResolveBusinessOrderDate(request.OrderDate, request.Notes, allowBackdating);
            var orderStatus = ResolveRequestedOrderStatus(request.InitialOrderStatus, allowBackdating);
            var orderItem = CreateOrderItemSnapshot(line, sellerProfile.State, shippingAddress.State, client.TenantId);

            var order = new Order
            {
                OrderDate = businessOrderDate,
                ClientId = client.Id,
                ProductId = line.ProductId,
                Quantity = line.Quantity,
                PaymentMethod = request.PaymentMethod ?? PaymentMethod.Cash,
                Notes = request.Notes,
                OrderNumber = await GenerateOrderNumberAsync(),
                TenantId = client.TenantId,
                CreatedAt = DateTime.UtcNow,
                Status = orderStatus,
                InvoiceStatus = InvoiceStatus.Unpaid,
                AppliedCreditAmount = 0,
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
                    orderItem
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
                    order.Id.ToString(),
                    false,
                    businessOrderDate,
                    allowBackdating);

                var invoice = new Invoice
                {
                    OrderId = order.Id,
                    InvoiceNumber = await GenerateInvoiceNumberAsync(),
                    Amount = order.TotalAmount,
                    PaymentMethod = order.PaymentMethod,
                    Status = InvoiceStatus.Unpaid,
                    InvoiceDate = businessOrderDate,
                    CreatedAt = DateTime.UtcNow,
                    CreatedUtc = DateTime.UtcNow,
                    BuyerBusinessName = SnapshotBuyerBusinessName(client),
                    BuyerGstin = SnapshotBuyerGstin(client),
                    SellerProfileId = sellerProfile.Id,
                    TenantId = order.TenantId
                };
                _context.Invoices.Add(invoice);
                await _context.SaveChangesAsync();

                await ApplyInitialPaymentAsync(order, request, allowBackdating);
                await ApplyInitialCreditAsync(order, request);

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
                    InvoiceStatus = order.InvoiceStatus,
                    CreatedAt = order.CreatedAt,
                    AmountPaid = order.AmountPaid,
                    AppliedCreditAmount = order.AppliedCreditAmount
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

                    if (order.AppliedCreditAmount > 0)
                    {
                        await _clientAccountService.RestoreCreditAsync(
                            tenantId,
                            order.ClientId,
                            order.AppliedCreditAmount,
                            "Order",
                            order.Id.ToString(),
                            order.OrderNumber,
                            "Client credit restored after order cancellation.",
                            GetBusinessToday());
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

            throw new BusinessConflictException(
                "This order cannot be deleted because it affects inventory and invoicing. Please cancel it instead.");
        }

        private async Task<OrderCreateResult> CreateMultipleOrdersAsync(int tenantId, MultiOrderRequest request, List<OrderLineRequest> lines, bool allowBackdating)
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
            var businessOrderDate = ResolveBusinessOrderDate(request.OrderDate, request.Notes, allowBackdating);
            ValidateCreditRequest(request);
            var orderStatus = ResolveRequestedOrderStatus(request.InitialOrderStatus, allowBackdating);

            var pricingInputs = lines.Select(l => new PricingLineInput
            {
                ProductId = l.ProductId,
                Quantity = l.Quantity,
                UnitPrice = l.UnitPrice,
                DiscountAmount = l.DiscountAmount
            }).ToList();

            var pricing = await _pricingService.PriceAsync(tenantId, pricingInputs, true);
            await ValidateAvailableCreditAsync(tenantId, client.Id, request.ApplyCreditAmount, pricing.Total);

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var firstLine = pricing.Lines.First();

                var shippingAddress = await ResolveShippingAddressAsync(tenantId, client, request);
                var sellerProfile = await ResolveSellerProfileAsync(tenantId);
                var orderItems = pricing.Lines
                    .Select(line => CreateOrderItemSnapshot(line, sellerProfile.State, shippingAddress.State, client.TenantId))
                    .ToList();

                var order = new Order
                {
                    OrderNumber = await GenerateOrderNumberAsync(),
                    OrderDate = businessOrderDate,
                    ClientId = client.Id,
                    Client = client,
                    ProductId = firstLine.ProductId,
                    Quantity = firstLine.Quantity,
                    UnitPrice = firstLine.UnitPrice,
                    TotalAmount = pricing.Total,
                    Status = orderStatus,
                    PaymentMethod = paymentMethod,
                    InvoiceStatus = InvoiceStatus.Unpaid,
                    AmountPaid = 0,
                    AppliedCreditAmount = 0,
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
                        order.Id.ToString(),
                        false,
                        businessOrderDate,
                        allowBackdating);
                }

                var invoice = new Invoice
                {
                    OrderId = order.Id,
                    InvoiceNumber = await GenerateInvoiceNumberAsync(),
                    Amount = order.TotalAmount,
                    PaymentMethod = order.PaymentMethod,
                    Status = InvoiceStatus.Unpaid,
                    InvoiceDate = businessOrderDate,
                    CreatedAt = DateTime.UtcNow,
                    CreatedUtc = DateTime.UtcNow,
                    BuyerBusinessName = SnapshotBuyerBusinessName(client),
                    BuyerGstin = SnapshotBuyerGstin(client),
                    SellerProfileId = sellerProfile.Id,
                    TenantId = order.TenantId
                };
                _context.Invoices.Add(invoice);
                await _context.SaveChangesAsync();

                await ApplyInitialPaymentAsync(order, request, allowBackdating);
                await ApplyInitialCreditAsync(order, request);

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
                    AppliedCreditAmount = order.AppliedCreditAmount,
                    InvoiceId = invoice.Id,
                    InvoiceNumber = invoice.InvoiceNumber,
                    InvoiceStatus = order.InvoiceStatus,
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

        private static OrderStatus ResolveRequestedOrderStatus(OrderStatus? requestedOrderStatus, bool isAdmin)
        {
            if (!isAdmin || requestedOrderStatus == null)
            {
                return OrderStatus.Pending;
            }

            if (!Enum.IsDefined(typeof(OrderStatus), requestedOrderStatus.Value))
            {
                throw new InvalidOperationException("Invalid order status.");
            }

            if (requestedOrderStatus.Value == OrderStatus.Cancelled)
            {
                throw new InvalidOperationException("Cancelled status is not allowed when creating a new order.");
            }

            return requestedOrderStatus.Value;
        }

        private async Task<SellerProfile> ResolveSellerProfileAsync(int tenantId)
        {
            var sellerProfile = await _context.SellerProfiles
                .AsNoTracking()
                .Where(profile => profile.TenantId == tenantId)
                .OrderBy(profile => profile.Id)
                .FirstOrDefaultAsync();

            if (sellerProfile == null || string.IsNullOrWhiteSpace(sellerProfile.State) || string.IsNullOrWhiteSpace(sellerProfile.GstStateCode))
            {
                throw new InvalidOperationException("Seller GST state configuration is required before creating an order.");
            }

            return sellerProfile;
        }

        internal static OrderItem CreateOrderItemSnapshot(PricingLineResult line, string sellerState, string shippingState, int tenantId)
        {
            if (string.IsNullOrWhiteSpace(sellerState) || string.IsNullOrWhiteSpace(shippingState))
            {
                throw new InvalidOperationException("Seller state and shipping state are required for GST jurisdiction.");
            }

            var lineTotal = RoundMoney(line.LineNet);
            var gstRate = line.GstRate;
            var taxableAmount = lineTotal;
            var cgstAmount = 0m;
            var sgstAmount = 0m;
            var igstAmount = 0m;

            if (gstRate > 0)
            {
                taxableAmount = RoundMoney(lineTotal / (1m + (gstRate / 100m)));
                var totalGst = lineTotal - taxableAmount;
                var isIntraState = string.Equals(NormalizeState(sellerState), NormalizeState(shippingState), StringComparison.Ordinal);

                if (isIntraState)
                {
                    cgstAmount = RoundMoney(totalGst / 2m);
                    sgstAmount = totalGst - cgstAmount;
                }
                else
                {
                    igstAmount = totalGst;
                }
            }

            return new OrderItem
            {
                ProductId = line.ProductId,
                Quantity = line.Quantity,
                UnitPrice = line.UnitPrice,
                DiscountAmount = line.DiscountAmount,
                HsnCode = string.IsNullOrWhiteSpace(line.HsnCode) ? null : line.HsnCode.Trim(),
                GstRate = gstRate,
                TaxableAmount = taxableAmount,
                CgstAmount = cgstAmount,
                SgstAmount = sgstAmount,
                IgstAmount = igstAmount,
                LineTotal = lineTotal,
                TenantId = tenantId
            };
        }

        private static string NormalizeState(string state)
        {
            return string.Join(' ', state.Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)).ToUpperInvariant();
        }

        private static decimal RoundMoney(decimal value)
        {
            return Math.Round(value, 2, MidpointRounding.AwayFromZero);
        }

        private async Task ApplyInitialPaymentAsync(Order order, MultiOrderRequest request, bool isAdmin)
        {
            var paymentAmount = request.PaymentAmount ?? 0m;
            if (paymentAmount <= 0)
            {
                order.AmountPaid = 0;
                order.InvoiceStatus = ResolveInvoiceStatus(order.TotalAmount, order.AmountPaid, order.AppliedCreditAmount);
                return;
            }

            if (!request.PaymentMethod.HasValue || !Enum.IsDefined(typeof(PaymentMethod), request.PaymentMethod.Value))
            {
                throw new InvalidOperationException("Payment method is required when recording an initial payment.");
            }

            var requestedCredit = request.ApplyCreditAmount ?? 0m;
            if (paymentAmount + requestedCredit > order.TotalAmount)
            {
                throw new InvalidOperationException($"Combined payment and applied credit cannot exceed order total of {order.TotalAmount}.");
            }

            var paymentDate = ResolvePaymentDate(request.PaymentDate, order.OrderDate, request.Notes, isAdmin);
            var payment = new Invoice
            {
                OrderId = order.Id,
                InvoiceNumber = await GenerateInvoiceNumberAsync(),
                Amount = paymentAmount,
                PaymentMethod = request.PaymentMethod.Value,
                Status = InvoiceStatus.Paid,
                InvoiceDate = paymentDate,
                Notes = request.Notes,
                CreatedAt = DateTime.UtcNow,
                CreatedUtc = DateTime.UtcNow,
                BuyerBusinessName = SnapshotBuyerBusinessName(order.Client ?? await _context.Clients.FirstOrDefaultAsync(c => c.Id == order.ClientId && c.TenantId == order.TenantId)),
                BuyerGstin = SnapshotBuyerGstin(order.Client ?? await _context.Clients.FirstOrDefaultAsync(c => c.Id == order.ClientId && c.TenantId == order.TenantId)),
                TenantId = order.TenantId
            };

            _context.Invoices.Add(payment);
            order.AmountPaid = paymentAmount;
            order.InvoiceStatus = ResolveInvoiceStatus(order.TotalAmount, order.AmountPaid, order.AppliedCreditAmount);
            order.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }

        private static string? SnapshotBuyerBusinessName(Client? client)
        {
            return string.IsNullOrWhiteSpace(client?.CompanyName) ? null : client.CompanyName.Trim();
        }

        private static string? SnapshotBuyerGstin(Client? client)
        {
            return string.IsNullOrWhiteSpace(client?.Gstin) ? null : client.Gstin.Trim();
        }

        private async Task ApplyInitialCreditAsync(Order order, MultiOrderRequest request)
        {
            var creditAmount = request.ApplyCreditAmount ?? 0m;
            if (creditAmount <= 0)
            {
                order.AppliedCreditAmount = 0;
                order.InvoiceStatus = ResolveInvoiceStatus(order.TotalAmount, order.AmountPaid, order.AppliedCreditAmount);
                return;
            }

            await _clientAccountService.ApplyCreditAsync(
                order.TenantId,
                order.ClientId,
                creditAmount,
                "Order",
                order.Id.ToString(),
                request.Notes,
                order.OrderDate);

            order.AppliedCreditAmount = creditAmount;
            order.InvoiceStatus = ResolveInvoiceStatus(order.TotalAmount, order.AmountPaid, order.AppliedCreditAmount);
            order.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }

        private async Task ValidateAvailableCreditAsync(int tenantId, int clientId, decimal? requestedCredit, decimal orderTotal)
        {
            var creditAmount = requestedCredit ?? 0m;
            if (creditAmount < 0)
            {
                throw new InvalidOperationException("Applied credit cannot be negative.");
            }

            if (creditAmount == 0)
            {
                return;
            }

            if (creditAmount > orderTotal)
            {
                throw new InvalidOperationException($"Applied credit cannot exceed order total of {orderTotal}.");
            }

            var availableCredit = await _clientAccountService.GetAvailableCreditAsync(tenantId, clientId);
            if (creditAmount > availableCredit)
            {
                throw new InvalidOperationException($"Applied credit cannot exceed available client credit of {availableCredit:0.00}.");
            }
        }

        private static void ValidateCreditRequest(MultiOrderRequest request)
        {
            if ((request.ApplyCreditAmount ?? 0m) < 0)
            {
                throw new InvalidOperationException("Applied credit cannot be negative.");
            }
        }

        private static InvoiceStatus ResolveInvoiceStatus(decimal totalAmount, decimal amountPaid, decimal appliedCreditAmount)
        {
            var settledAmount = amountPaid + appliedCreditAmount;
            if (settledAmount <= 0)
            {
                return InvoiceStatus.Unpaid;
            }

            return settledAmount >= totalAmount ? InvoiceStatus.Paid : InvoiceStatus.PartiallyPaid;
        }

        private static DateTime ResolvePaymentDate(DateTime? requestedPaymentDate, DateTime orderDate, string? notes, bool isAdmin)
        {
            var today = GetBusinessToday();
            var paymentDate = requestedPaymentDate?.Date ?? orderDate.Date;

            if (paymentDate > today)
            {
                throw new InvalidOperationException("Future-dated payments are not allowed.");
            }

            var daysBack = (today - paymentDate).Days;
            if (daysBack > 7)
            {
                throw new InvalidOperationException("Backdated payments older than 7 days are not allowed.");
            }

            if (paymentDate < orderDate.Date)
            {
                throw new InvalidOperationException("Payment date cannot be earlier than the order date.");
            }

            if (daysBack > 0)
            {
                if (!isAdmin)
                {
                    throw new InvalidOperationException("Backdated payments are only allowed for admin users.");
                }

                if (string.IsNullOrWhiteSpace(notes))
                {
                    throw new InvalidOperationException("Backdated payments require a note.");
                }
            }

            return paymentDate;
        }

        private static DateTime ResolveBusinessOrderDate(DateTime? requestedOrderDate, string? notes, bool allowBackdating)
        {
            var today = GetBusinessToday();
            var orderDate = requestedOrderDate?.Date ?? today;

            if (orderDate > today)
            {
                throw new InvalidOperationException("Future-dated orders are not allowed.");
            }

            var daysBack = (today - orderDate).Days;
            if (daysBack > 7)
            {
                throw new InvalidOperationException("Backdated orders older than 7 days are not allowed.");
            }

            if (daysBack > 0)
            {
                if (!allowBackdating)
                {
                    throw new InvalidOperationException("Backdated orders are only allowed for admin users.");
                }

                if (string.IsNullOrWhiteSpace(notes))
                {
                    throw new InvalidOperationException("Backdated orders require a note.");
                }
            }

            return orderDate;
        }

        private static DateTime GetBusinessToday()
        {
            return TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, TimeZoneInfo.Local).Date;
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

        private static List<(int ProductId, decimal Quantity)> GetOrderLines(Order order)
        {
            var lines = new List<(int ProductId, decimal Quantity)>();
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








