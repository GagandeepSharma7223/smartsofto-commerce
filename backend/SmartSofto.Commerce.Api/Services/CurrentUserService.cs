using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using SmartSofto.Commerce.Application.Interfaces;

namespace SmartSofto.Commerce.Api.Services
{
    public class CurrentUserService : ICurrentUserService
    {
        private readonly IHttpContextAccessor _httpContextAccessor;

        public CurrentUserService(IHttpContextAccessor httpContextAccessor)
        {
            _httpContextAccessor = httpContextAccessor;
        }

        private ClaimsPrincipal? User => _httpContextAccessor.HttpContext?.User;

        public string? UserId => User?.FindFirstValue(ClaimTypes.NameIdentifier);

        public string? UserName => User?.Identity?.Name ?? User?.FindFirstValue(ClaimTypes.Name);

        public bool IsAuthenticated => User?.Identity?.IsAuthenticated ?? false;

        public IReadOnlyList<string> Roles => User?.FindAll(ClaimTypes.Role).Select(c => c.Value).ToList() ?? new List<string>();

        public bool IsInRole(string role) => User?.IsInRole(role) ?? false;
    }
}
