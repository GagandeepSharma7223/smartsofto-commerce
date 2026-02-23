namespace SmartSofto.Commerce.Application.Interfaces
{
    public interface ICurrentTenantService
    {
        int? TenantId { get; }
        bool HasTenant { get; }
        int GetTenantIdOrDefault(int defaultTenantId);
    }
}
