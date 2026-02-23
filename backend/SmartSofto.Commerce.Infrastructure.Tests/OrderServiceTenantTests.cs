using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using SmartSofto.Commerce.Domain.Models;
using SmartSofto.Commerce.Infrastructure;
using SmartSofto.Commerce.Infrastructure.Services;
using Xunit;

namespace SmartSofto.Commerce.Infrastructure.Tests
{
    public class OrderServiceTenantTests
    {
        private static (ApplicationDbContext Context, OrderService Service) BuildService()
        {
            var connection = new SqliteConnection("DataSource=:memory:");
            connection.Open();

            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseSqlite(connection)
                .Options;

            var context = new ApplicationDbContext(options);
            context.Database.EnsureCreated();

            var inventoryService = new InventoryService(context);
            return (context, new OrderService(context, inventoryService));
        }

        [Fact]
        public async Task GetOrders_Admin_IsTenantScoped()
        {
            var (context, service) = BuildService();
            await using (context)
            {
                context.Tenants.Add(new Tenant { Id = 1, Code = "T1", Name = "Tenant 1" });
                context.Tenants.Add(new Tenant { Id = 2, Code = "T2", Name = "Tenant 2" });

                var client1 = new Client { Id = 1, Name = "Client 1", Email = "c1@example.com", TenantId = 1, CreatedAt = DateTime.UtcNow };
                var client2 = new Client { Id = 2, Name = "Client 2", Email = "c2@example.com", TenantId = 2, CreatedAt = DateTime.UtcNow };
                var product1 = new Product { Id = 1, Name = "P1", SKU = "SKU1", Quantity = 5, Price = 10, CostPrice = 5, TenantId = 1, CreatedAt = DateTime.UtcNow };
                var product2 = new Product { Id = 2, Name = "P2", SKU = "SKU2", Quantity = 5, Price = 10, CostPrice = 5, TenantId = 2, CreatedAt = DateTime.UtcNow };

                context.Clients.AddRange(client1, client2);
                context.Products.AddRange(product1, product2);
                context.Orders.Add(new Order
                {
                    Id = 1,
                    OrderNumber = "O0001",
                    OrderDate = DateTime.UtcNow,
                    ClientId = 1,
                    ProductId = 1,
                    Quantity = 1,
                    UnitPrice = 10,
                    TotalAmount = 10,
                    Status = OrderStatus.Pending,
                    PaymentMethod = PaymentMethod.Cash,
                    InvoiceStatus = InvoiceStatus.Unpaid,
                    AmountPaid = 0,
                    TenantId = 1,
                    CreatedAt = DateTime.UtcNow
                });
                context.Orders.Add(new Order
                {
                    Id = 2,
                    OrderNumber = "O0002",
                    OrderDate = DateTime.UtcNow,
                    ClientId = 2,
                    ProductId = 2,
                    Quantity = 1,
                    UnitPrice = 10,
                    TotalAmount = 10,
                    Status = OrderStatus.Pending,
                    PaymentMethod = PaymentMethod.Cash,
                    InvoiceStatus = InvoiceStatus.Unpaid,
                    AmountPaid = 0,
                    TenantId = 2,
                    CreatedAt = DateTime.UtcNow
                });
                await context.SaveChangesAsync();

                var orders = await service.GetOrdersAsync(1, null, isAdmin: true);
                Assert.Single(orders);
                Assert.Equal(1, orders[0].Id);
            }
        }
    }
}
