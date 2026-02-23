using System.Collections.Generic;

namespace SmartSofto.Commerce.Application.Interfaces
{
    public interface ICurrentUserService
    {
        string? UserId { get; }
        string? UserName { get; }
        bool IsAuthenticated { get; }
        IReadOnlyList<string> Roles { get; }
        bool IsInRole(string role);
    }
}
