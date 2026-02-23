using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SmartSofto.Commerce.Domain.Models
{
    public class Invoice
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string InvoiceNumber { get; set; } = string.Empty;

        [Required]
        public int OrderId { get; set; }

        [ForeignKey("OrderId")]
        public Order? Order { get; set; }

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal Amount { get; set; }

        [Required]
        [Column(TypeName = "integer")]
        public PaymentMethod PaymentMethod { get; set; }

        public string? ReferenceNumber { get; set; }

        public string? Notes { get; set; }

        [Required]
        [Column(TypeName = "integer")]
        public InvoiceStatus Status { get; set; } = InvoiceStatus.Unpaid;

        public DateTime CreatedAt { get; set; }

        public DateTime CreatedUtc { get; set; }

        public DateTime? UpdatedAt { get; set; }

        [NotMapped]
        public string? OrderNumber { get; set; }

        [NotMapped]
        public string? ClientName { get; set; }

        public int TenantId { get; set; } = 1;
    }
}
