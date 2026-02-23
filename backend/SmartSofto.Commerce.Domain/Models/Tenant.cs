using System.ComponentModel.DataAnnotations;

namespace SmartSofto.Commerce.Domain.Models
{
    public class Tenant
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(100)]
        public string Code { get; set; } = string.Empty;

        [Required]
        [MaxLength(200)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(200)]
        public string? PrimaryDomain { get; set; }

        public string? SettingsJson { get; set; }

        public bool IsActive { get; set; } = true;
    }
}
