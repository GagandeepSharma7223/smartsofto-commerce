using System;
using System.Collections.Generic;
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
        public decimal Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal TotalAmount { get; set; }
        public decimal AdjustmentTotal { get; set; }
        public decimal AdjustedTotalAmount { get; set; }
        public int AdjustmentCount { get; set; }
        public OrderStatus Status { get; set; }
        public PaymentMethod PaymentMethod { get; set; }
        public InvoiceStatus InvoiceStatus { get; set; }
        public decimal AmountPaid { get; set; }
        public decimal AppliedCreditAmount { get; set; }
        public decimal SettledAmount { get; set; }
        public DateTime OrderDate { get; set; }
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
        public DateTime InvoiceDate { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public decimal? OrderTotalAmount { get; set; }
        public decimal? OrderAdjustmentTotal { get; set; }
        public decimal? OrderAdjustedTotalAmount { get; set; }
        public int? OrderAdjustmentCount { get; set; }
        public decimal? OrderAmountPaid { get; set; }
        public decimal? OrderAppliedCreditAmount { get; set; }
        public decimal? OrderSettledAmount { get; set; }
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
        public DateTime InvoiceDate { get; set; }
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

    public class ClientCreditBalanceDto
    {
        public int ClientId { get; set; }
        public string? ClientName { get; set; }
        public decimal AvailableCredit { get; set; }
    }

    public class ClientAccountTransactionDto
    {
        public long Id { get; set; }
        public int ClientId { get; set; }
        public int TenantId { get; set; }
        public ClientAccountTransactionType Type { get; set; }
        public decimal Amount { get; set; }
        public PaymentMethod? PaymentMethod { get; set; }
        public string ReferenceType { get; set; } = string.Empty;
        public string? ReferenceId { get; set; }
        public string? ReferenceNumber { get; set; }
        public string? Note { get; set; }
        public DateTime EffectiveDate { get; set; }
        public DateTime CreatedUtc { get; set; }
    }

    public class AdminCreateAdvancePaymentRequest
    {
        public decimal Amount { get; set; }
        public PaymentMethod PaymentMethod { get; set; }
        public string? ReferenceNumber { get; set; }
        public string? Note { get; set; }
        public DateTime? EffectiveDate { get; set; }
    }

    public class OrderAdjustmentDto
    {
        public long Id { get; set; }
        public int OrderId { get; set; }
        public int? InvoiceId { get; set; }
        public string? InvoiceNumber { get; set; }
        public int TenantId { get; set; }
        public OrderAdjustmentType Type { get; set; }
        public decimal Amount { get; set; }
        public string Reason { get; set; } = string.Empty;
        public string? Note { get; set; }
        public DateTime CreatedUtc { get; set; }
    }

    public class AdminCreateOrderAdjustmentRequest
    {
        public OrderAdjustmentType Type { get; set; } = OrderAdjustmentType.Discount;
        public decimal Amount { get; set; }
        public string Reason { get; set; } = string.Empty;
        public string? Note { get; set; }
    }
}
