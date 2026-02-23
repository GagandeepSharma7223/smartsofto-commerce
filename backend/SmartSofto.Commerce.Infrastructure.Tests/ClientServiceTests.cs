using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using SmartSofto.Commerce.Domain.Models;
using SmartSofto.Commerce.Infrastructure;
using SmartSofto.Commerce.Infrastructure.Services;
using Xunit;

namespace SmartSofto.Commerce.Infrastructure.Tests
{
    public class ClientServiceTests
    {
        private static (ApplicationDbContext Context, ClientService Service) BuildService()
        {
            var connection = new SqliteConnection("DataSource=:memory:");
            connection.Open();

            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseSqlite(connection)
                .Options;

            var context = new ApplicationDbContext(options);
            context.Database.EnsureCreated();

            return (context, new ClientService(context));
        }

        [Fact]
        public async Task GetClients_Default_ReturnsOnlyActive()
        {
            var (context, service) = BuildService();
            await using (context)
            {
                context.Tenants.Add(new Tenant { Id = 1, Code = "T1", Name = "Tenant 1" });
                context.Clients.Add(new Client
                {
                    Id = 1,
                    Name = "Active",
                    Email = "active@example.com",
                    TenantId = 1,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                });
                context.Clients.Add(new Client
                {
                    Id = 2,
                    Name = "Inactive",
                    Email = "inactive@example.com",
                    TenantId = 1,
                    IsActive = false,
                    CreatedAt = DateTime.UtcNow
                });
                await context.SaveChangesAsync();

                var clients = await service.GetClientsAsync(1, includeInactive: false);
                Assert.Single(clients);
                Assert.Equal("Active", clients[0].Name);
            }
        }
    }
}
