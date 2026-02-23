using System;
using System.Text.Json.Serialization;
using SmartSofto.Commerce.Domain.Models;

namespace SmartSofto.Commerce.Application.DTOs
{
    public class AdminDashboardSummaryDto
    {
        [JsonPropertyName("productsCount")]
        public int ProductsCount { get; set; }

        [JsonPropertyName("ordersCount")]
        public int OrdersCount { get; set; }

        [JsonPropertyName("revenue7d")]
        public decimal Revenue7d { get; set; }

        [JsonPropertyName("revenue30d")]
        public decimal Revenue30d { get; set; }

        [JsonPropertyName("unpaidInvoices")]
        public int UnpaidInvoices { get; set; }

        [JsonPropertyName("partiallyPaidInvoices")]
        public int PartiallyPaidInvoices { get; set; }
    }

    public class AdminOrderSummaryDto
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
        public PaymentMethod PaymentMethod { get; set; }
        public InvoiceStatus InvoiceStatus { get; set; }
        public decimal AmountPaid { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public decimal RemainingAmount { get; set; }
    }

    public class AdminInvoiceSummaryDto
    {
        public int Id { get; set; }
        public string InvoiceNumber { get; set; } = string.Empty;
        public int OrderId { get; set; }
        public string? OrderNumber { get; set; }
        public string? ClientName { get; set; }
        public decimal Amount { get; set; }
        public PaymentMethod PaymentMethod { get; set; }
        public string? ReferenceNumber { get; set; }
        public InvoiceStatus Status { get; set; }
        public string? Notes { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public decimal? OrderTotalAmount { get; set; }
        public decimal? OrderAmountPaid { get; set; }
        public InvoiceStatus? OrderInvoiceStatus { get; set; }
    }

    public class AdminCreateInvoiceRequest
    {
        public int OrderId { get; set; }
        public decimal Amount { get; set; }
        public PaymentMethod PaymentMethod { get; set; }
        public string? ReferenceNumber { get; set; }
        public string? Notes { get; set; }
    }

    public class AdminInvoiceCreateResultDto
    {
        public int Id { get; set; }
        public string InvoiceNumber { get; set; } = string.Empty;
        public int OrderId { get; set; }
        public decimal Amount { get; set; }
        public PaymentMethod PaymentMethod { get; set; }
        public InvoiceStatus Status { get; set; }
        public string? ReferenceNumber { get; set; }
        public string? Notes { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class AdminMonthlyRevenueDto
    {
        [JsonPropertyName("month")]
        public int Month { get; set; }

        [JsonPropertyName("total")]
        public decimal Total { get; set; }
    }

    public class AdminTotalRevenueDto
    {
        [JsonPropertyName("total")]
        public decimal Total { get; set; }
    }
}
