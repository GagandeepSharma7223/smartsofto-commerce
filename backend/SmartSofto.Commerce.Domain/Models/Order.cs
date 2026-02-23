using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SmartSofto.Commerce.Domain.Models
{
    public enum PaymentMethod
    {
        Cash = 1,
        UPI = 2,
        Cheque = 3
    }

    public enum InvoiceStatus
    {
        Unpaid = 1,
        Paid = 2,
        PartiallyPaid = 3
    }

    public enum OrderStatus
    {
        Pending = 1,
        Delivered = 2,
        Cancelled = 3
    }

    public class Order
    {
        [Key]
        public int Id { get; set; }

        public string OrderNumber { get; set; } = string.Empty;

        [Required]
        public DateTime OrderDate { get; set; }

        [Required]
        public int ClientId { get; set; }

        [ForeignKey("ClientId")]
        public Client? Client { get; set; }

        [Required]
        public int ProductId { get; set; }

        [ForeignKey("ProductId")]
        public Product? Product { get; set; }

        [Required]
        public int Quantity { get; set; }

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal UnitPrice { get; set; }

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal TotalAmount { get; set; }

        [Required]
        [Column(TypeName = "integer")]
        public OrderStatus Status { get; set; } = OrderStatus.Pending;

        public string? Notes { get; set; }

        [Required]
        public PaymentMethod PaymentMethod { get; set; }

        [Required]
        public InvoiceStatus InvoiceStatus { get; set; } = InvoiceStatus.Unpaid;

        [Column(TypeName = "decimal(18,2)")]
        public decimal AmountPaid { get; set; }

        public string? ShippingName { get; set; }
        public string? ShippingPhone { get; set; }
        public string? ShippingAddressLine1 { get; set; }
        public string? ShippingAddressLine2 { get; set; }
        public string? ShippingCity { get; set; }
        public string? ShippingState { get; set; }
        public string? ShippingPostalCode { get; set; }
        public string? ShippingCountry { get; set; }


        public ICollection<OrderItem> Items { get; set; } = new List<OrderItem>();

        public int TenantId { get; set; } = 1;

        public DateTime CreatedAt { get; set; }

        public DateTime? UpdatedAt { get; set; }

        [NotMapped]
        public string? ClientName { get; set; }

        [NotMapped]
        public string? ProductName { get; set; }

        [NotMapped]
        public decimal RemainingAmount => TotalAmount - AmountPaid;
    }
}
