using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SmartSofto.Commerce.Domain.Models
{
    public class OrderItem
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int OrderId { get; set; }

        [ForeignKey("OrderId")]
        public Order? Order { get; set; }

        [Required]
        public int ProductId { get; set; }

        [ForeignKey("ProductId")]
        public Product? Product { get; set; }

        [Required]
        [Column(TypeName = "decimal(18,3)")]
        public decimal Quantity { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal UnitPrice { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal? DiscountAmount { get; set; }

        [MaxLength(20)]
        public string? HsnCode { get; set; }

        [Column(TypeName = "decimal(5,2)")]
        public decimal GstRate { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal TaxableAmount { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal CgstAmount { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal SgstAmount { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal IgstAmount { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal LineTotal { get; set; }

        public int TenantId { get; set; } = 1;
    }
}

