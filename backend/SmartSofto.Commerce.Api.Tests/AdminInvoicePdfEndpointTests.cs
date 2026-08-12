using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartSofto.Commerce.Api.Controllers;
using SmartSofto.Commerce.Application.DTOs;
using SmartSofto.Commerce.Application.Interfaces;
using SmartSofto.Commerce.Domain.Models;

namespace SmartSofto.Commerce.Api.Tests
{
    public class AdminInvoicePdfEndpointTests
    {
        [Fact]
        public async Task DownloadInvoicePdf_Returns_Pdf_File()
        {
            var controller = CreateController(new FakeInvoicePdfService(new InvoicePdfResult
            {
                Content = "%PDF-test"u8.ToArray(),
                InvoiceNumber = "INV0001",
                SellerProfileId = 1,
                SellerBusinessName = "Standard Paneer Gurugram",
                ContentType = "application/pdf",
                FileName = "FreshMooz-Invoice-INV0001.pdf"
            }));

            var result = await controller.DownloadInvoicePdf(1);

            var file = Assert.IsType<FileContentResult>(result);
            Assert.Equal("application/pdf", file.ContentType);
            Assert.Equal("FreshMooz-Invoice-INV0001.pdf", file.FileDownloadName);
            Assert.Equal("%PDF-test"u8.ToArray(), file.FileContents);
        }

        [Fact]
        public async Task DownloadInvoicePdf_Returns_NotFound_For_Missing_Invoice()
        {
            var controller = CreateController(new FakeInvoicePdfService(null));

            var result = await controller.DownloadInvoicePdf(999);

            Assert.IsType<NotFoundResult>(result);
        }

        [Fact]
        public async Task DownloadInvoicePdf_Returns_Conflict_For_Missing_SellerProfile()
        {
            var controller = CreateController(new FakeInvoicePdfService(null, "Seller profile is not configured for invoice PDF generation."));

            var result = await controller.DownloadInvoicePdf(1);

            var conflict = Assert.IsType<ConflictObjectResult>(result);
            Assert.Equal("Seller profile is not configured for invoice PDF generation.", conflict.Value);
        }

        [Fact]
        public void AdminController_Remains_Admin_Protected()
        {
            var authorize = typeof(AdminController)
                .GetCustomAttributes(typeof(AuthorizeAttribute), inherit: true)
                .Cast<AuthorizeAttribute>()
                .Single();

            Assert.Equal("Admin", authorize.Roles);
        }

        private static AdminController CreateController(IInvoicePdfService invoicePdfService)
        {
            return new AdminController(
                new FakeAdminService(),
                invoicePdfService,
                new FakeCurrentTenantService(),
                new FakeCurrentUserService());
        }

        private sealed class FakeInvoicePdfService : IInvoicePdfService
        {
            private readonly InvoicePdfResult? _result;
            private readonly string? _errorMessage;

            public FakeInvoicePdfService(InvoicePdfResult? result, string? errorMessage = null)
            {
                _result = result;
                _errorMessage = errorMessage;
            }

            public Task<InvoicePdfResult?> GenerateInvoicePdfAsync(int tenantId, int invoiceId)
            {
                if (_errorMessage != null)
                {
                    throw new InvalidOperationException(_errorMessage);
                }

                return Task.FromResult(_result);
            }
        }

        private sealed class FakeCurrentTenantService : ICurrentTenantService
        {
            public int? TenantId => 1;
            public bool HasTenant => true;
            public int GetTenantIdOrDefault(int defaultTenantId) => TenantId ?? defaultTenantId;
        }

        private sealed class FakeCurrentUserService : ICurrentUserService
        {
            public string? UserId => "admin-1";
            public string? UserName => "admin";
            public bool IsAuthenticated => true;
            public IReadOnlyList<string> Roles => new[] { "Admin" };
            public bool IsInRole(string role) => string.Equals(role, "Admin", StringComparison.OrdinalIgnoreCase);
        }

        private sealed class FakeAdminService : IAdminService
        {
            public Task<AdminDashboardSummaryDto> GetDashboardSummaryAsync(int tenantId) => throw new NotImplementedException();
            public Task<IReadOnlyList<AdminOrderSummaryDto>> GetOrdersAsync(int tenantId, OrderStatus? status) => throw new NotImplementedException();
            public Task<OrderStatusResult?> UpdateOrderStatusAsync(int tenantId, int id, OrderStatus newStatus, string? userId) => throw new NotImplementedException();
            public Task<IReadOnlyList<AdminInvoiceSummaryDto>> GetInvoicesAsync(int tenantId, int? orderId, string? orderNumber = null) => throw new NotImplementedException();
            public Task<AdminInvoiceCreateResultDto> CreateInvoiceAsync(int tenantId, AdminCreateInvoiceRequest request, string? userId) => throw new NotImplementedException();
            public Task<IReadOnlyList<AdminMonthlyRevenueDto>> GetMonthlyRevenueAsync(int tenantId, int year) => throw new NotImplementedException();
            public Task<AdminTotalRevenueDto> GetTotalForRangeAsync(int tenantId, DateTime startDate, DateTime endDate) => throw new NotImplementedException();
            public Task<IReadOnlyList<ClientCreditBalanceDto>> GetClientCreditBalancesAsync(int tenantId) => throw new NotImplementedException();
            public Task<ClientCreditBalanceDto> GetClientCreditBalanceAsync(int tenantId, int clientId) => throw new NotImplementedException();
            public Task<IReadOnlyList<ClientAccountTransactionDto>> GetClientCreditLedgerAsync(int tenantId, int clientId) => throw new NotImplementedException();
            public Task<ClientAccountTransactionDto> RecordAdvancePaymentAsync(int tenantId, int clientId, AdminCreateAdvancePaymentRequest request) => throw new NotImplementedException();
            public Task<IReadOnlyList<OrderAdjustmentDto>> GetOrderAdjustmentsAsync(int tenantId, int orderId) => throw new NotImplementedException();
            public Task<OrderAdjustmentDto> CreateOrderAdjustmentAsync(int tenantId, int orderId, AdminCreateOrderAdjustmentRequest request) => throw new NotImplementedException();
        }
    }
}
