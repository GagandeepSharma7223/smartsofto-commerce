using SmartSofto.Commerce.Application.DTOs;
using SmartSofto.Commerce.Domain.Models;

namespace SmartSofto.Commerce.Application.Interfaces
{
    public interface IClientService
    {
        Task<IReadOnlyList<Client>> GetClientsAsync(int tenantId, bool includeInactive);
        Task<Client?> GetClientAsync(int tenantId, int id);
        Task<Client> CreateClientAsync(int tenantId, Client client);
        Task<bool> UpdateClientAsync(int tenantId, Client client);
        Task<bool> SoftDeleteClientAsync(int tenantId, int id);
        Task<bool> RestoreClientAsync(int tenantId, int id);
        Task<ClientProfileDto?> GetMyProfileAsync(int tenantId, string userId);
        Task<ClientProfileDto> UpsertMyProfileAsync(int tenantId, string userId, ClientProfileDto dto);

        Task<IReadOnlyList<ClientAddress>> GetClientAddressesAsync(int tenantId, int clientId);
        Task<ClientAddress> AddClientAddressAsync(int tenantId, int clientId, ClientAddressDto dto);
        Task<ClientAddress?> UpdateClientAddressAsync(int tenantId, int clientId, int id, ClientAddressDto dto);
        Task<bool> DeleteClientAddressAsync(int tenantId, int clientId, int id);
        Task<IReadOnlyList<ClientAddress>> GetMyAddressesAsync(int tenantId, string userId);
        Task<ClientAddress> AddMyAddressAsync(int tenantId, string userId, ClientAddressDto dto);
        Task<ClientAddress?> UpdateMyAddressAsync(int tenantId, string userId, int id, ClientAddressDto dto);
        Task<bool> DeleteMyAddressAsync(int tenantId, string userId, int id);
    }
}
