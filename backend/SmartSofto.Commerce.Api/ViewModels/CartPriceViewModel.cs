using System.Collections.Generic;

namespace SmartSofto.Commerce.Api.ViewModels
{
    public class CartPriceViewModel
    {
        public int TotalItems { get; set; }
        public decimal Subtotal { get; set; }
        public List<CartPriceItemViewModel> Items { get; set; } = new();
    }

    public class CartPriceItemViewModel
    {
        public int ProductId { get; set; }
        public string? ProductName { get; set; }
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal LineTotal { get; set; }
    }
}
