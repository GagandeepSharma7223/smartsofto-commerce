using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartSofto.Commerce.Application.DTOs;
using SmartSofto.Commerce.Application.Interfaces;
using SmartSofto.Commerce.Domain.Models;

namespace SmartSofto.Commerce.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ClientsController : ControllerBase
    {
        private readonly IClientService _clientService;
        private readonly ICurrentTenantService _tenantService;
        private readonly ICurrentUserService _currentUser;

        public ClientsController(IClientService clientService, ICurrentTenantService tenantService, ICurrentUserService currentUser)
        {
            _clientService = clientService;
            _tenantService = tenantService;
            _currentUser = currentUser;
        }

        // Admin CRUD
        [Authorize(Roles = "Admin")]
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Client>>> GetClients([FromQuery] bool includeInactive = false)
        {
            var tenantId = _tenantService.TenantId;
            if (!tenantId.HasValue) return Unauthorized("Tenant claim missing.");
            var clients = await _clientService.GetClientsAsync(tenantId.Value, includeInactive);
            return Ok(clients);
        }

        [Authorize(Roles = "Admin")]
        [HttpGet("{id}")]
        public async Task<ActionResult<Client>> GetClient(int id)
        {
            var tenantId = _tenantService.TenantId;
            if (!tenantId.HasValue) return Unauthorized("Tenant claim missing.");
            var client = await _clientService.GetClientAsync(tenantId.Value, id);
            if (client == null) return NotFound();
            return Ok(client);
        }

        [Authorize(Roles = "Admin")]
        [HttpPost]
        public async Task<ActionResult<Client>> CreateClient(Client client)
        {
            var tenantId = _tenantService.TenantId;
            if (!tenantId.HasValue) return Unauthorized("Tenant claim missing.");
            var created = await _clientService.CreateClientAsync(tenantId.Value, client);
            return CreatedAtAction(nameof(GetClient), new { id = created.Id }, created);
        }

        [Authorize(Roles = "Admin")]
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateClient(int id, Client client)
        {
            var tenantId = _tenantService.TenantId;
            if (!tenantId.HasValue) return Unauthorized("Tenant claim missing.");
            if (id != client.Id) return BadRequest();

            var updated = await _clientService.UpdateClientAsync(tenantId.Value, client);
            if (!updated) return NotFound();
            return NoContent();
        }

        [Authorize(Roles = "Admin")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteClient(int id)
        {
            var tenantId = _tenantService.TenantId;
            if (!tenantId.HasValue) return Unauthorized("Tenant claim missing.");
            var deleted = await _clientService.SoftDeleteClientAsync(tenantId.Value, id);
            if (!deleted) return NotFound();
            return NoContent();
        }

        [Authorize(Roles = "Admin")]
        [HttpPut("{id}/restore")]
        public async Task<IActionResult> RestoreClient(int id)
        {
            var tenantId = _tenantService.TenantId;
            if (!tenantId.HasValue) return Unauthorized("Tenant claim missing.");
            var restored = await _clientService.RestoreClientAsync(tenantId.Value, id);
            if (!restored) return NotFound();
            return NoContent();
        }

        // Current-user Profile
        [Authorize]
        [HttpGet("me")]
        public async Task<ActionResult<ClientProfileDto>> GetMyProfile()
        {
            if (string.IsNullOrEmpty(_currentUser.UserId)) return Unauthorized();
            var tenantId = _tenantService.TenantId;
            if (!tenantId.HasValue) return Unauthorized();
            var profile = await _clientService.GetMyProfileAsync(tenantId.Value, _currentUser.UserId);
            if (profile == null) return NotFound();
            return Ok(profile);
        }

        // Admin client addresses
        [Authorize(Roles = "Admin")]
        [HttpGet("{clientId:int}/addresses")]
        public async Task<ActionResult<IEnumerable<ClientAddress>>> GetClientAddresses(int clientId)
        {
            var tenantId = _tenantService.TenantId;
            if (!tenantId.HasValue) return Unauthorized("Tenant claim missing.");
            try
            {
                var list = await _clientService.GetClientAddressesAsync(tenantId.Value, clientId);
                return Ok(list);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [Authorize(Roles = "Admin")]
        [HttpPost("{clientId:int}/addresses")]
        public async Task<ActionResult<ClientAddress>> AddClientAddress(int clientId, [FromBody] ClientAddressDto dto)
        {
            var tenantId = _tenantService.TenantId;
            if (!tenantId.HasValue) return Unauthorized("Tenant claim missing.");
            try
            {
                var address = await _clientService.AddClientAddressAsync(tenantId.Value, clientId, dto);
                return Ok(address);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [Authorize(Roles = "Admin")]
        [HttpPut("{clientId:int}/addresses/{id:int}")]
        public async Task<ActionResult<ClientAddress>> UpdateClientAddress(int clientId, int id, [FromBody] ClientAddressDto dto)
        {
            var tenantId = _tenantService.TenantId;
            if (!tenantId.HasValue) return Unauthorized("Tenant claim missing.");
            var address = await _clientService.UpdateClientAddressAsync(tenantId.Value, clientId, id, dto);
            if (address == null) return NotFound();
            return Ok(address);
        }

        [Authorize(Roles = "Admin")]
        [HttpDelete("{clientId:int}/addresses/{id:int}")]
        public async Task<IActionResult> DeleteClientAddress(int clientId, int id)
        {
            var tenantId = _tenantService.TenantId;
            if (!tenantId.HasValue) return Unauthorized("Tenant claim missing.");
            var deleted = await _clientService.DeleteClientAddressAsync(tenantId.Value, clientId, id);
            if (!deleted) return NotFound();
            return NoContent();
        }


        [Authorize]
        [HttpPost("me")]
        public async Task<ActionResult<ClientProfileDto>> UpsertMyProfile([FromBody] ClientProfileDto dto)
        {
            if (string.IsNullOrEmpty(_currentUser.UserId)) return Unauthorized();
            var tenantId = _tenantService.TenantId;
            if (!tenantId.HasValue) return Unauthorized();
            var profile = await _clientService.UpsertMyProfileAsync(tenantId.Value, _currentUser.UserId, dto);
            return Ok(profile);
        }

        // Saved Addresses
        [Authorize]
        [HttpGet("addresses")]
        public async Task<ActionResult<IEnumerable<ClientAddress>>> GetMyAddresses()
        {
            if (string.IsNullOrEmpty(_currentUser.UserId)) return Unauthorized();
            var tenantId = _tenantService.TenantId;
            if (!tenantId.HasValue) return Unauthorized("Tenant claim missing.");
            var list = await _clientService.GetMyAddressesAsync(tenantId.Value, _currentUser.UserId);
            return Ok(list);
        }

        [Authorize]
        [HttpPost("addresses")]
        public async Task<ActionResult<ClientAddress>> AddMyAddress([FromBody] ClientAddressDto dto)
        {
            if (string.IsNullOrEmpty(_currentUser.UserId)) return Unauthorized();
            var tenantId = _tenantService.TenantId;
            if (!tenantId.HasValue) return Unauthorized("Tenant claim missing.");
            var address = await _clientService.AddMyAddressAsync(tenantId.Value, _currentUser.UserId, dto);
            return Ok(address);
        }

        [Authorize]
        [HttpPut("addresses/{id:int}")]
        public async Task<ActionResult<ClientAddress>> UpdateMyAddress(int id, [FromBody] ClientAddressDto dto)
        {
            if (string.IsNullOrEmpty(_currentUser.UserId)) return Unauthorized();
            var tenantId = _tenantService.TenantId;
            if (!tenantId.HasValue) return Unauthorized("Tenant claim missing.");
            var address = await _clientService.UpdateMyAddressAsync(tenantId.Value, _currentUser.UserId, id, dto);
            if (address == null) return NotFound();
            return Ok(address);
        }

        [Authorize]
        [HttpDelete("addresses/{id:int}")]
        public async Task<IActionResult> DeleteMyAddress(int id)
        {
            if (string.IsNullOrEmpty(_currentUser.UserId)) return Unauthorized();
            var tenantId = _tenantService.TenantId;
            if (!tenantId.HasValue) return Unauthorized("Tenant claim missing.");
            var deleted = await _clientService.DeleteMyAddressAsync(tenantId.Value, _currentUser.UserId, id);
            if (!deleted) return NotFound();
            return NoContent();
        }
    }
}
