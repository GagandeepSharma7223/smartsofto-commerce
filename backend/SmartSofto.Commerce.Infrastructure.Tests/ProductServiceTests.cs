using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using SmartSofto.Commerce.Domain.Models;
using SmartSofto.Commerce.Infrastructure;
using SmartSofto.Commerce.Infrastructure.Services;

namespace SmartSofto.Commerce.Infrastructure.Tests
{
    public class ProductServiceTests
    {
        private static (ApplicationDbContext Context, ProductService Service) BuildService()
        {
            var connection = new SqliteConnection("DataSource=:memory:");
            connection.Open();

            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseSqlite(connection)
                .Options;

            var context = new ApplicationDbContext(options);
            context.Database.EnsureCreated();

            return (context, new ProductService(context));
        }

        [Fact]
        public async Task CreateProduct_DefaultsGstRateToZero()
        {
            var (context, service) = BuildService();
            await using (context)
            {
                var product = await service.CreateProductAsync(1, new Product
                {
                    Name = "Paneer",
                    SKU = "PNR001",
                    Price = 120,
                    CostPrice = 80,
                    Quantity = 10
                });

                Assert.Equal(0m, product.GstRate);

                var saved = await context.Products.SingleAsync(p => p.Id == product.Id);
                Assert.Equal(0m, saved.GstRate);
                Assert.Null(saved.HsnCode);
            }
        }

        [Fact]
        public async Task CreateProduct_SavesGstRateAndHsnCode()
        {
            var (context, service) = BuildService();
            await using (context)
            {
                var product = await service.CreateProductAsync(1, new Product
                {
                    Name = "Masala",
                    SKU = "MSL001",
                    Price = 75,
                    CostPrice = 45,
                    Quantity = 20,
                    GstRate = 5m,
                    HsnCode = "0910"
                });

                var saved = await context.Products.SingleAsync(p => p.Id == product.Id);
                Assert.Equal(5m, saved.GstRate);
                Assert.Equal("0910", saved.HsnCode);
            }
        }

        [Fact]
        public async Task UpdateProduct_PreservesGstRateAndHsnCode()
        {
            var (context, service) = BuildService();
            await using (context)
            {
                var created = await service.CreateProductAsync(1, new Product
                {
                    Name = "Cow Ghee",
                    SKU = "GHEE001",
                    Price = 399,
                    CostPrice = 260,
                    Quantity = 8,
                    GstRate = 5m,
                    HsnCode = "0405"
                });

                var updated = await service.UpdateProductAsync(1, new Product
                {
                    Id = created.Id,
                    Name = "Cow Ghee 500ml",
                    SKU = "GHEE001",
                    Price = 425,
                    CostPrice = 275,
                    Quantity = 6,
                    Type = ProductType.FinishedGood,
                    Unit = Unit.Piece,
                    GstRate = 12m,
                    HsnCode = "0406",
                    IsActive = true
                });

                Assert.True(updated);

                var saved = await context.Products.SingleAsync(p => p.Id == created.Id);
                Assert.Equal(12m, saved.GstRate);
                Assert.Equal("0406", saved.HsnCode);
            }
        }

        [Fact]
        public async Task CreateProduct_RejectsNegativeGstRate()
        {
            var (_, service) = BuildService();

            await Assert.ThrowsAsync<InvalidOperationException>(() =>
                service.CreateProductAsync(1, new Product
                {
                    Name = "Invalid",
                    SKU = "BADGST",
                    Price = 10,
                    CostPrice = 5,
                    Quantity = 1,
                    GstRate = -1m
                }));
        }
    }
}
