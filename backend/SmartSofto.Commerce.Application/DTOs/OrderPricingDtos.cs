namespace SmartSofto.Commerce.Application.DTOs
{
    public class PricingLineInput
    {
        public int ProductId { get; set; }
        public decimal Quantity { get; set; }
        public decimal? UnitPrice { get; set; }
        public decimal? DiscountAmount { get; set; }
    }

    public class PricingLineResult
    {
        public int ProductId { get; set; }
        public string? ProductName { get; set; }
        public decimal Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal DiscountAmount { get; set; }
        public decimal LineGross { get; set; }
        public decimal LineNet { get; set; }
        public decimal AvailableQuantity { get; set; }
        public string? HsnCode { get; set; }
        public decimal GstRate { get; set; }
    }

    public class OrderPricingResult
    {
        public decimal TotalItems { get; set; }
        public decimal Subtotal { get; set; }
        public decimal DiscountTotal { get; set; }
        public decimal Total { get; set; }
        public List<PricingLineResult> Lines { get; set; } = new();
    }
}
