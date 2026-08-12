namespace SmartSofto.Commerce.Application.Interfaces
{
    public interface IInvoicePdfService
    {
        Task<InvoicePdfResult?> GenerateInvoicePdfAsync(int tenantId, int invoiceId);
    }

    public sealed class InvoicePdfResult
    {
        public required byte[] Content { get; init; }
        public required string InvoiceNumber { get; init; }
        public int SellerProfileId { get; init; }
        public required string SellerBusinessName { get; init; }
        public required string FileName { get; init; }
        public string ContentType { get; init; } = "application/pdf";
        public bool HasConfigurationError { get; init; }
        public string? ErrorMessage { get; init; }
    }
}
