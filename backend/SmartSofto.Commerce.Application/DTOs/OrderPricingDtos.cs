namespace SmartSofto.Commerce.Application.DTOs
{
    public class PricingLineInput
    {
        public int ProductId { get; set; }
        public int Quantity { get; set; }
        public decimal? UnitPrice { get; set; }
        public decimal? DiscountAmount { get; set; }
    }

    public class PricingLineResult
    {
        public int ProductId { get; set; }
        public string? ProductName { get; set; }
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal DiscountAmount { get; set; }
        public decimal LineGross { get; set; }
        public decimal LineNet { get; set; }
        public int AvailableQuantity { get; set; }
    }

    public class OrderPricingResult
    {
        public int TotalItems { get; set; }
        public decimal Subtotal { get; set; }
        public decimal DiscountTotal { get; set; }
        public decimal Total { get; set; }
        public List<PricingLineResult> Lines { get; set; } = new();
    }
}
