using System;
using System.ComponentModel.DataAnnotations;

namespace SmartSofto.Commerce.Domain.Models
{
    public class ClientAddress
    {
        public int Id { get; set; }
        public int? ClientId { get; set; }
        public string? UserId { get; set; }
        public int TenantId { get; set; } = 1;
        public string Label { get; set; } = "Default";
        public bool IsDefault { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string AddressLine1 { get; set; } = string.Empty;
        public string? AddressLine2 { get; set; }
        public string City { get; set; } = string.Empty;
        public string State { get; set; } = string.Empty;
        public string PostalCode { get; set; } = string.Empty;
        public string? Country { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
    }
}
