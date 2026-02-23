using System.Collections.Generic;

namespace SmartSofto.Commerce.Domain.Models
{
    public class SalesAnalysis
    {
        public int Year { get; set; }
        public decimal TotalSales { get; set; }
        public decimal AverageMonthlySales { get; set; }
        public string? BestSellingMonth { get; set; }
        public decimal BestSellingMonthAmount { get; set; }
        public string? BestSellingProduct { get; set; }
        public decimal BestSellingProductAmount { get; set; }
        public string? TopClient { get; set; }
        public decimal TopClientAmount { get; set; }
        public Dictionary<string, decimal> MonthlyTotals { get; set; } = new();
        public Dictionary<string, Dictionary<string, decimal>> ProductSales { get; set; } = new();
        public Dictionary<string, Dictionary<string, decimal>> ClientSales { get; set; } = new();
        public Dictionary<string, decimal> ProductCategorySales { get; set; } = new();
        public Dictionary<string, decimal> ClientTypeSales { get; set; } = new();
        public Dictionary<string, decimal> PaymentMethodDistribution { get; set; } = new();
    }
}
