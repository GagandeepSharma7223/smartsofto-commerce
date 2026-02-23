using System;
using System.ComponentModel.DataAnnotations;

namespace SmartSofto.Commerce.Domain.Models
{
    public class Client
    {
        public int Id { get; set; }

        [Required]
        [StringLength(100)]
        public string Name { get; set; } = string.Empty;

        [Required]
        [StringLength(50)]
        public string ReferenceName { get; set; } = string.Empty;

        [StringLength(100)]
        public string? CompanyName { get; set; }

        [StringLength(100)]
        [EmailAddress]
        public string? Email { get; set; }

        [StringLength(20)]
        [RegularExpression(@"^\+?[0-9\s()\-]+$", ErrorMessage = "Invalid phone number format")]
        public string? PhoneNumber { get; set; }

        [Required]
        [StringLength(20)]
        public string ClientType { get; set; } = "Regular"; // Regular, VIP, Wholesale, etc.

        public decimal TotalPurchases { get; set; }

        public decimal CreditLimit { get; set; }

        [StringLength(50)]
        public string? TaxIdentificationNumber { get; set; }

        [StringLength(50)]
        public string? PreferredPaymentMethod { get; set; }

        public DateTime FirstPurchaseDate { get; set; }

        public DateTime? LastPurchaseDate { get; set; }

        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }

        [StringLength(500)]
        public string? Notes { get; set; }

        public int TenantId { get; set; } = 1;

        public string? UserId { get; set; }
    }
}
