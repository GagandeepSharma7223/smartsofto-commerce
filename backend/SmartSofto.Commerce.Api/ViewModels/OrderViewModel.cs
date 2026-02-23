using System;
using System.Collections.Generic;
using SmartSofto.Commerce.Domain.Models;

namespace SmartSofto.Commerce.Api.ViewModels
{
    public class OrderViewModel
    {
        public int Id { get; set; }
        public string OrderNumber { get; set; } = string.Empty;
        public DateTime OrderDate { get; set; }
        public int ClientId { get; set; }
        public string? ClientName { get; set; }
        public int ProductId { get; set; }
        public string? ProductName { get; set; }
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal TotalAmount { get; set; }
        public OrderStatus Status { get; set; }
        public PaymentMethod PaymentMethod { get; set; }
        public InvoiceStatus InvoiceStatus { get; set; }
        public decimal AmountPaid { get; set; }
        public string? Notes { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public List<OrderItemViewModel> Items { get; set; } = new();
    }
}
