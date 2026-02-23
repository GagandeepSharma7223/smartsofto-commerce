using Microsoft.EntityFrameworkCore;
using SmartSofto.Commerce.Application.DTOs;
using SmartSofto.Commerce.Application.Interfaces;
using SmartSofto.Commerce.Domain.Models;

namespace SmartSofto.Commerce.Infrastructure.Services
{
    public class ClientService : IClientService
    {
        private readonly ApplicationDbContext _context;

        public ClientService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IReadOnlyList<Client>> GetClientsAsync(int tenantId, bool includeInactive)
        {
            var query = _context.Clients.Where(c => c.TenantId == tenantId);
            if (!includeInactive)
            {
                query = query.Where(c => c.IsActive);
            }
            return await query.ToListAsync();
        }

        public async Task<Client?> GetClientAsync(int tenantId, int id)
        {
            return await _context.Clients.FirstOrDefaultAsync(c => c.Id == id && c.TenantId == tenantId);
        }

        public async Task<Client> CreateClientAsync(int tenantId, Client client)
        {
            client.CreatedAt = DateTime.UtcNow;
            client.TenantId = tenantId;
            _context.Clients.Add(client);
            await _context.SaveChangesAsync();
            return client;
        }

        public async Task<bool> UpdateClientAsync(int tenantId, Client client)
        {
            var existing = await _context.Clients.FirstOrDefaultAsync(c => c.Id == client.Id && c.TenantId == tenantId);
            if (existing == null)
            {
                return false;
            }

            existing.Name = client.Name;
            existing.ReferenceName = client.ReferenceName;
            existing.CompanyName = client.CompanyName;
            existing.Email = client.Email;
            existing.PhoneNumber = client.PhoneNumber;
            existing.ClientType = client.ClientType;
            existing.TotalPurchases = client.TotalPurchases;
            existing.CreditLimit = client.CreditLimit;
            existing.TaxIdentificationNumber = client.TaxIdentificationNumber;
            existing.PreferredPaymentMethod = client.PreferredPaymentMethod;
            existing.FirstPurchaseDate = client.FirstPurchaseDate;
            existing.LastPurchaseDate = client.LastPurchaseDate;
            existing.IsActive = client.IsActive;
            existing.Notes = client.Notes;
            existing.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> SoftDeleteClientAsync(int tenantId, int id)
        {
            var client = await _context.Clients.FirstOrDefaultAsync(c => c.Id == id && c.TenantId == tenantId);
            if (client == null)
            {
                return false;
            }

            if (client.IsActive)
            {
                client.IsActive = false;
                client.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
            }

            return true;
        }

        public async Task<bool> RestoreClientAsync(int tenantId, int id)
        {
            var client = await _context.Clients.FirstOrDefaultAsync(c => c.Id == id && c.TenantId == tenantId);
            if (client == null)
            {
                return false;
            }

            if (!client.IsActive)
            {
                client.IsActive = true;
                client.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
            }

            return true;
        }

        public async Task<ClientProfileDto?> GetMyProfileAsync(int tenantId, string userId)
        {
            var client = await _context.Clients.FirstOrDefaultAsync(c => c.UserId == userId && c.TenantId == tenantId);
            if (client == null)
            {
                return null;
            }

            return new ClientProfileDto
            {
                Name = client.Name,
                Email = client.Email,
                PhoneNumber = client.PhoneNumber,
                Notes = client.Notes
            };
        }

        public async Task<ClientProfileDto> UpsertMyProfileAsync(int tenantId, string userId, ClientProfileDto dto)
        {
            var client = await _context.Clients.FirstOrDefaultAsync(c => c.UserId == userId && c.TenantId == tenantId);
            if (client == null)
            {
                client = new Client
                {
                    UserId = userId,
                    Name = dto.Name ?? string.Empty,
                    Email = dto.Email,
                    PhoneNumber = dto.PhoneNumber,
                    ReferenceName = dto.Name ?? string.Empty,
                    ClientType = "Regular",
                    CreatedAt = DateTime.UtcNow,
                    TenantId = tenantId
                };
                _context.Clients.Add(client);
            }
            else
            {
                client.Name = dto.Name ?? client.Name;
                client.Email = dto.Email ?? client.Email;
                client.PhoneNumber = dto.PhoneNumber ?? client.PhoneNumber;
                client.UpdatedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();
            return await GetMyProfileAsync(tenantId, userId) ?? new ClientProfileDto();
        }


        public async Task<IReadOnlyList<ClientAddress>> GetClientAddressesAsync(int tenantId, int clientId)
        {
            var client = await _context.Clients.FirstOrDefaultAsync(c => c.Id == clientId && c.TenantId == tenantId);
            if (client == null)
            {
                throw new InvalidOperationException("Client not found");
            }

            return await _context.ClientAddresses
                .Where(a => a.ClientId == clientId && a.TenantId == tenantId)
                .OrderByDescending(a => a.IsDefault)
                .ThenBy(a => a.CreatedAt)
                .ToListAsync();
        }

        public async Task<ClientAddress> AddClientAddressAsync(int tenantId, int clientId, ClientAddressDto dto)
        {
            var client = await _context.Clients.FirstOrDefaultAsync(c => c.Id == clientId && c.TenantId == tenantId);
            if (client == null)
            {
                throw new InvalidOperationException("Client not found");
            }

            var hasAny = await _context.ClientAddresses.AnyAsync(a => a.ClientId == clientId && a.TenantId == tenantId);
            var isDefault = dto.IsDefault || !hasAny;
            if (isDefault)
            {
                var existingDefaults = await _context.ClientAddresses
                    .Where(a => a.ClientId == clientId && a.TenantId == tenantId && a.IsDefault)
                    .ToListAsync();
                foreach (var addr in existingDefaults)
                {
                    addr.IsDefault = false;
                }
            }

            var address = new ClientAddress
            {
                ClientId = clientId,
                TenantId = tenantId,
                UserId = client.UserId,
                Label = string.IsNullOrWhiteSpace(dto.Label) ? "Default" : dto.Label,
                IsDefault = isDefault,
                Name = dto.Name ?? string.Empty,
                Phone = dto.Phone ?? string.Empty,
                AddressLine1 = dto.AddressLine1,
                AddressLine2 = dto.AddressLine2,
                City = dto.City ?? string.Empty,
                State = dto.State ?? string.Empty,
                PostalCode = dto.PostalCode ?? string.Empty,
                Country = dto.Country
            };

            _context.ClientAddresses.Add(address);
            await _context.SaveChangesAsync();
            return address;
        }

        public async Task<ClientAddress?> UpdateClientAddressAsync(int tenantId, int clientId, int id, ClientAddressDto dto)
        {
            var address = await _context.ClientAddresses.FirstOrDefaultAsync(a => a.Id == id && a.ClientId == clientId && a.TenantId == tenantId);
            if (address == null)
            {
                return null;
            }

            if (dto.IsDefault && !address.IsDefault)
            {
                var existingDefaults = await _context.ClientAddresses
                    .Where(a => a.ClientId == clientId && a.TenantId == tenantId && a.IsDefault)
                    .ToListAsync();
                foreach (var addr in existingDefaults)
                {
                    addr.IsDefault = false;
                }
                address.IsDefault = true;
            }

            address.Label = dto.Label ?? address.Label;
            address.Name = dto.Name ?? address.Name;
            address.Phone = dto.Phone ?? address.Phone;
            address.AddressLine1 = dto.AddressLine1;
            address.AddressLine2 = dto.AddressLine2;
            address.City = dto.City ?? address.City;
            address.State = dto.State ?? address.State;
            address.PostalCode = dto.PostalCode ?? address.PostalCode;
            address.Country = dto.Country ?? address.Country;
            address.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return address;
        }

        public async Task<bool> DeleteClientAddressAsync(int tenantId, int clientId, int id)
        {
            var address = await _context.ClientAddresses.FirstOrDefaultAsync(a => a.Id == id && a.ClientId == clientId && a.TenantId == tenantId);
            if (address == null)
            {
                return false;
            }

            _context.ClientAddresses.Remove(address);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<IReadOnlyList<ClientAddress>> GetMyAddressesAsync(int tenantId, string userId)
        {
            var client = await _context.Clients.FirstOrDefaultAsync(c => c.UserId == userId && c.TenantId == tenantId);
            if (client == null)
            {
                return Array.Empty<ClientAddress>();
            }

            return await _context.ClientAddresses
                .Where(a => a.ClientId == client.Id && a.TenantId == tenantId)
                .OrderByDescending(a => a.IsDefault)
                .ThenBy(a => a.CreatedAt)
                .ToListAsync();
        }

        public async Task<ClientAddress> AddMyAddressAsync(int tenantId, string userId, ClientAddressDto dto)
        {
            var client = await _context.Clients.FirstOrDefaultAsync(c => c.UserId == userId && c.TenantId == tenantId);
            if (client == null)
            {
                throw new InvalidOperationException("Client profile not found");
            }

            var hasAny = await _context.ClientAddresses.AnyAsync(a => a.ClientId == client.Id && a.TenantId == tenantId);
            var isDefault = dto.IsDefault || !hasAny;
            if (isDefault)
            {
                var existingDefaults = await _context.ClientAddresses
                    .Where(a => a.ClientId == client.Id && a.TenantId == tenantId && a.IsDefault)
                    .ToListAsync();
                foreach (var addr in existingDefaults)
                {
                    addr.IsDefault = false;
                }
            }

            var address = new ClientAddress
            {
                ClientId = client.Id,
                UserId = userId,
                TenantId = tenantId,
                Label = string.IsNullOrWhiteSpace(dto.Label) ? "Default" : dto.Label,
                IsDefault = isDefault,
                Name = dto.Name ?? string.Empty,
                Phone = dto.Phone ?? string.Empty,
                AddressLine1 = dto.AddressLine1,
                AddressLine2 = dto.AddressLine2,
                City = dto.City ?? string.Empty,
                State = dto.State ?? string.Empty,
                PostalCode = dto.PostalCode ?? string.Empty,
                Country = dto.Country
            };

            _context.ClientAddresses.Add(address);
            await _context.SaveChangesAsync();
            return address;
        }

        public async Task<ClientAddress?> UpdateMyAddressAsync(int tenantId, string userId, int id, ClientAddressDto dto)
        {
            var client = await _context.Clients.FirstOrDefaultAsync(c => c.UserId == userId && c.TenantId == tenantId);
            if (client == null)
            {
                return null;
            }

            var address = await _context.ClientAddresses.FirstOrDefaultAsync(a => a.Id == id && a.ClientId == client.Id && a.TenantId == tenantId);
            if (address == null)
            {
                return null;
            }

            if (dto.IsDefault && !address.IsDefault)
            {
                var existingDefaults = await _context.ClientAddresses
                    .Where(a => a.ClientId == client.Id && a.TenantId == tenantId && a.IsDefault)
                    .ToListAsync();
                foreach (var addr in existingDefaults)
                {
                    addr.IsDefault = false;
                }
                address.IsDefault = true;
            }

            address.Label = dto.Label ?? address.Label;
            address.Name = dto.Name ?? address.Name;
            address.Phone = dto.Phone ?? address.Phone;
            address.AddressLine1 = dto.AddressLine1;
            address.AddressLine2 = dto.AddressLine2;
            address.City = dto.City ?? address.City;
            address.State = dto.State ?? address.State;
            address.PostalCode = dto.PostalCode ?? address.PostalCode;
            address.Country = dto.Country ?? address.Country;
            address.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return address;
        }

        public async Task<bool> DeleteMyAddressAsync(int tenantId, string userId, int id)
        {
            var client = await _context.Clients.FirstOrDefaultAsync(c => c.UserId == userId && c.TenantId == tenantId);
            if (client == null)
            {
                return false;
            }

            var address = await _context.ClientAddresses.FirstOrDefaultAsync(a => a.Id == id && a.ClientId == client.Id && a.TenantId == tenantId);
            if (address == null)
            {
                return false;
            }

            _context.ClientAddresses.Remove(address);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
