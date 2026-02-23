using SmartSofto.Commerce.Domain.Models;

namespace SmartSofto.Commerce.Application.Interfaces
{
    public interface IPlantService
    {
        Task<IReadOnlyList<Plant>> GetPlantsAsync(int tenantId);
        Task<Plant?> GetPlantAsync(int tenantId, int id);
        Task<Plant> CreatePlantAsync(int tenantId, Plant plant);
        Task<bool> UpdatePlantAsync(int tenantId, Plant plant);
        Task<bool> DeletePlantAsync(int tenantId, int id);
    }
}
