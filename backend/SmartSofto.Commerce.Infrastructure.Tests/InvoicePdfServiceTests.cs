using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using SmartSofto.Commerce.Domain.Models;
using SmartSofto.Commerce.Infrastructure.Identity;
using SmartSofto.Commerce.Infrastructure.Services;

namespace SmartSofto.Commerce.Infrastructure.Tests
{
    public class InvoicePdfServiceTests
    {
        [Fact]
        public async Task SellerProfile_Persists_With_AdminUser_Relationship()
        {
            await using var fixture = await PdfFixture.CreateAsync();
            var admin = CreateAdminUser("admin-1", "admin@example.com");
            var sellerProfile = CreateSellerProfile(1, admin.Id, "Standard Paneer Gurugram");

            fixture.Context.Users.Add(admin);
            fixture.Context.SellerProfiles.Add(sellerProfile);
            await fixture.Context.SaveChangesAsync();

            var saved = await fixture.Context.SellerProfiles.SingleAsync(profile => profile.AdminUserId == admin.Id);

            Assert.Equal("Standard Paneer Gurugram", saved.BusinessName);
            Assert.Equal("06DBRPS5510N1ZZ", saved.Gstin);
            Assert.Equal(admin.Id, saved.AdminUserId);
            Assert.Equal(1, saved.TenantId);
        }

        [Fact]
        public async Task GenerateInvoicePdfAsync_Returns_NonEmpty_Pdf_With_Database_Seller_Data()
        {
            await using var fixture = await PdfFixture.CreateAsync();
            var sellerProfile = await SeedInvoiceAsync(fixture.Context, sellerProfileId: 1, businessName: "Standard Paneer Gurugram");
            var service = new InvoicePdfService(fixture.Context);

            var result = await service.GenerateInvoicePdfAsync(1, 1);

            Assert.NotNull(result);
            Assert.Equal("application/pdf", result.ContentType);
            Assert.Equal("FreshMooz-Invoice-INV0001.pdf", result.FileName);
            Assert.Equal(sellerProfile.Id, result.SellerProfileId);
            Assert.Equal("Standard Paneer Gurugram", result.SellerBusinessName);
            Assert.NotEmpty(result.Content);
            Assert.Equal("%PDF"u8.ToArray(), result.Content.Take(4).ToArray());
        }

        [Fact]
        public async Task GenerateInvoicePdfAsync_Resolves_Invoice_SellerProfile()
        {
            await using var fixture = await PdfFixture.CreateAsync();
            var adminOne = CreateAdminUser("admin-1", "admin1@example.com");
            var adminTwo = CreateAdminUser("admin-2", "admin2@example.com");
            var wrongSeller = CreateSellerProfile(1, adminOne.Id, "Wrong Seller");
            var invoiceSeller = CreateSellerProfile(2, adminTwo.Id, "Standard Paneer Gurugram");

            fixture.Context.Users.AddRange(adminOne, adminTwo);
            fixture.Context.SellerProfiles.AddRange(wrongSeller, invoiceSeller);
            await SeedInvoiceCoreAsync(fixture.Context, invoiceSeller.Id);

            var service = new InvoicePdfService(fixture.Context);

            var result = await service.GenerateInvoicePdfAsync(1, 1);

            Assert.NotNull(result);
            Assert.Equal(invoiceSeller.Id, result.SellerProfileId);
            Assert.Equal("Standard Paneer Gurugram", result.SellerBusinessName);
        }

        [Fact]
        public async Task GenerateInvoicePdfAsync_MissingSellerProfile_Throws_ClearError()
        {
            await using var fixture = await PdfFixture.CreateAsync();
            await SeedInvoiceCoreAsync(fixture.Context, sellerProfileId: null);
            var service = new InvoicePdfService(fixture.Context);

            var ex = await Assert.ThrowsAsync<InvalidOperationException>(() => service.GenerateInvoicePdfAsync(1, 1));

            Assert.Equal("Seller profile is not configured for invoice PDF generation.", ex.Message);
        }

        [Fact]
        public async Task CreateInvoiceAsync_Snapshots_Buyer_Gst_Details()
        {
            await using var fixture = await PdfFixture.CreateAsync();
            await SeedOrderCoreAsync(fixture.Context, companyName: "Buyer Foods Pvt Ltd", gstin: "29ABCDE1234F1Z5");
            var service = new InvoiceService(fixture.Context);

            var invoice = await service.CreateInvoiceAsync(1, new Invoice
            {
                OrderId = 1,
                Amount = 100,
                PaymentMethod = PaymentMethod.UPI
            }, userId: null);

            Assert.Equal("Buyer Foods Pvt Ltd", invoice.BuyerBusinessName);
            Assert.Equal("29ABCDE1234F1Z5", invoice.BuyerGstin);
        }

        [Fact]
        public async Task CreateInvoiceAsync_Preserves_Historical_Buyer_Gst_Snapshot()
        {
            await using var fixture = await PdfFixture.CreateAsync();
            await SeedOrderCoreAsync(fixture.Context, companyName: "Buyer Foods Pvt Ltd", gstin: "29ABCDE1234F1Z5");
            var service = new InvoiceService(fixture.Context);

            var invoice = await service.CreateInvoiceAsync(1, new Invoice
            {
                OrderId = 1,
                Amount = 100,
                PaymentMethod = PaymentMethod.UPI
            }, userId: null);

            var client = await fixture.Context.Clients.SingleAsync(c => c.Id == 1);
            client.CompanyName = "Changed Buyer Ltd";
            client.Gstin = "27ABCDE1234F1Z2";
            await fixture.Context.SaveChangesAsync();

            var savedInvoice = await fixture.Context.Invoices.SingleAsync(i => i.Id == invoice.Id);

            Assert.Equal("Buyer Foods Pvt Ltd", savedInvoice.BuyerBusinessName);
            Assert.Equal("29ABCDE1234F1Z5", savedInvoice.BuyerGstin);
        }

        [Fact]
        public void ResolveBuyerDetails_Uses_Invoice_Snapshot_For_B2B()
        {
            var invoice = new Invoice
            {
                BuyerBusinessName = "Snapshot Buyer Pvt Ltd",
                BuyerGstin = "29ABCDE1234F1Z5"
            };
            var order = new Order
            {
                ShippingName = "Shipping Name",
                Client = new Client
                {
                    Name = "Current Client",
                    CompanyName = "Current Company",
                    Gstin = "27ABCDE1234F1Z2"
                }
            };

            var buyer = InvoicePdfService.ResolveBuyerDetails(invoice, order);

            Assert.Equal("Snapshot Buyer Pvt Ltd", buyer.Name);
            Assert.Equal("29ABCDE1234F1Z5", buyer.Gstin);
        }

        [Fact]
        public void ResolveBuyerDetails_Does_Not_Return_Empty_Gstin_For_B2C()
        {
            var invoice = new Invoice();
            var order = new Order
            {
                ShippingName = "B2C Buyer",
                Client = new Client { Name = "B2C Buyer" }
            };

            var buyer = InvoicePdfService.ResolveBuyerDetails(invoice, order);

            Assert.Equal("B2C Buyer", buyer.Name);
            Assert.Null(buyer.Gstin);
        }

        [Fact]
        public void WrapCommaSeparatedText_Breaks_Long_Seller_Address_Into_Readable_Lines()
        {
            var lines = InvoicePdfService.WrapCommaSeparatedText("HOUSE NO 3, MOHYAL COLONY, DPS Gurgaon Infant Wing, Sector 40, Gurugram, Haryana, 122001");

            Assert.Equal(new[]
            {
                "HOUSE NO 3, MOHYAL COLONY,",
                "DPS Gurgaon Infant Wing,",
                "Sector 40, Gurugram,",
                "Haryana, 122001"
            }, lines);
        }

        [Fact]
        public void ShouldShowUpiQr_Returns_True_For_Outstanding_Unpaid_Invoice()
        {
            var invoice = new Invoice
            {
                Status = InvoiceStatus.Unpaid
            };
            var order = new Order
            {
                TotalAmount = 100,
                AmountPaid = 25,
                AppliedCreditAmount = 0,
                InvoiceStatus = InvoiceStatus.PartiallyPaid
            };

            Assert.True(InvoicePdfService.ShouldShowUpiQr(invoice, order));
        }

        [Fact]
        public void ShouldShowUpiQr_Returns_False_For_Fully_Paid_Invoice()
        {
            var invoice = new Invoice
            {
                Status = InvoiceStatus.Paid
            };
            var order = new Order
            {
                TotalAmount = 100,
                AmountPaid = 100,
                AppliedCreditAmount = 0,
                InvoiceStatus = InvoiceStatus.Paid
            };

            Assert.False(InvoicePdfService.ShouldShowUpiQr(invoice, order));
        }

        private static async Task<SellerProfile> SeedInvoiceAsync(ApplicationDbContext context, int sellerProfileId, string businessName)
        {
            var admin = CreateAdminUser("admin-1", "admin@example.com");
            var sellerProfile = CreateSellerProfile(sellerProfileId, admin.Id, businessName);

            context.Users.Add(admin);
            context.SellerProfiles.Add(sellerProfile);
            await SeedInvoiceCoreAsync(context, sellerProfile.Id);
            return sellerProfile;
        }

        private static async Task SeedInvoiceCoreAsync(ApplicationDbContext context, int? sellerProfileId)
        {
            var client = new Client
            {
                Id = 1,
                Name = "FreshMooz Buyer",
                Email = "buyer@example.com",
                PhoneNumber = "9876543210",
                TaxIdentificationNumber = "29ABCDE1234F1Z5",
                TenantId = 1,
                CreatedAt = DateTime.UtcNow
            };
            var product = new Product
            {
                Id = 1,
                Name = "Cow Ghee",
                SKU = "GHEE-001",
                Quantity = 10,
                Price = 450,
                CostPrice = 300,
                GstRate = 5,
                HsnCode = "0405",
                TenantId = 1,
                CreatedAt = DateTime.UtcNow
            };
            var order = new Order
            {
                Id = 1,
                OrderNumber = "ORD-0001",
                ClientId = client.Id,
                ProductId = product.Id,
                Quantity = 2,
                UnitPrice = 450,
                TotalAmount = 900,
                PaymentMethod = PaymentMethod.UPI,
                InvoiceStatus = InvoiceStatus.Paid,
                OrderDate = DateTime.UtcNow.Date,
                ShippingName = "FreshMooz Buyer",
                ShippingPhone = "9876543210",
                ShippingAddressLine1 = "Test Street",
                ShippingCity = "Bengaluru",
                ShippingState = "Karnataka",
                ShippingPostalCode = "560001",
                ShippingCountry = "India",
                TenantId = 1,
                CreatedAt = DateTime.UtcNow,
                Items = new List<OrderItem>
                {
                    new()
                    {
                        Id = 1,
                        ProductId = product.Id,
                        Quantity = 2,
                        UnitPrice = 450,
                        TenantId = 1
                    }
                }
            };
            var invoice = new Invoice
            {
                Id = 1,
                InvoiceNumber = "INV0001",
                OrderId = order.Id,
                Amount = 900,
                PaymentMethod = PaymentMethod.UPI,
                ReferenceNumber = "PAY-001",
                Status = InvoiceStatus.Paid,
                InvoiceDate = DateTime.UtcNow.Date,
                CreatedAt = DateTime.UtcNow,
                CreatedUtc = DateTime.UtcNow,
                TenantId = 1,
                SellerProfileId = sellerProfileId
            };

            context.Clients.Add(client);
            context.Products.Add(product);
            context.Orders.Add(order);
            context.Invoices.Add(invoice);
            await context.SaveChangesAsync();
        }

        private static async Task SeedOrderCoreAsync(ApplicationDbContext context, string? companyName, string? gstin)
        {
            var client = new Client
            {
                Id = 1,
                Name = "FreshMooz Buyer",
                ReferenceName = "FreshMooz Buyer",
                CompanyName = companyName,
                Gstin = gstin,
                ClientType = "Wholesale",
                TenantId = 1,
                CreatedAt = DateTime.UtcNow,
                IsActive = true
            };
            var product = new Product
            {
                Id = 1,
                Name = "Cow Ghee",
                SKU = "GHEE-001",
                Quantity = 10,
                Price = 450,
                CostPrice = 300,
                TenantId = 1,
                CreatedAt = DateTime.UtcNow
            };
            var order = new Order
            {
                Id = 1,
                OrderNumber = "ORD-0001",
                ClientId = client.Id,
                ProductId = product.Id,
                Quantity = 1,
                UnitPrice = 100,
                TotalAmount = 100,
                PaymentMethod = PaymentMethod.UPI,
                InvoiceStatus = InvoiceStatus.Unpaid,
                OrderDate = DateTime.UtcNow.Date,
                ShippingName = "FreshMooz Buyer",
                TenantId = 1,
                CreatedAt = DateTime.UtcNow
            };

            context.Clients.Add(client);
            context.Products.Add(product);
            context.Orders.Add(order);
            await context.SaveChangesAsync();
        }

        private static ApplicationUser CreateAdminUser(string id, string email)
        {
            return new ApplicationUser
            {
                Id = id,
                UserName = email,
                NormalizedUserName = email.ToUpperInvariant(),
                Email = email,
                NormalizedEmail = email.ToUpperInvariant(),
                EmailConfirmed = true,
                Role = "Admin",
                TenantId = 1,
                IsActive = true,
                SecurityStamp = Guid.NewGuid().ToString("N")
            };
        }

        private static SellerProfile CreateSellerProfile(int id, string adminUserId, string businessName)
        {
            return new SellerProfile
            {
                Id = id,
                TenantId = 1,
                AdminUserId = adminUserId,
                BusinessName = businessName,
                Gstin = "06DBRPS5510N1ZZ",
                Address = "HOUSE NO 3, MOHYAL COLONY, DPS Gurgaon Infant Wing, Sector 40, Gurugram, Haryana, 122001",
                AccountName = "Standard Paneer Gurugram",
                BankName = "IndusInd",
                AccountNumber = "252010000009",
                IfscCode = "INDB0000518",
                AuthorizedSignatory = "Bhupinder Singh Bali",
                CreatedAt = DateTime.UtcNow
            };
        }

        private sealed class PdfFixture : IAsyncDisposable
        {
            private readonly SqliteConnection _connection;

            private PdfFixture(SqliteConnection connection, ApplicationDbContext context)
            {
                _connection = connection;
                Context = context;
            }

            public ApplicationDbContext Context { get; }

            public static async Task<PdfFixture> CreateAsync()
            {
                var connection = new SqliteConnection("DataSource=:memory:");
                await connection.OpenAsync();

                var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                    .UseSqlite(connection)
                    .Options;

                var context = new ApplicationDbContext(options);
                await context.Database.EnsureCreatedAsync();

                return new PdfFixture(connection, context);
            }

            public async ValueTask DisposeAsync()
            {
                await Context.DisposeAsync();
                await _connection.DisposeAsync();
            }
        }
    }
}
