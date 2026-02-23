using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartSofto.Commerce.Application.Interfaces;
using SmartSofto.Commerce.Domain.Models;

namespace SmartSofto.Commerce.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class PlantsController : ControllerBase
    {
        private readonly IPlantService _plantService;
        private readonly ICurrentTenantService _tenantService;

        public PlantsController(IPlantService plantService, ICurrentTenantService tenantService)
        {
            _plantService = plantService;
            _tenantService = tenantService;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Plant>>> GetPlants()
        {
            var tenantId = _tenantService.TenantId;
            if (!tenantId.HasValue) return Unauthorized("Tenant claim missing.");
            var plants = await _plantService.GetPlantsAsync(tenantId.Value);
            return Ok(plants);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Plant>> GetPlant(int id)
        {
            var tenantId = _tenantService.TenantId;
            if (!tenantId.HasValue) return Unauthorized("Tenant claim missing.");
            var plant = await _plantService.GetPlantAsync(tenantId.Value, id);
            if (plant == null) return NotFound();
            return Ok(plant);
        }

        [HttpPost]
        public async Task<ActionResult<Plant>> CreatePlant(Plant plant)
        {
            var tenantId = _tenantService.TenantId;
            if (!tenantId.HasValue) return Unauthorized("Tenant claim missing.");
            var created = await _plantService.CreatePlantAsync(tenantId.Value, plant);
            return CreatedAtAction(nameof(GetPlant), new { id = created.Id }, created);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdatePlant(int id, Plant plant)
        {
            var tenantId = _tenantService.TenantId;
            if (!tenantId.HasValue) return Unauthorized("Tenant claim missing.");
            if (id != plant.Id) return BadRequest();

            var updated = await _plantService.UpdatePlantAsync(tenantId.Value, plant);
            if (!updated) return NotFound();
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeletePlant(int id)
        {
            var tenantId = _tenantService.TenantId;
            if (!tenantId.HasValue) return Unauthorized("Tenant claim missing.");
            var deleted = await _plantService.DeletePlantAsync(tenantId.Value, id);
            if (!deleted) return NotFound();
            return NoContent();
        }
    }
}
