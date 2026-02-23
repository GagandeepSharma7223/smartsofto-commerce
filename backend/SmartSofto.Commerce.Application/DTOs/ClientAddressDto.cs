namespace SmartSofto.Commerce.Application.DTOs
{
    public class ClientAddressDto
    {
        public int Id { get; set; }
        public int? ClientId { get; set; }
        public string? Label { get; set; }
        public bool IsDefault { get; set; }
        public string? Name { get; set; }
        public string? Phone { get; set; }
        public string AddressLine1 { get; set; } = string.Empty;
        public string? AddressLine2 { get; set; }
        public string City { get; set; } = string.Empty;
        public string State { get; set; } = string.Empty;
        public string PostalCode { get; set; } = string.Empty;
        public string? Country { get; set; }
    }
}
