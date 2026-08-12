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

        [Fact]
        public async Task CreateClientAsync_Saves_Optional_Gstin()
        {
            var (context, service) = BuildService();
            await using (context)
            {
                var created = await service.CreateClientAsync(1, new Client
                {
                    Name = "Wholesale Buyer",
                    ReferenceName = "Wholesale Buyer",
                    CompanyName = "Buyer Foods Pvt Ltd",
                    Gstin = "29ABCDE1234F1Z5",
                    ClientType = "Wholesale",
                    IsActive = true
                });

                var saved = await context.Clients.SingleAsync(c => c.Id == created.Id);

                Assert.Equal("29ABCDE1234F1Z5", saved.Gstin);
                Assert.Equal("Buyer Foods Pvt Ltd", saved.CompanyName);
            }
        }

        [Fact]
        public async Task CreateClientAsync_Allows_Existing_Client_Without_Gstin()
        {
            var (context, service) = BuildService();
            await using (context)
            {
                var created = await service.CreateClientAsync(1, new Client
                {
                    Name = "Regular Buyer",
                    ReferenceName = "Regular Buyer",
                    ClientType = "Regular",
                    IsActive = true
                });

                var saved = await context.Clients.SingleAsync(c => c.Id == created.Id);

                Assert.Null(saved.Gstin);
            }
        }

        [Fact]
        public async Task UpdateClientAsync_Updates_Gstin()
        {
            var (context, service) = BuildService();
            await using (context)
            {
                var client = await service.CreateClientAsync(1, new Client
                {
                    Name = "Wholesale Buyer",
                    ReferenceName = "Wholesale Buyer",
                    CompanyName = "Buyer Foods Pvt Ltd",
                    Gstin = "29ABCDE1234F1Z5",
                    ClientType = "Wholesale",
                    IsActive = true
                });

                client.Gstin = "27ABCDE1234F1Z2";
                var updated = await service.UpdateClientAsync(1, client);

                Assert.True(updated);
                var saved = await context.Clients.SingleAsync(c => c.Id == client.Id);
                Assert.Equal("27ABCDE1234F1Z2", saved.Gstin);
            }
        }
    }
}
