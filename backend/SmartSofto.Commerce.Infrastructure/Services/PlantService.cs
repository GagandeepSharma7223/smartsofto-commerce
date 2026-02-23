using Microsoft.EntityFrameworkCore;
using SmartSofto.Commerce.Application.Interfaces;
using SmartSofto.Commerce.Domain.Models;

namespace SmartSofto.Commerce.Infrastructure.Services
{
    public class PlantService : IPlantService
    {
        private readonly ApplicationDbContext _context;

        public PlantService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IReadOnlyList<Plant>> GetPlantsAsync(int tenantId)
        {
            return await _context.Plants.Where(p => p.TenantId == tenantId).ToListAsync();
        }

        public async Task<Plant?> GetPlantAsync(int tenantId, int id)
        {
            return await _context.Plants.FirstOrDefaultAsync(p => p.Id == id && p.TenantId == tenantId);
        }

        public async Task<Plant> CreatePlantAsync(int tenantId, Plant plant)
        {
            plant.CreatedAt = DateTime.UtcNow;
            plant.TenantId = tenantId;
            _context.Plants.Add(plant);
            await _context.SaveChangesAsync();
            return plant;
        }

        public async Task<bool> UpdatePlantAsync(int tenantId, Plant plant)
        {
            var existing = await _context.Plants.FirstOrDefaultAsync(p => p.Id == plant.Id && p.TenantId == tenantId);
            if (existing == null)
            {
                return false;
            }

            plant.TenantId = tenantId;
            plant.UpdatedAt = DateTime.UtcNow;
            _context.Entry(existing).CurrentValues.SetValues(plant);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeletePlantAsync(int tenantId, int id)
        {
            var plant = await _context.Plants.FirstOrDefaultAsync(p => p.Id == id && p.TenantId == tenantId);
            if (plant == null)
            {
                return false;
            }

            _context.Plants.Remove(plant);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
