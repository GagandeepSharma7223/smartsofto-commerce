using System;
using System.ComponentModel.DataAnnotations;

namespace SmartSofto.Commerce.Domain.Models
{
    public class SellerProfile
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(200)]
        public string BusinessName { get; set; } = string.Empty;

        [Required]
        [MaxLength(20)]
        public string Gstin { get; set; } = string.Empty;

        [Required]
        [MaxLength(500)]
        public string Address { get; set; } = string.Empty;

        [Required]
        [MaxLength(200)]
        public string AccountName { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string BankName { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        public string AccountNumber { get; set; } = string.Empty;

        [Required]
        [MaxLength(20)]
        public string IfscCode { get; set; } = string.Empty;

        [Required]
        [MaxLength(200)]
        public string AuthorizedSignatory { get; set; } = string.Empty;

        [Required]
        [MaxLength(450)]
        public string AdminUserId { get; set; } = string.Empty;

        public int TenantId { get; set; } = 1;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }
    }
}
