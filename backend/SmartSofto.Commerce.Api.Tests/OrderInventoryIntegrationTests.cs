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
using SmartSofto.Commerce.Infrastructure.Identity;
using SmartSofto.Commerce.Infrastructure.Services;
using Xunit;

namespace SmartSofto.Commerce.Api.Tests
{
    public class OrderInventoryIntegrationTests
    {
        private static (ApplicationDbContext Context, OrdersController Controller) BuildController(bool isAdmin = false)
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
            if (isAdmin)
            {
                claims.Add(new Claim(ClaimTypes.Role, "Admin"));
            }
            httpContext.User = new ClaimsPrincipal(new ClaimsIdentity(claims, "TestAuth"));

            var httpContextAccessor = new HttpContextAccessor { HttpContext = httpContext };
            var tenantService = new CurrentTenantService(httpContextAccessor);
            var currentUserService = new CurrentUserService(httpContextAccessor);
            var inventoryService = new InventoryService(context);
            var pricingService = new OrderPricingService(context);
            var orderService = new OrderService(context, inventoryService, pricingService);
            var controller = new OrdersController(orderService, tenantService, currentUserService)
            {
                ControllerContext = new ControllerContext { HttpContext = httpContext }
            };

            return (context, controller);
        }

        private static async Task SeedBaseAsync(ApplicationDbContext context)
        {
            context.Users.Add(new ApplicationUser
            {
                Id = "user-1",
                UserName = "user-1",
                NormalizedUserName = "USER-1",
                Email = "user-1@example.com",
                NormalizedEmail = "USER-1@EXAMPLE.COM",
                TenantId = 1,
                IsActive = true,
                EmailConfirmed = true,
                SecurityStamp = Guid.NewGuid().ToString("N")
            });
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
                    PaymentMethod = PaymentMethod.Cash,
                    ShippingAddress = new AddressRequest
                    {
                        Line1 = "123 Test St",
                        City = "Regina",
                        State = "SK",
                        Pincode = "S4P1A1",
                        Country = "Canada"
                    }
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
                    PaymentMethod = PaymentMethod.Cash,
                    ShippingAddress = new AddressRequest
                    {
                        Line1 = "123 Test St",
                        City = "Regina",
                        State = "SK",
                        Pincode = "S4P1A1",
                        Country = "Canada"
                    }
                });

                var order = await context.Orders.FirstAsync();
                await controller.UpdateOrderStatus(order.Id, OrderStatus.Cancelled);

                var product = await context.Products.FirstAsync(p => p.Id == 1);
                Assert.Equal(10, product.Quantity);
            }
        }

        [Fact]
        public async Task Admin_Can_Create_Backdated_Order_Within7Days()
        {
            var (context, controller) = BuildController(isAdmin: true);
            await using (context)
            {
                await SeedBaseAsync(context);

                await controller.CreateOrder(new MultiOrderRequest
                {
                    ClientId = 1,
                    ProductId = 1,
                    Quantity = 1,
                    PaymentMethod = PaymentMethod.Cash,
                    OrderDate = DateTime.UtcNow.Date.AddDays(-2),
                    Notes = "Entered after store close",
                    ShippingAddress = new AddressRequest
                    {
                        Line1 = "123 Test St",
                        City = "Regina",
                        State = "SK",
                        Pincode = "S4P1A1",
                        Country = "Canada"
                    }
                });

                var order = await context.Orders.FirstAsync();
                var txn = await context.InventoryTransactions.FirstAsync();
                Assert.Equal(DateTime.UtcNow.Date.AddDays(-2), order.OrderDate.Date);
                Assert.Equal(order.OrderDate.Date, txn.EffectiveDate.Date);
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
                    PaymentMethod = PaymentMethod.Cash,
                    ShippingAddress = new AddressRequest
                    {
                        Line1 = "123 Test St",
                        City = "Regina",
                        State = "SK",
                        Pincode = "S4P1A1",
                        Country = "Canada"
                    }
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
