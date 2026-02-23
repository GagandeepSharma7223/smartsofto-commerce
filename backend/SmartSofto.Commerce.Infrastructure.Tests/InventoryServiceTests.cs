using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using SmartSofto.Commerce.Domain.Models;
using SmartSofto.Commerce.Infrastructure;
using SmartSofto.Commerce.Infrastructure.Services;
using Xunit;

namespace SmartSofto.Commerce.Infrastructure.Tests
{
    public class InventoryServiceTests
    {
        private static (ApplicationDbContext Context, InventoryService Service) BuildService()
        {
            var connection = new SqliteConnection("DataSource=:memory:");
            connection.Open();

            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseSqlite(connection)
                .Options;

            var context = new ApplicationDbContext(options);
            context.Database.EnsureCreated();

            return (context, new InventoryService(context));
        }

        [Fact]
        public async Task AdjustStock_CreatesTransaction_AndUpdatesProduct()
        {
            var (context, service) = BuildService();
            await using (context)
            {
                context.Tenants.Add(new Tenant { Id = 1, Code = "T1", Name = "Tenant 1" });
                context.Products.Add(new Product
                {
                    Id = 10,
                    Name = "Paneer",
                    SKU = "SKU001",
                    Quantity = 5,
                    Price = 100,
                    CostPrice = 50,
                    TenantId = 1,
                    CreatedAt = DateTime.UtcNow
                });
                await context.SaveChangesAsync();

                await service.AdjustStock(1, 10, 3, "StockIn", "restock", null);

                var product = await context.Products.FirstAsync(p => p.Id == 10);
                var txn = await context.InventoryTransactions.FirstAsync();

                Assert.Equal(8, product.Quantity);
                Assert.Equal(3, txn.QuantityDelta);
                Assert.Equal("StockIn", txn.Reason);
            }
        }

        [Fact]
        public async Task AdjustStock_PreventsNegative_WhenNotCorrection()
        {
            var (context, service) = BuildService();
            await using (context)
            {
                context.Tenants.Add(new Tenant { Id = 1, Code = "T1", Name = "Tenant 1" });
                context.Products.Add(new Product
                {
                    Id = 11,
                    Name = "Butter",
                    SKU = "SKU002",
                    Quantity = 1,
                    Price = 80,
                    CostPrice = 40,
                    TenantId = 1,
                    CreatedAt = DateTime.UtcNow
                });
                await context.SaveChangesAsync();

                await Assert.ThrowsAsync<InvalidOperationException>(() =>
                    service.AdjustStock(1, 11, -2, "OrderPlaced", null, null));
            }
        }

        [Fact]
        public async Task AdjustStock_AllowsNegative_ForCorrection()
        {
            var (context, service) = BuildService();
            await using (context)
            {
                context.Tenants.Add(new Tenant { Id = 1, Code = "T1", Name = "Tenant 1" });
                context.Products.Add(new Product
                {
                    Id = 12,
                    Name = "Ghee",
                    SKU = "SKU003",
                    Quantity = 1,
                    Price = 150,
                    CostPrice = 90,
                    TenantId = 1,
                    CreatedAt = DateTime.UtcNow
                });
                await context.SaveChangesAsync();

                await service.AdjustStock(1, 12, -3, "Correction", "audit", null);

                var product = await context.Products.FirstAsync(p => p.Id == 12);
                Assert.Equal(-2, product.Quantity);
            }
        }

        [Fact]
        public async Task AdjustStock_Blocks_CrossTenant()
        {
            var (context, service) = BuildService();
            await using (context)
            {
                context.Tenants.Add(new Tenant { Id = 1, Code = "T1", Name = "Tenant 1" });
                context.Tenants.Add(new Tenant { Id = 2, Code = "T2", Name = "Tenant 2" });
                context.Products.Add(new Product
                {
                    Id = 13,
                    Name = "Milk",
                    SKU = "SKU004",
                    Quantity = 5,
                    Price = 50,
                    CostPrice = 30,
                    TenantId = 2,
                    CreatedAt = DateTime.UtcNow
                });
                await context.SaveChangesAsync();

                await Assert.ThrowsAsync<InvalidOperationException>(() =>
                    service.AdjustStock(1, 13, 1, "StockIn", null, null));
            }
        }
    }
}

