using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using SmartSofto.Commerce.Api.Controllers;
using SmartSofto.Commerce.Api.Services;
using SmartSofto.Commerce.Application.DTOs;
using SmartSofto.Commerce.Domain.Models;
using SmartSofto.Commerce.Infrastructure;
using SmartSofto.Commerce.Infrastructure.Services;
using Xunit;

namespace SmartSofto.Commerce.Api.Tests
{
    public class OrderInventoryIntegrationTests
    {
        private static (ApplicationDbContext Context, OrdersController Controller) BuildController()
        {
            var connection = new SqliteConnection("DataSource=:memory:");
            connection.Open();

            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseSqlite(connection)
                .Options;

            var context = new ApplicationDbContext(options);
            context.Database.EnsureCreated();

            var httpContext = new DefaultHttpContext();
            var claims = new List<Claim>
            {
                new Claim("tenant_id", "1"),
                new Claim(ClaimTypes.NameIdentifier, "user-1")
            };
            httpContext.User = new ClaimsPrincipal(new ClaimsIdentity(claims, "TestAuth"));

            var httpContextAccessor = new HttpContextAccessor { HttpContext = httpContext };
            var tenantService = new CurrentTenantService(httpContextAccessor);
            var currentUserService = new CurrentUserService(httpContextAccessor);
            var inventoryService = new InventoryService(context);
            var orderService = new OrderService(context, inventoryService);
            var controller = new OrdersController(orderService, tenantService, currentUserService)
            {
                ControllerContext = new ControllerContext { HttpContext = httpContext }
            };

            return (context, controller);
        }

        private static async Task SeedBaseAsync(ApplicationDbContext context)
        {
            context.Tenants.Add(new Tenant { Id = 1, Code = "T1", Name = "Tenant 1" });
            context.Clients.Add(new Client
            {
                Id = 1,
                Name = "Test Client",
                Email = "test@example.com",
                TenantId = 1,
                CreatedAt = DateTime.UtcNow
            });
            context.Products.Add(new Product
            {
                Id = 1,
                Name = "Paneer",
                SKU = "SKU001",
                Quantity = 10,
                Price = 100,
                CostPrice = 50,
                TenantId = 1,
                CreatedAt = DateTime.UtcNow
            });
            await context.SaveChangesAsync();
        }

        [Fact]
        public async Task CreateOrder_Reduces_ProductQuantity()
        {
            var (context, controller) = BuildController();
            await using (context)
            {
                await SeedBaseAsync(context);

                var request = new MultiOrderRequest
                {
                    ClientId = 1,
                    ProductId = 1,
                    Quantity = 2,
                    PaymentMethod = PaymentMethod.Cash
                };

                await controller.CreateOrder(request);

                var product = await context.Products.FirstAsync(p => p.Id == 1);
                Assert.Equal(8, product.Quantity);
            }
        }

        [Fact]
        public async Task CancelOrder_Restores_ProductQuantity()
        {
            var (context, controller) = BuildController();
            await using (context)
            {
                await SeedBaseAsync(context);

                await controller.CreateOrder(new MultiOrderRequest
                {
                    ClientId = 1,
                    ProductId = 1,
                    Quantity = 2,
                    PaymentMethod = PaymentMethod.Cash
                });

                var order = await context.Orders.FirstAsync();
                await controller.UpdateOrderStatus(order.Id, OrderStatus.Cancelled);

                var product = await context.Products.FirstAsync(p => p.Id == 1);
                Assert.Equal(10, product.Quantity);
            }
        }

        [Fact]
        public async Task CancelOrder_Twice_DoesNotDoubleRestock()
        {
            var (context, controller) = BuildController();
            await using (context)
            {
                await SeedBaseAsync(context);

                await controller.CreateOrder(new MultiOrderRequest
                {
                    ClientId = 1,
                    ProductId = 1,
                    Quantity = 2,
                    PaymentMethod = PaymentMethod.Cash
                });

                var order = await context.Orders.FirstAsync();
                await controller.UpdateOrderStatus(order.Id, OrderStatus.Cancelled);
                await controller.UpdateOrderStatus(order.Id, OrderStatus.Cancelled);

                var product = await context.Products.FirstAsync(p => p.Id == 1);
                Assert.Equal(10, product.Quantity);
            }
        }
    }
}
