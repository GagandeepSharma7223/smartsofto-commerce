using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;
using SmartSofto.Commerce.Domain.Models;

namespace SmartSofto.Commerce.Application.DTOs
{
    public class OrderLineRequest
    {
        public int ProductId { get; set; }
        public int Quantity { get; set; }
        public decimal? UnitPrice { get; set; }
        public decimal? DiscountAmount { get; set; }
    }

    public class AddressRequest
    {
        public string? Label { get; set; }
        public string? Name { get; set; }
        public string? Phone { get; set; }
        public string? Line1 { get; set; }
        public string? Line2 { get; set; }
        public string? City { get; set; }
        public string? State { get; set; }
        public string? Pincode { get; set; }
        public string? Country { get; set; }
    }

    public class AddressSnapshotDto
    {
        public string? Name { get; set; }
        public string? Phone { get; set; }
        public string? Line1 { get; set; }
        public string? Line2 { get; set; }
        public string? City { get; set; }
        public string? State { get; set; }
        public string? PostalCode { get; set; }
        public string? Country { get; set; }
    }

    public class MultiOrderRequest
    {
        public DateTime? OrderDate { get; set; }
        public int? ClientId { get; set; }
        public int? ProductId { get; set; }
        public int Quantity { get; set; }
        public PaymentMethod? PaymentMethod { get; set; }
        public string? Notes { get; set; }
        public string? CustomerName { get; set; }
        public string? Email { get; set; }
        public string? Phone { get; set; }
        public string? Address { get; set; }
        public int? ShippingAddressId { get; set; }
        public AddressRequest? ShippingAddress { get; set; }
        public AddressRequest? BillingAddress { get; set; }
        public List<OrderLineRequest>? Items { get; set; }
        public List<OrderLineRequest>? Lines { get; set; }
    }

    public class PriceCartLine
    {
        public int ProductId { get; set; }
        public int Quantity { get; set; }
        [JsonPropertyName("qty")]
        public int Qty { get => Quantity; set => Quantity = value; }
        public decimal? UnitPrice { get; set; }
        public decimal? DiscountAmount { get; set; }
    }

    public class PriceCartRequest
    {
        public List<PriceCartLine> Items { get; set; } = new();
    }

    public class OrderItemViewModel
    {
        public int Id { get; set; }
        public int ProductId { get; set; }
        public string? ProductName { get; set; }
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal DiscountAmount { get; set; }
        public decimal LineTotal { get; set; }
    }

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
        public AddressSnapshotDto? ShippingAddress { get; set; }
        public AddressSnapshotDto? BillingAddress { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public List<OrderItemViewModel> Items { get; set; } = new();
    }

    public class CartPriceViewModel
    {
        public int TotalItems { get; set; }
        public decimal Subtotal { get; set; }
        public decimal DiscountTotal { get; set; }
        public decimal Total { get; set; }
        public List<CartPriceItemViewModel> Items { get; set; } = new();
    }

    public class CartPriceItemViewModel
    {
        public int ProductId { get; set; }
        public string? ProductName { get; set; }
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal DiscountAmount { get; set; }
        public decimal LineTotal { get; set; }
    }

    public class OrderCreateItemResult
    {
        public int ProductId { get; set; }
        public string? ProductName { get; set; }
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal DiscountAmount { get; set; }
        public decimal LineTotal { get; set; }
    }

    public class OrderCreateResult
    {
        public int Id { get; set; }
        public string OrderNumber { get; set; } = string.Empty;
        public int ClientId { get; set; }
        public string? ClientName { get; set; }
        public int ProductId { get; set; }
        public string? ProductName { get; set; }
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal TotalAmount { get; set; }
        public OrderStatus Status { get; set; }
        public string? Notes { get; set; }
        public PaymentMethod PaymentMethod { get; set; }
        public int InvoiceId { get; set; }
        public string InvoiceNumber { get; set; } = string.Empty;
        public InvoiceStatus InvoiceStatus { get; set; }
        public DateTime CreatedAt { get; set; }
        public List<OrderCreateItemResult> Items { get; set; } = new();
        public decimal AmountPaid { get; set; }
    }

    public class OrderStatusResult
    {
        [JsonPropertyName("id")]
        public int Id { get; set; }

        [JsonPropertyName("orderNumber")]
        public string OrderNumber { get; set; } = string.Empty;

        [JsonPropertyName("status")]
        public OrderStatus Status { get; set; }

        [JsonPropertyName("updatedAt")]
        public DateTime? UpdatedAt { get; set; }
    }
}



