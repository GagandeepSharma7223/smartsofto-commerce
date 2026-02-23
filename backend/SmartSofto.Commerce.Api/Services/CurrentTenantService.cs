using System.Security.Claims;
using SmartSofto.Commerce.Application.Interfaces;

namespace SmartSofto.Commerce.Api.Services
{
    public class CurrentTenantService : ICurrentTenantService
    {
        private readonly IHttpContextAccessor _httpContextAccessor;

        public CurrentTenantService(IHttpContextAccessor httpContextAccessor)
        {
            _httpContextAccessor = httpContextAccessor;
        }

        public int? TenantId
        {
            get
            {
                var claim = _httpContextAccessor.HttpContext?.User?.FindFirst("tenant_id")?.Value;
                return int.TryParse(claim, out var tenantId) ? tenantId : null;
            }
        }

        public bool HasTenant => TenantId.HasValue;

        public int GetTenantIdOrDefault(int defaultTenantId)
        {
            return TenantId ?? defaultTenantId;
        }
    }
}
