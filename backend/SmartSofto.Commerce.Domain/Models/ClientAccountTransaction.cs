using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SmartSofto.Commerce.Domain.Models
{
    public enum ClientAccountTransactionType
    {
        AdvanceReceived = 1,
        CreditApplied = 2,
        Refund = 3,
        Adjustment = 4,
        CreditRestored = 5,
        RefundToCredit = 6
    }

    public class ClientAccountTransaction
    {
        [Key]
        public long Id { get; set; }

        [Required]
        public int ClientId { get; set; }

        [ForeignKey("ClientId")]
        public Client? Client { get; set; }

        public int TenantId { get; set; } = 1;

        [Required]
        [Column(TypeName = "integer")]
        public ClientAccountTransactionType Type { get; set; }

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal Amount { get; set; }

        [Column(TypeName = "integer")]
        public PaymentMethod? PaymentMethod { get; set; }

        [MaxLength(50)]
        public string ReferenceType { get; set; } = string.Empty;

        [MaxLength(100)]
        public string? ReferenceId { get; set; }

        [MaxLength(100)]
        public string? ReferenceNumber { get; set; }

        [Column(TypeName = "text")]
        public string? Note { get; set; }

        [Column(TypeName = "date")]
        public DateTime EffectiveDate { get; set; }

        public DateTime CreatedUtc { get; set; }
    }
}
