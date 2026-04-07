using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SmartSofto.Commerce.Domain.Models
{
    public enum OrderAdjustmentType
    {
        Discount = 1,
        CreditNote = 2,
        Adjustment = 3
    }

    public class OrderAdjustment
    {
        [Key]
        public long Id { get; set; }

        [Required]
        public int OrderId { get; set; }

        [ForeignKey(nameof(OrderId))]
        public Order? Order { get; set; }

        public int? InvoiceId { get; set; }

        [ForeignKey(nameof(InvoiceId))]
        public Invoice? Invoice { get; set; }

        public int TenantId { get; set; } = 1;

        [Required]
        [Column(TypeName = "integer")]
        public OrderAdjustmentType Type { get; set; } = OrderAdjustmentType.Discount;

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal Amount { get; set; }

        [Required]
        [MaxLength(200)]
        public string Reason { get; set; } = string.Empty;

        [Column(TypeName = "text")]
        public string? Note { get; set; }

        public DateTime CreatedUtc { get; set; }
    }
}
