using Microsoft.AspNetCore.Identity;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using SmartSofto.Commerce.Api.Controllers;
using SmartSofto.Commerce.Application.DTOs;
using SmartSofto.Commerce.Application.Interfaces;
using SmartSofto.Commerce.Application.Settings;
using SmartSofto.Commerce.Infrastructure;
using SmartSofto.Commerce.Infrastructure.Identity;
using SmartSofto.Commerce.Infrastructure.Services;

namespace SmartSofto.Commerce.Api.Tests
{
    public class AuthControllerTests
    {
        [Fact]
        public async Task Register_Ignores_ClientSupplied_AdminRole_And_TenantId()
        {
            await using var fixture = await AuthControllerFixture.CreateAsync();
            var controller = fixture.CreateController();

            var result = await controller.Register(new RegisterRequest
            {
                Username = "freshmooz-customer",
                Email = "customer@example.com",
                Password = "Customer@12345",
                FirstName = "Fresh",
                LastName = "Customer",
                Role = "Admin",
                TenantId = 999
            });

            var response = Assert.IsType<LoginResponse>(result.Value);
            Assert.Equal("User", response.User.Role);

            var user = await fixture.UserManager.FindByNameAsync("freshmooz-customer");
            Assert.NotNull(user);
            Assert.Equal(1, user.TenantId);

            var roles = await fixture.UserManager.GetRolesAsync(user);
            Assert.Equal(["User"], roles);
        }

        private sealed class AuthControllerFixture : IAsyncDisposable
        {
            private readonly SqliteConnection _connection;
            private readonly ServiceProvider _services;

            private AuthControllerFixture(SqliteConnection connection, ServiceProvider services)
            {
                _connection = connection;
                _services = services;
            }

            public UserManager<ApplicationUser> UserManager => _services.GetRequiredService<UserManager<ApplicationUser>>();

            public static async Task<AuthControllerFixture> CreateAsync()
            {
                var connection = new SqliteConnection("DataSource=:memory:");
                await connection.OpenAsync();

                var services = new ServiceCollection();
                services.AddLogging();
                services.AddDbContext<ApplicationDbContext>(options => options.UseSqlite(connection));
                services
                    .AddIdentity<ApplicationUser, IdentityRole>()
                    .AddEntityFrameworkStores<ApplicationDbContext>()
                    .AddDefaultTokenProviders();

                var provider = services.BuildServiceProvider();
                var context = provider.GetRequiredService<ApplicationDbContext>();
                await context.Database.EnsureCreatedAsync();

                var roleManager = provider.GetRequiredService<RoleManager<IdentityRole>>();
                if (!await roleManager.RoleExistsAsync("User"))
                {
                    await roleManager.CreateAsync(new IdentityRole("User"));
                }

                if (!await roleManager.RoleExistsAsync("Admin"))
                {
                    await roleManager.CreateAsync(new IdentityRole("Admin"));
                }

                return new AuthControllerFixture(connection, provider);
            }

            public AuthController CreateController()
            {
                var jwt = new JwtService(Options.Create(new JwtSettings
                {
                    SecretKey = "test-secret-key-change-me-1234567890123456",
                    Issuer = "test-issuer",
                    Audience = "test-audience",
                    ExpirationInHours = 1
                }));

                var configuration = new ConfigurationBuilder().Build();

                return new AuthController(
                    UserManager,
                    null!,
                    jwt,
                    new FakeEmailSender(),
                    configuration);
            }

            public async ValueTask DisposeAsync()
            {
                await _services.DisposeAsync();
                await _connection.DisposeAsync();
            }
        }

        private sealed class FakeEmailSender : IEmailSender
        {
            public Task SendAsync(string toEmail, string subject, string htmlBody)
            {
                return Task.CompletedTask;
            }
        }
    }
}
