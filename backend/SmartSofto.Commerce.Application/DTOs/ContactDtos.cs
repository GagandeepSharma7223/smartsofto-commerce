using System.ComponentModel.DataAnnotations;

namespace SmartSofto.Commerce.Application.DTOs
{
    public class ContactRequest
    {
        [Required]
        [MaxLength(200)]
        public string Name { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        [MaxLength(320)]
        public string Email { get; set; } = string.Empty;

        [MaxLength(200)]
        public string? Company { get; set; }

        [Required]
        [MaxLength(200)]
        public string ProjectType { get; set; } = string.Empty;

        [Required]
        [MaxLength(200)]
        public string ProjectStage { get; set; } = string.Empty;

        [MaxLength(200)]
        public string? Budget { get; set; }

        [MaxLength(200)]
        public string? Timeline { get; set; }

        [Required]
        [MaxLength(5000)]
        public string ProjectDetails { get; set; } = string.Empty;

        [MaxLength(500)]
        public string? Website { get; set; }
    }
}
