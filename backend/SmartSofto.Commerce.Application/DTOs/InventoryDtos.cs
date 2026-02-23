namespace SmartSofto.Commerce.Application.DTOs
{
    public class InventoryItemDto
    {
        public int ProductId { get; set; }
        public string Name { get; set; } = string.Empty;
        public int Quantity { get; set; }
        public decimal Price { get; set; }
        public int Unit { get; set; }
        public bool IsActive { get; set; }
    }

    public class InventoryTransactionDto
    {
        public long Id { get; set; }
        public int ProductId { get; set; }
        public string? ProductName { get; set; }
        public int QuantityDelta { get; set; }
        public string Reason { get; set; } = string.Empty;
        public string ReferenceType { get; set; } = string.Empty;
        public string? ReferenceId { get; set; }
        public string? Note { get; set; }
        public DateTime CreatedUtc { get; set; }
        public string? CreatedByUserId { get; set; }
    }
}
