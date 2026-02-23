using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SmartSofto.Commerce.Domain.Models
{
    public class InventoryTransaction
    {
        [Key]
        public long Id { get; set; }

        public int TenantId { get; set; } = 1;

        [Required]
        public int ProductId { get; set; }

        [ForeignKey("ProductId")]
        public Product? Product { get; set; }

        [Required]
        public int QuantityDelta { get; set; }

        [Required]
        [MaxLength(50)]
        public string Reason { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        public string ReferenceType { get; set; } = string.Empty;

        [MaxLength(100)]
        public string? ReferenceId { get; set; }

        [Column(TypeName = "text")]
        public string? Note { get; set; }

        public DateTime CreatedUtc { get; set; }

        [MaxLength(450)]
        public string? CreatedByUserId { get; set; }
    }
}
