using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SmartSofto.Commerce.Domain.Models
{
    public enum ProductType
    {
        RawMaterial = 1,
        Packaging = 2,
        FinishedGood = 3,
        Other = 4
    }

    public enum Unit
    {
        Piece = 1,
        Kilogram = 2,
        Gram = 3,
        Liter = 4,
        Other = 5
    }

    public class Product
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [StringLength(100)]
        public string Name { get; set; } = string.Empty;

        [StringLength(500)]
        public string? Description { get; set; }

        [Required]
        [StringLength(50)]
        public string SKU { get; set; } = string.Empty;

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal Price { get; set; }

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal CostPrice { get; set; }

        [Required]
        public int Quantity { get; set; }

        [Required]
        [Column(TypeName = "integer")]
        public ProductType Type { get; set; } = ProductType.FinishedGood;

        [Required]
        [Column(TypeName = "integer")]
        public Unit Unit { get; set; } = Unit.Piece;

        public DateTime CreatedAt { get; set; }

        [StringLength(256)]
        public string? ImageFileName { get; set; }
        public DateTime? UpdatedAt { get; set; }

        public int TenantId { get; set; } = 1;
    }
}
