using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartSofto.Commerce.Application.Interfaces;
using SmartSofto.Commerce.Domain.Models;

namespace SmartSofto.Commerce.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class SalesController : ControllerBase
    {
        // TODO: Integrate InventoryService for stock adjustments when sales workflows are finalized.
        private readonly ISaleService _saleService;

        public SalesController(ISaleService saleService)
        {
            _saleService = saleService;
        }

        // GET: api/Sales
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Sale>>> GetSales()
        {
            var sales = await _saleService.GetAllSalesAsync();
            return Ok(sales);
        }

        // GET: api/Sales/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Sale>> GetSale(int id)
        {
            var sale = await _saleService.GetSaleByIdAsync(id);
            if (sale == null)
                return NotFound();

            return Ok(sale);
        }

        // GET: api/Sales/invoice/INV-20240422-0001
        [HttpGet("invoice/{invoiceNumber}")]
        public async Task<ActionResult<Sale>> GetSaleByInvoiceNumber(string invoiceNumber)
        {
            var sale = await _saleService.GetSaleByInvoiceNumberAsync(invoiceNumber);
            if (sale == null)
                return NotFound();

            return Ok(sale);
        }

        // GET: api/Sales/client/5
        [HttpGet("client/{clientId}")]
        public async Task<ActionResult<IEnumerable<Sale>>> GetClientSales(int clientId)
        {
            var sales = await _saleService.GetClientSalesAsync(clientId);
            return Ok(sales);
        }

        // GET: api/Sales/daterange?startDate=2024-04-01&endDate=2024-04-30
        [HttpGet("daterange")]
        public async Task<ActionResult<IEnumerable<Sale>>> GetSalesByDateRange(
            [FromQuery] DateTime startDate,
            [FromQuery] DateTime endDate)
        {
            var sales = await _saleService.GetSalesByDateRangeAsync(startDate, endDate);
            return Ok(sales);
        }

        // POST: api/Sales
        [HttpPost]
        public async Task<ActionResult<Sale>> CreateSale(Sale sale)
        {
            try
            {
                var createdSale = await _saleService.CreateSaleAsync(sale);
                return CreatedAtAction(nameof(GetSale), new { id = createdSale.Id }, createdSale);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        // PUT: api/Sales/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateSale(int id, Sale sale)
        {
            if (id != sale.Id)
                return BadRequest();

            try
            {
                await _saleService.UpdateSaleAsync(sale);
                return NoContent();
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        // DELETE: api/Sales/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteSale(int id)
        {
            var result = await _saleService.DeleteSaleAsync(id);
            if (!result)
                return NotFound();

            return NoContent();
        }

        // POST: api/Sales/5/payment
        [HttpPost("{id}/payment")]
        public async Task<ActionResult<Sale>> ProcessPayment(
            int id,
            [FromBody] PaymentRequest payment)
        {
            try
            {
                var updatedSale = await _saleService.ProcessPaymentAsync(
                    id,
                    payment.Amount,
                    payment.PaymentMethod,
                    payment.TransactionReference);

                return Ok(updatedSale);
            }
            catch (KeyNotFoundException)
            {
                return NotFound();
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        // PUT: api/Sales/5/status
        [HttpPut("{id}/status")]
        public async Task<ActionResult<Sale>> UpdatePaymentStatus(
            int id,
            [FromBody] StatusUpdateRequest request)
        {
            try
            {
                var updatedSale = await _saleService.UpdatePaymentStatusAsync(id, request.Status);
                return Ok(updatedSale);
            }
            catch (KeyNotFoundException)
            {
                return NotFound();
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        // GET: api/Sales/overdue
        [HttpGet("overdue")]
        public async Task<ActionResult<IEnumerable<Sale>>> GetOverdueSales()
        {
            var sales = await _saleService.GetOverdueSalesAsync();
            return Ok(sales);
        }

        // GET: api/Sales/total?startDate=2024-04-01&endDate=2024-04-30
        [HttpGet("total")]
        public async Task<ActionResult<decimal>> GetTotalSales(
            [FromQuery] DateTime startDate,
            [FromQuery] DateTime endDate)
        {
            var total = await _saleService.GetTotalSalesForPeriodAsync(startDate, endDate);
            return Ok(total);
        }

        // GET: api/Sales/client/5/total
        [HttpGet("client/{clientId}/total")]
        public async Task<ActionResult<decimal>> GetClientTotalPurchases(int clientId)
        {
            var total = await _saleService.GetClientTotalPurchasesAsync(clientId);
            return Ok(total);
        }

        [HttpGet("monthly/{year}")]
        public async Task<ActionResult<Dictionary<string, decimal>>> GetMonthlySales(int year)
        {
            var monthlySales = await _saleService.GetMonthlySalesAsync(year);
            return Ok(monthlySales);
        }

        [HttpGet("monthly/{year}/by-product")]
        public async Task<ActionResult<Dictionary<string, Dictionary<string, decimal>>>> GetMonthlySalesByProduct(int year)
        {
            var monthlySales = await _saleService.GetMonthlySalesByProductAsync(year);
            return Ok(monthlySales);
        }

        [HttpGet("monthly/{year}/by-client")]
        public async Task<ActionResult<Dictionary<string, Dictionary<string, decimal>>>> GetMonthlySalesByClient(int year)
        {
            var monthlySales = await _saleService.GetMonthlySalesByClientAsync(year);
            return Ok(monthlySales);
        }

        [HttpGet("analysis/{year}")]
        public async Task<ActionResult<SalesAnalysis>> GetSalesAnalysis(int year)
        {
            var analysis = await _saleService.GetSalesAnalysisAsync(year);
            return Ok(analysis);
        }
    }

    public class PaymentRequest
    {
        public decimal Amount { get; set; }
        public string PaymentMethod { get; set; } = "Cash";
        public string? TransactionReference { get; set; }
    }

    public class StatusUpdateRequest
    {
        public string Status { get; set; } = string.Empty;
    }
}
