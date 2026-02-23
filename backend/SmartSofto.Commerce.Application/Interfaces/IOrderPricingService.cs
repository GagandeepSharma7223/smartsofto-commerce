using SmartSofto.Commerce.Application.DTOs;

namespace SmartSofto.Commerce.Application.Interfaces
{
    public interface IOrderPricingService
    {
        Task<OrderPricingResult> PriceAsync(int tenantId, IReadOnlyList<PricingLineInput> lines, bool validateStock);
    }
}
