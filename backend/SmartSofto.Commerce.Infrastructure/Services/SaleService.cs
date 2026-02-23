using Microsoft.EntityFrameworkCore;
using SmartSofto.Commerce.Application.Interfaces;
using SmartSofto.Commerce.Domain.Models;

namespace SmartSofto.Commerce.Infrastructure.Services
{
    public class SaleService : ISaleService
    {
        private int GetTenantIdOrThrow()
        {
            return _tenantService.TenantId ?? throw new InvalidOperationException("Tenant claim missing.");
        }

        private readonly ApplicationDbContext _context;
        private readonly ICurrentTenantService _tenantService;
        private readonly IInventoryService _inventoryService;

        public SaleService(ApplicationDbContext context, ICurrentTenantService tenantService, IInventoryService inventoryService)
        {
            _context = context;
            _tenantService = tenantService;
            _inventoryService = inventoryService;
        }

        public async Task<Sale> CreateSaleAsync(Sale sale)
        {
            var tenantId = GetTenantIdOrThrow();
            sale.CreatedAt = DateTime.UtcNow;
            sale.SaleDate = DateTime.UtcNow;
            sale.PaymentStatus = "Unpaid";
            sale.RemainingAmount = sale.TotalAmount;

            sale.InvoiceNumber = $"INV-{DateTime.UtcNow:yyyyMMdd}-{await GetNextInvoiceNumberAsync():D4}";

            sale.TenantId = tenantId;
            _context.Sales.Add(sale);
            await _context.SaveChangesAsync();

            var client = await _context.Clients.FirstOrDefaultAsync(c => c.Id == sale.ClientId && c.TenantId == tenantId);
            if (client != null)
            {
                client.TotalPurchases += sale.TotalAmount;
                await _context.SaveChangesAsync();
            }

            foreach (var item in sale.SaleItems)
            {
                await _inventoryService.AdjustStock(
                    tenantId,
                    item.ProductId,
                    -(int)item.Quantity,
                    "Sale",
                    "Sale created",
                    null,
                    "Sale",
                    sale.Id.ToString());
            }

            return sale;
        }

        public async Task<Sale?> GetSaleByIdAsync(int id)
        {
            var tenantId = GetTenantIdOrThrow();
            return await _context.Sales
                .Where(s => s.TenantId == tenantId)
                .Include(s => s.Client)
                .Include(s => s.SaleItems)
                    .ThenInclude(si => si.Product)
                .FirstOrDefaultAsync(s => s.Id == id);
        }

        public async Task<Sale?> GetSaleByInvoiceNumberAsync(string invoiceNumber)
        {
            var tenantId = GetTenantIdOrThrow();
            return await _context.Sales
                .Include(s => s.Client)
                .Include(s => s.SaleItems)
                    .ThenInclude(si => si.Product)
                .FirstOrDefaultAsync(s => s.InvoiceNumber == invoiceNumber && s.TenantId == tenantId);
        }

        public async Task<IEnumerable<Sale>> GetAllSalesAsync()
        {
            var tenantId = GetTenantIdOrThrow();
            return await _context.Sales
                .Include(s => s.Client)
                .Where(s => s.TenantId == tenantId)
                .OrderByDescending(s => s.CreatedAt)
                .ToListAsync();
        }

        public async Task<IEnumerable<Sale>> GetClientSalesAsync(int clientId)
        {
            var tenantId = GetTenantIdOrThrow();
            return await _context.Sales
                .Include(s => s.SaleItems)
                .Where(s => s.ClientId == clientId && s.TenantId == tenantId)
                .OrderByDescending(s => s.CreatedAt)
                .ToListAsync();
        }

        public async Task<IEnumerable<Sale>> GetSalesByDateRangeAsync(DateTime startDate, DateTime endDate)
        {
            var tenantId = GetTenantIdOrThrow();
            return await _context.Sales
                .Include(s => s.Client)
                .Where(s => s.TenantId == tenantId && s.SaleDate >= startDate && s.SaleDate <= endDate)
                .OrderByDescending(s => s.SaleDate)
                .ToListAsync();
        }

        public async Task<Sale> UpdateSaleAsync(Sale sale)
        {
            sale.UpdatedAt = DateTime.UtcNow;
            _context.Entry(sale).State = EntityState.Modified;
            await _context.SaveChangesAsync();
            return sale;
        }

        public async Task<bool> DeleteSaleAsync(int id)
        {
            var tenantId = GetTenantIdOrThrow();
            var sale = await _context.Sales.FirstOrDefaultAsync(s => s.Id == id && s.TenantId == tenantId);
            if (sale == null)
                return false;

            _context.Sales.Remove(sale);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<Sale> ProcessPaymentAsync(int saleId, decimal amount, string paymentMethod, string? transactionReference)
        {
            var tenantId = GetTenantIdOrThrow();
            var sale = await _context.Sales.FirstOrDefaultAsync(s => s.Id == saleId && s.TenantId == tenantId);
            if (sale == null)
                throw new KeyNotFoundException("Sale not found");

            sale.PaidAmount += amount;
            sale.RemainingAmount = sale.TotalAmount - sale.PaidAmount;
            sale.PaymentMethod = paymentMethod;
            sale.TransactionReference = transactionReference;
            sale.PaymentDate = DateTime.UtcNow;
            sale.UpdatedAt = DateTime.UtcNow;

            if (sale.RemainingAmount <= 0)
            {
                sale.PaymentStatus = "Paid";
            }
            else if (sale.PaidAmount > 0)
            {
                sale.PaymentStatus = "PartiallyPaid";
            }

            await _context.SaveChangesAsync();
            return sale;
        }

        public async Task<Sale> UpdatePaymentStatusAsync(int saleId, string status)
        {
            var tenantId = GetTenantIdOrThrow();
            var sale = await _context.Sales.FirstOrDefaultAsync(s => s.Id == saleId && s.TenantId == tenantId);
            if (sale == null)
                throw new KeyNotFoundException("Sale not found");

            sale.PaymentStatus = status;
            sale.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return sale;
        }

        public async Task<IEnumerable<Sale>> GetOverdueSalesAsync()
        {
            var today = DateTime.UtcNow.Date;
            var tenantId = GetTenantIdOrThrow();
            return await _context.Sales
                .Include(s => s.Client)
                .Where(s => s.TenantId == tenantId && s.DueDate < today && s.PaymentStatus != "Paid")
                .OrderBy(s => s.DueDate)
                .ToListAsync();
        }

        public async Task<decimal> GetTotalSalesForPeriodAsync(DateTime startDate, DateTime endDate)
        {
            var tenantId = GetTenantIdOrThrow();
            return await _context.Sales
                .Where(s => s.TenantId == tenantId && s.SaleDate >= startDate && s.SaleDate <= endDate)
                .SumAsync(s => s.TotalAmount);
        }

        public async Task<decimal> GetClientTotalPurchasesAsync(int clientId)
        {
            var tenantId = GetTenantIdOrThrow();
            return await _context.Sales
                .Where(s => s.ClientId == clientId && s.TenantId == tenantId)
                .SumAsync(s => s.TotalAmount);
        }

        public async Task<Dictionary<string, decimal>> GetMonthlySalesAsync(int year)
        {
            var tenantId = GetTenantIdOrThrow();
            var sales = await _context.Sales
                .Where(s => s.TenantId == tenantId && s.SaleDate.Year == year)
                .ToListAsync();

            var months = Enumerable.Range(1, 12)
                .Select(m => new DateTime(year, m, 1).ToString("MMM"))
                .ToList();

            var monthlySales = months.ToDictionary(m => m, m => 0m);

            foreach (var sale in sales)
            {
                var month = new DateTime(sale.SaleDate.Year, sale.SaleDate.Month, 1).ToString("MMM");
                monthlySales[month] += sale.TotalAmount;
            }

            return monthlySales;
        }

        public async Task<Dictionary<string, Dictionary<string, decimal>>> GetMonthlySalesByProductAsync(int year)
        {
            var tenantId = GetTenantIdOrThrow();
            var sales = await _context.Sales
                .Include(s => s.SaleItems)
                    .ThenInclude(si => si.Product)
                .Where(s => s.TenantId == tenantId && s.SaleDate.Year == year)
                .ToListAsync();

            var months = Enumerable.Range(1, 12)
                .Select(m => new DateTime(year, m, 1).ToString("MMM"))
                .ToList();

            var productNames = sales
                .SelectMany(s => s.SaleItems.Select(si => si.Product?.Name ?? "Unknown"))
                .Distinct()
                .ToList();

            var monthlySalesByProduct = productNames
                .ToDictionary(
                    product => product,
                    product => months.ToDictionary(month => month, month => 0m)
                );

            foreach (var sale in sales)
            {
                var monthName = new DateTime(sale.SaleDate.Year, sale.SaleDate.Month, 1).ToString("MMM");
                foreach (var item in sale.SaleItems)
                {
                    var productName = item.Product?.Name ?? "Unknown";
                    monthlySalesByProduct[productName][monthName] += item.TotalPrice;
                }
            }

            return monthlySalesByProduct;
        }

        public async Task<Dictionary<string, Dictionary<string, decimal>>> GetMonthlySalesByClientAsync(int year)
        {
            var tenantId = GetTenantIdOrThrow();
            var sales = await _context.Sales
                .Include(s => s.Client)
                .Where(s => s.TenantId == tenantId && s.SaleDate.Year == year)
                .ToListAsync();

            var months = Enumerable.Range(1, 12)
                .Select(m => new DateTime(year, m, 1).ToString("MMM"))
                .ToList();

            var clientNames = sales
                .Select(s => s.Client?.Name ?? "Unknown")
                .Distinct()
                .ToList();

            var monthlySalesByClient = clientNames
                .ToDictionary(
                    client => client,
                    client => months.ToDictionary(month => month, month => 0m)
                );

            foreach (var sale in sales)
            {
                var monthName = new DateTime(sale.SaleDate.Year, sale.SaleDate.Month, 1).ToString("MMM");
                var clientName = sale.Client?.Name ?? "Unknown";

                if (!monthlySalesByClient.ContainsKey(clientName))
                {
                    monthlySalesByClient[clientName] = months.ToDictionary(month => month, month => 0m);
                }
                monthlySalesByClient[clientName][monthName] += sale.TotalAmount;
            }

            return monthlySalesByClient;
        }

        public async Task<SalesAnalysis> GetSalesAnalysisAsync(int year)
        {
            var analysis = new SalesAnalysis { Year = year };

            var tenantId = GetTenantIdOrThrow();
            var sales = await _context.Sales
                .Include(s => s.Client)
                .Include(s => s.SaleItems)
                    .ThenInclude(si => si.Product)
                .Where(s => s.TenantId == tenantId && s.SaleDate.Year == year)
                .ToListAsync();

            analysis.MonthlyTotals = await GetMonthlySalesAsync(year);
            analysis.TotalSales = analysis.MonthlyTotals.Values.Sum();
            analysis.AverageMonthlySales = analysis.TotalSales / 12;

            var bestMonth = analysis.MonthlyTotals.MaxBy(kvp => kvp.Value);
            analysis.BestSellingMonth = bestMonth.Key;
            analysis.BestSellingMonthAmount = bestMonth.Value;

            analysis.ProductSales = await GetMonthlySalesByProductAsync(year);

            var productTotals = analysis.ProductSales.ToDictionary(
                kvp => kvp.Key,
                kvp => kvp.Value.Values.Sum()
            );
            var bestProduct = productTotals.MaxBy(kvp => kvp.Value);
            analysis.BestSellingProduct = bestProduct.Key;
            analysis.BestSellingProductAmount = bestProduct.Value;

            analysis.ClientSales = await GetMonthlySalesByClientAsync(year);

            var clientTotals = analysis.ClientSales.ToDictionary(
                kvp => kvp.Key,
                kvp => kvp.Value.Values.Sum()
            );
            var topClient = clientTotals.MaxBy(kvp => kvp.Value);
            analysis.TopClient = topClient.Key;
            analysis.TopClientAmount = topClient.Value;

            var products = await _context.Products.Where(p => p.TenantId == tenantId).ToListAsync();
            foreach (var product in products)
            {
                var typeName = product.Type.ToString();
                if (!analysis.ProductCategorySales.ContainsKey(typeName))
                {
                    analysis.ProductCategorySales[typeName] = 0;
                }
                var productSales = analysis.ProductSales.GetValueOrDefault(product.Name, new Dictionary<string, decimal>());
                analysis.ProductCategorySales[typeName] += productSales.Values.Sum();
            }

            var clients = await _context.Clients.Where(c => c.TenantId == tenantId).ToListAsync();
            foreach (var client in clients)
            {
                if (!string.IsNullOrEmpty(client.ClientType))
                {
                    if (!analysis.ClientTypeSales.ContainsKey(client.ClientType))
                    {
                        analysis.ClientTypeSales[client.ClientType] = 0;
                    }
                    var clientSales = analysis.ClientSales.GetValueOrDefault(client.Name, new Dictionary<string, decimal>());
                    analysis.ClientTypeSales[client.ClientType] += clientSales.Values.Sum();
                }
            }

            foreach (var sale in sales)
            {
                if (!analysis.PaymentMethodDistribution.ContainsKey(sale.PaymentMethod))
                {
                    analysis.PaymentMethodDistribution[sale.PaymentMethod] = 0;
                }
                analysis.PaymentMethodDistribution[sale.PaymentMethod] += sale.TotalAmount;
            }

            return analysis;
        }

        private async Task<int> GetNextInvoiceNumberAsync()
        {
            var tenantId = GetTenantIdOrThrow();
            var lastInvoice = await _context.Sales
                .Where(s => s.InvoiceNumber != null && s.TenantId == tenantId)
                .OrderByDescending(s => s.Id)
                .FirstOrDefaultAsync();

            if (lastInvoice?.InvoiceNumber == null)
                return 1;

            var parts = lastInvoice.InvoiceNumber.Split('-');
            if (parts.Length != 3)
                return 1;

            if (int.TryParse(parts[2], out int lastNumber))
                return lastNumber + 1;

            return 1;
        }
    }
}
