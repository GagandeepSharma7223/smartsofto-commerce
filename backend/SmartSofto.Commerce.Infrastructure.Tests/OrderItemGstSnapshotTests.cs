using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using SmartSofto.Commerce.Application.DTOs;
using SmartSofto.Commerce.Domain.Models;
using SmartSofto.Commerce.Infrastructure.Identity;
using SmartSofto.Commerce.Infrastructure.Services;

namespace SmartSofto.Commerce.Infrastructure.Tests
{
    public class OrderItemGstSnapshotTests
    {
        [Fact]
        public void CreateOrderItemSnapshot_IntraState_UsesGstInclusiveAmounts()
        {
            var snapshot = OrderService.CreateOrderItemSnapshot(CreatePricingLine(5m), " Haryana ", "haryana", 1);

            Assert.Equal("0405", snapshot.HsnCode);
            Assert.Equal(5m, snapshot.GstRate);
            Assert.Equal(300m, snapshot.LineTotal);
            Assert.Equal(285.71m, snapshot.TaxableAmount);
            Assert.Equal(7.15m, snapshot.CgstAmount);
            Assert.Equal(7.14m, snapshot.SgstAmount);
            Assert.Equal(0m, snapshot.IgstAmount);
            Assert.Equal(snapshot.LineTotal, snapshot.TaxableAmount + snapshot.CgstAmount + snapshot.SgstAmount);
        }

        [Fact]
        public void CreateOrderItemSnapshot_InterState_AssignsFullGstToIgst()
        {
            var snapshot = OrderService.CreateOrderItemSnapshot(CreatePricingLine(5m), "Haryana", "Karnataka", 1);

            Assert.Equal(285.71m, snapshot.TaxableAmount);
            Assert.Equal(0m, snapshot.CgstAmount);
            Assert.Equal(0m, snapshot.SgstAmount);
            Assert.Equal(14.29m, snapshot.IgstAmount);
            Assert.Equal(snapshot.LineTotal, snapshot.TaxableAmount + snapshot.IgstAmount);
        }

        [Fact]
        public void CreateOrderItemSnapshot_ZeroRated_HasNoGstAmounts()
        {
            var snapshot = OrderService.CreateOrderItemSnapshot(CreatePricingLine(0m), "Haryana", "Karnataka", 1);

            Assert.Equal(300m, snapshot.TaxableAmount);
            Assert.Equal(0m, snapshot.CgstAmount);
            Assert.Equal(0m, snapshot.SgstAmount);
            Assert.Equal(0m, snapshot.IgstAmount);
        }

        [Fact]
        public async Task PricingAndPdfRows_UsePersistedHsnAndGstSnapshots_WhenProductChanges()
        {
            await using var fixture = await TestFixture.CreateAsync();
            var product = new Product
            {
                Id = 1,
                Name = "Cow Ghee",
                SKU = "GHEE-001",
                Price = 300m,
                CostPrice = 200m,
                Quantity = 10m,
                GstRate = 5m,
                HsnCode = "0405",
                TenantId = 1,
                CreatedAt = DateTime.UtcNow
            };
            fixture.Context.Products.Add(product);
            await fixture.Context.SaveChangesAsync();

            var pricing = await new OrderPricingService(fixture.Context).PriceAsync(
                1,
                new[] { new PricingLineInput { ProductId = product.Id, Quantity = 1m } },
                validateStock: true);
            var snapshot = OrderService.CreateOrderItemSnapshot(pricing.Lines.Single(), "Haryana", "Haryana", 1);

            product.GstRate = 18m;
            product.HsnCode = "9999";
            await fixture.Context.SaveChangesAsync();

            var order = new Order
            {
                ProductId = product.Id,
                Product = product,
                ProductName = product.Name,
                Quantity = 1m,
                UnitPrice = 300m,
                TotalAmount = 300m,
                Items = new List<OrderItem> { snapshot }
            };
            snapshot.Product = product;

            var pdfLine = InvoicePdfService.BuildRows(order).Single();

            Assert.Equal("0405", pdfLine.HsnCode);
            Assert.Equal(5m, pdfLine.GstRate);
            Assert.Equal(285.71m, pdfLine.TaxableAmount);
            Assert.Equal(7.15m, pdfLine.CgstAmount);
            Assert.Equal(7.14m, pdfLine.SgstAmount);
            Assert.Equal(0m, pdfLine.IgstAmount);
            Assert.Equal(300m, pdfLine.Total);
        }

        [Fact]
        public async Task CreateOrderAsync_PersistsAuthoritativeGstSnapshots()
        {
            await using var fixture = await TestFixture.CreateAsync();
            var admin = new ApplicationUser
            {
                Id = "admin-1",
                UserName = "admin@example.com",
                NormalizedUserName = "ADMIN@EXAMPLE.COM",
                Email = "admin@example.com",
                NormalizedEmail = "ADMIN@EXAMPLE.COM",
                SecurityStamp = Guid.NewGuid().ToString("N"),
                Role = "Admin",
                TenantId = 1,
                IsActive = true
            };
            var seller = new SellerProfile
            {
                Id = 1,
                BusinessName = "Standard Paneer Gurugram",
                Gstin = "06DBRPS5510N1ZZ",
                Address = "Gurugram, Haryana",
                State = "Haryana",
                GstStateCode = "06",
                AccountName = "Standard Paneer Gurugram",
                BankName = "Test Bank",
                AccountNumber = "123456",
                IfscCode = "TEST0001",
                AuthorizedSignatory = "Authorized Signatory",
                AdminUserId = admin.Id,
                TenantId = 1
            };
            var client = new Client
            {
                Id = 1,
                Name = "Buyer",
                ReferenceName = "Buyer",
                Email = "buyer@example.com",
                TenantId = 1,
                CreatedAt = DateTime.UtcNow,
                IsActive = true
            };
            var product = new Product
            {
                Id = 1,
                Name = "Cow Ghee",
                SKU = "GHEE-001",
                Price = 300m,
                CostPrice = 200m,
                Quantity = 10m,
                GstRate = 5m,
                HsnCode = "0405",
                TenantId = 1,
                CreatedAt = DateTime.UtcNow
            };
            var address = new ClientAddress
            {
                Id = 1,
                ClientId = client.Id,
                Label = "Shipping",
                Name = client.Name,
                Phone = "9876543210",
                AddressLine1 = "Test Street",
                City = "Gurugram",
                State = "Haryana",
                PostalCode = "122001",
                Country = "India",
                TenantId = 1,
                IsDefault = true
            };
            fixture.Context.Users.Add(admin);
            fixture.Context.SellerProfiles.Add(seller);
            fixture.Context.Clients.Add(client);
            fixture.Context.Products.Add(product);
            fixture.Context.ClientAddresses.Add(address);
            await fixture.Context.SaveChangesAsync();

            var service = new OrderService(
                fixture.Context,
                new InventoryService(fixture.Context),
                new OrderPricingService(fixture.Context),
                new ClientAccountService(fixture.Context));
            var result = await service.CreateOrderAsync(1, new MultiOrderRequest
            {
                ClientId = client.Id,
                ShippingAddressId = address.Id,
                PaymentMethod = PaymentMethod.Cash,
                Items = new List<OrderLineRequest>
                {
                    new() { ProductId = product.Id, Quantity = 1m }
                }
            }, allowBackdating: true);

            var snapshot = await fixture.Context.OrderItems.AsNoTracking().SingleAsync(item => item.OrderId == result.Id);
            var invoice = await fixture.Context.Invoices.AsNoTracking().SingleAsync(item => item.OrderId == result.Id);

            Assert.Equal("0405", snapshot.HsnCode);
            Assert.Equal(5m, snapshot.GstRate);
            Assert.Equal(300m, snapshot.LineTotal);
            Assert.Equal(285.71m, snapshot.TaxableAmount);
            Assert.Equal(7.15m, snapshot.CgstAmount);
            Assert.Equal(7.14m, snapshot.SgstAmount);
            Assert.Equal(0m, snapshot.IgstAmount);
            Assert.Equal(seller.Id, invoice.SellerProfileId);
        }

        private static PricingLineResult CreatePricingLine(decimal gstRate)
        {
            return new PricingLineResult
            {
                ProductId = 1,
                ProductName = "Cow Ghee",
                Quantity = 1m,
                UnitPrice = 300m,
                DiscountAmount = 0m,
                LineGross = 300m,
                LineNet = 300m,
                AvailableQuantity = 10m,
                HsnCode = "0405",
                GstRate = gstRate
            };
        }

        private sealed class TestFixture : IAsyncDisposable
        {
            private readonly SqliteConnection _connection;

            private TestFixture(SqliteConnection connection, ApplicationDbContext context)
            {
                _connection = connection;
                Context = context;
            }

            public ApplicationDbContext Context { get; }

            public static async Task<TestFixture> CreateAsync()
            {
                var connection = new SqliteConnection("DataSource=:memory:");
                await connection.OpenAsync();
                var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                    .UseSqlite(connection)
                    .Options;
                var context = new ApplicationDbContext(options);
                await context.Database.EnsureCreatedAsync();
                return new TestFixture(connection, context);
            }

            public async ValueTask DisposeAsync()
            {
                await Context.DisposeAsync();
                await _connection.DisposeAsync();
            }
        }
    }
}
