using SmartSofto.Commerce.Domain.Models;

namespace SmartSofto.Commerce.Application.Interfaces
{
    public interface ISaleService
    {
        Task<Sale> CreateSaleAsync(Sale sale);
        Task<Sale?> GetSaleByIdAsync(int id);
        Task<Sale?> GetSaleByInvoiceNumberAsync(string invoiceNumber);
        Task<IEnumerable<Sale>> GetAllSalesAsync();
        Task<IEnumerable<Sale>> GetClientSalesAsync(int clientId);
        Task<IEnumerable<Sale>> GetSalesByDateRangeAsync(DateTime startDate, DateTime endDate);
        Task<Sale> UpdateSaleAsync(Sale sale);
        Task<bool> DeleteSaleAsync(int id);

        Task<Sale> ProcessPaymentAsync(int saleId, decimal amount, string paymentMethod, string? transactionReference);
        Task<Sale> UpdatePaymentStatusAsync(int saleId, string status);
        Task<IEnumerable<Sale>> GetOverdueSalesAsync();
        Task<decimal> GetTotalSalesForPeriodAsync(DateTime startDate, DateTime endDate);
        Task<decimal> GetClientTotalPurchasesAsync(int clientId);
        Task<Dictionary<string, decimal>> GetMonthlySalesAsync(int year);
        Task<Dictionary<string, Dictionary<string, decimal>>> GetMonthlySalesByProductAsync(int year);
        Task<Dictionary<string, Dictionary<string, decimal>>> GetMonthlySalesByClientAsync(int year);
        Task<SalesAnalysis> GetSalesAnalysisAsync(int year);
    }
}
