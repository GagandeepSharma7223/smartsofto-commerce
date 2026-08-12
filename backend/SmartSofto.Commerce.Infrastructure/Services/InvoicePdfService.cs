using Microsoft.EntityFrameworkCore;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using SmartSofto.Commerce.Application.Interfaces;
using SmartSofto.Commerce.Domain.Models;

namespace SmartSofto.Commerce.Infrastructure.Services
{
    public class InvoicePdfService : IInvoicePdfService
    {
        private const string BrandGreen = "#2F6B3F";
        private const string PaleGreen = "#EDF6E9";
        private const string BorderColor = "#1F2937";
        private const string UpiQrAssetRelativePath = "Assets/standard-paneer-upi-qr.jpeg";
        private readonly ApplicationDbContext _context;

        public InvoicePdfService(ApplicationDbContext context)
        {
            _context = context;
            QuestPDF.Settings.License = LicenseType.Community;
        }

        public async Task<InvoicePdfResult?> GenerateInvoicePdfAsync(int tenantId, int invoiceId)
        {
            var invoice = await _context.Invoices
                .AsNoTracking()
                .Where(i => i.TenantId == tenantId && i.Id == invoiceId)
                .Include(i => i.SellerProfile)
                .Include(i => i.Order)
                    .ThenInclude(o => o!.Client)
                .Include(i => i.Order)
                    .ThenInclude(o => o!.Product)
                .Include(i => i.Order)
                    .ThenInclude(o => o!.Items)
                        .ThenInclude(item => item.Product)
                .FirstOrDefaultAsync();

            if (invoice?.Order == null)
            {
                return null;
            }

            var sellerProfile = invoice.SellerProfile ?? await _context.SellerProfiles
                .AsNoTracking()
                .Where(profile => profile.TenantId == tenantId)
                .OrderBy(profile => profile.Id)
                .FirstOrDefaultAsync();

            if (sellerProfile == null)
            {
                throw new InvalidOperationException("Seller profile is not configured for invoice PDF generation.");
            }

            var rows = BuildRows(invoice.Order);
            var pdf = Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Size(PageSizes.A4);
                    page.Margin(24);
                    page.DefaultTextStyle(text => text.FontSize(9).FontColor(Colors.Grey.Darken4));

                    page.Header().Element(header => ComposeHeader(header, invoice, sellerProfile));
                    page.Content().Element(content => ComposeContent(content, invoice, sellerProfile, rows));
                    page.Footer().AlignCenter().Text(text =>
                    {
                        text.Span("Page ");
                        text.CurrentPageNumber();
                        text.Span(" of ");
                        text.TotalPages();
                    });
                });
            }).GeneratePdf();

            return new InvoicePdfResult
            {
                Content = pdf,
                InvoiceNumber = invoice.InvoiceNumber,
                SellerProfileId = sellerProfile.Id,
                SellerBusinessName = sellerProfile.BusinessName,
                FileName = $"FreshMooz-Invoice-{SafeFileName(invoice.InvoiceNumber)}.pdf"
            };
        }

        private static IReadOnlyList<InvoicePdfLine> BuildRows(Order order)
        {
            if (order.Items.Count > 0)
            {
                return order.Items
                    .OrderBy(item => item.Id)
                    .Select(item =>
                    {
                        var gross = item.UnitPrice * item.Quantity;
                        var discount = item.DiscountAmount ?? 0m;
                        return new InvoicePdfLine(
                            item.Product?.Name ?? $"Product #{item.ProductId}",
                            item.Product?.HsnCode,
                            item.Product?.GstRate ?? 0m,
                            item.Quantity,
                            item.Product?.Unit.ToString(),
                            item.UnitPrice,
                            Math.Max(gross - discount, 0m));
                    })
                    .ToList();
            }

            return new[]
            {
                new InvoicePdfLine(
                    order.Product?.Name ?? order.ProductName ?? $"Product #{order.ProductId}",
                    order.Product?.HsnCode,
                    order.Product?.GstRate ?? 0m,
                    order.Quantity,
                    order.Product?.Unit.ToString(),
                    order.UnitPrice,
                    order.TotalAmount)
            };
        }

        private static void ComposeHeader(IContainer container, Invoice invoice, SellerProfile sellerProfile)
        {
            container.Column(column =>
            {
                column.Item().AlignRight().Text("Original Copy").FontSize(9).SemiBold();
                column.Item().Border(1).BorderColor(BorderColor).Background(PaleGreen).Padding(10).Row(row =>
                {
                    row.RelativeItem().Column(left =>
                    {
                        left.Item().Text(sellerProfile.BusinessName).FontSize(20).Bold().FontColor(BrandGreen);
                        ComposeWrappedText(left, sellerProfile.Address, 8);
                        left.Item().Text($"Seller GSTIN: {FormatOptional(sellerProfile.Gstin)}").FontSize(8);
                    });

                    row.ConstantItem(170).Column(right =>
                    {
                        right.Item().Text("TAX INVOICE").FontSize(15).Bold().FontColor(BrandGreen);
                        right.Item().Text($"Invoice #: {invoice.InvoiceNumber}").FontSize(9).SemiBold();
                        right.Item().Text($"Invoice Date: {invoice.InvoiceDate:dd MMM yyyy}").FontSize(9);
                        right.Item().Text($"Order #: {invoice.Order?.OrderNumber ?? invoice.OrderId.ToString()}").FontSize(9);
                    });
                });
            });
        }

        private static void ComposeContent(IContainer container, Invoice invoice, SellerProfile sellerProfile, IReadOnlyList<InvoicePdfLine> rows)
        {
            var order = invoice.Order!;
            container.PaddingTop(8).Column(column =>
            {
                column.Spacing(8);
                column.Item().Row(row =>
                {
                    row.RelativeItem().Element(section => ComposeSellerBlock(section, sellerProfile));
                    row.ConstantItem(8);
                    row.RelativeItem().Element(section => ComposeBuyerBlock(section, invoice, order));
                });

                column.Item().Element(section => ComposeItemsTable(section, rows));
                column.Item().ExtendVertical().AlignBottom().Element(section => ComposeInvoiceBottomBlock(section, invoice, order, sellerProfile, rows));
            });
        }

        private static void ComposeSellerBlock(IContainer container, SellerProfile sellerProfile)
        {
            container.Border(1).BorderColor(BorderColor).Padding(8).Column(column =>
            {
                column.Item().Text("Seller").FontSize(8).Bold().FontColor(BrandGreen);
                column.Item().Text(sellerProfile.BusinessName).FontSize(11).Bold();
                ComposeWrappedText(column, sellerProfile.Address, 9);
                column.Item().Text($"GSTIN: {FormatOptional(sellerProfile.Gstin)}");
            });
        }

        private static void ComposeBuyerBlock(IContainer container, Invoice invoice, Order order)
        {
            var client = order.Client;
            var address = FormatAddress(order);
            var buyerDetails = ResolveBuyerDetails(invoice, order);
            container.Border(1).BorderColor(BorderColor).Padding(8).Column(column =>
            {
                column.Item().Text("Buyer").FontSize(8).Bold().FontColor(BrandGreen);
                column.Item().Text(buyerDetails.Name).FontSize(11).Bold();
                if (!string.IsNullOrWhiteSpace(order.ShippingPhone ?? client?.PhoneNumber))
                {
                    column.Item().Text($"Phone: {order.ShippingPhone ?? client?.PhoneNumber}");
                }
                if (!string.IsNullOrWhiteSpace(client?.Email))
                {
                    column.Item().Text($"Email: {client.Email}");
                }
                column.Item().Text(string.IsNullOrWhiteSpace(address) ? "Address: Not available" : address);
                if (!string.IsNullOrWhiteSpace(buyerDetails.Gstin))
                {
                    column.Item().Text($"GSTIN: {buyerDetails.Gstin}");
                }
            });
        }

        internal static InvoiceBuyerDetails ResolveBuyerDetails(Invoice invoice, Order order)
        {
            var snapshotName = string.IsNullOrWhiteSpace(invoice.BuyerBusinessName) ? null : invoice.BuyerBusinessName.Trim();
            var snapshotGstin = string.IsNullOrWhiteSpace(invoice.BuyerGstin) ? null : invoice.BuyerGstin.Trim();

            return new InvoiceBuyerDetails(
                snapshotName ?? order.Client?.CompanyName ?? order.Client?.Name ?? order.ShippingName ?? "Customer",
                snapshotGstin);
        }

        private static void ComposeItemsTable(IContainer container, IReadOnlyList<InvoicePdfLine> rows)
        {
            var hasGstApplicableLines = HasGstApplicableLines(rows);
            var hasHsnLines = HasHsnLines(rows);
            container.Border(1).BorderColor(BorderColor).Table(table =>
            {
                table.ColumnsDefinition(columns =>
                {
                    columns.ConstantColumn(24);
                    columns.RelativeColumn(GetDescriptionColumnWidth(hasGstApplicableLines, hasHsnLines));
                    if (hasHsnLines)
                    {
                        columns.ConstantColumn(44);
                    }
                    columns.ConstantColumn(44);
                    columns.ConstantColumn(42);
                    columns.ConstantColumn(54);
                    if (hasGstApplicableLines)
                    {
                        columns.ConstantColumn(54);
                        columns.ConstantColumn(40);
                        columns.ConstantColumn(40);
                        columns.ConstantColumn(40);
                    }
                    columns.ConstantColumn(58);
                });

                table.Header(header =>
                {
                    HeaderCell(header.Cell(), "#");
                    HeaderCell(header.Cell(), "Description");
                    if (hasHsnLines)
                    {
                        HeaderCell(header.Cell(), "HSN");
                    }
                    HeaderCell(header.Cell(), "Qty");
                    HeaderCell(header.Cell(), "Unit");
                    HeaderCell(header.Cell(), "Rate");
                    if (hasGstApplicableLines)
                    {
                        HeaderCell(header.Cell(), "Taxable");
                        HeaderCell(header.Cell(), "CGST");
                        HeaderCell(header.Cell(), "SGST");
                        HeaderCell(header.Cell(), "IGST");
                    }
                    HeaderCell(header.Cell(), "Total");
                });

                for (var i = 0; i < rows.Count; i++)
                {
                    var line = rows[i];
                    BodyCell(table.Cell(), (i + 1).ToString());
                    BodyCell(table.Cell(), line.Description);
                    if (hasHsnLines)
                    {
                        BodyCell(table.Cell(), string.IsNullOrWhiteSpace(line.HsnCode) ? "-" : line.HsnCode);
                    }
                    BodyCell(table.Cell(), FormatQuantity(line.Quantity));
                    BodyCell(table.Cell(), line.Unit ?? "-");
                    BodyCell(table.Cell(), FormatMoney(line.UnitPrice));
                    if (hasGstApplicableLines)
                    {
                        if (line.GstRate > 0)
                        {
                            BodyCell(table.Cell(), "-");
                            BodyCell(table.Cell(), "-");
                            BodyCell(table.Cell(), "-");
                            BodyCell(table.Cell(), "-");
                        }
                        else
                        {
                            BodyCell(table.Cell(), "Nil");
                            BodyCell(table.Cell(), "0");
                            BodyCell(table.Cell(), "0");
                            BodyCell(table.Cell(), "0");
                        }
                    }
                    BodyCell(table.Cell(), FormatMoney(line.Total));
                }
            });
        }

        private static void ComposePaymentFooterBlock(IContainer container, Invoice invoice, Order order, SellerProfile sellerProfile)
        {
            container.PaddingTop(8).Border(1).BorderColor(BorderColor).Padding(8).Column(column =>
            {
                column.Item().Row(row =>
                {
                    row.RelativeItem().Column(left =>
                    {
                        left.Item().Text("Payment Details").FontSize(10).Bold().FontColor(BrandGreen);
                        left.Item().Text($"Payment Status: {invoice.Status}");
                        left.Item().Text($"Payment Method: {invoice.PaymentMethod}");
                        if (!string.IsNullOrWhiteSpace(invoice.ReferenceNumber))
                        {
                            left.Item().Text($"Reference: {invoice.ReferenceNumber}");
                        }
                        left.Item().Text($"Recorded Amount: {FormatMoney(invoice.Amount)}");

                        left.Item().PaddingTop(6).Text("Bank Details").FontSize(9).Bold().FontColor(BrandGreen);
                        left.Item().Text($"Account Name: {FormatOptional(sellerProfile.AccountName)}");
                        left.Item().Text($"Bank: {FormatOptional(sellerProfile.BankName)}");
                        left.Item().Text($"Account Number: {FormatOptional(sellerProfile.AccountNumber)}");
                        left.Item().Text($"IFSC: {FormatOptional(sellerProfile.IfscCode)}");
                    });

                    var upiQr = LoadUpiQrCode();
                    if (ShouldShowUpiQr(invoice, order) && upiQr.Length > 0)
                    {
                        row.ConstantItem(112).AlignTop().Column(right =>
                        {
                            right.Item().AlignCenter().Text("For UPI Payment").FontSize(8).SemiBold().FontColor(BrandGreen);
                            right.Item().PaddingTop(4).Width(96).Height(96).AlignCenter().Image(upiQr).FitArea();
                        });
                    }
                });

                column.Item().PaddingTop(8).LineHorizontal(1).LineColor(Colors.Grey.Lighten1);
                if (!string.IsNullOrWhiteSpace(invoice.Notes))
                {
                    column.Item().PaddingTop(6).Text("Notes").FontSize(9).Bold().FontColor(BrandGreen);
                    column.Item().Text(invoice.Notes);
                }
                column.Item().PaddingTop(12).AlignRight().Width(160).AlignCenter().Text(FormatOptional(sellerProfile.AuthorizedSignatory, "Authorized Signatory")).FontSize(9).SemiBold();
            });
        }

        private static void ComposeInvoiceBottomBlock(IContainer container, Invoice invoice, Order order, SellerProfile sellerProfile, IReadOnlyList<InvoicePdfLine> rows)
        {
            container.Column(column =>
            {
                column.Spacing(0);
                column.Item().Element(section => ComposeTotalsBlock(section, order, HasGstApplicableLines(rows)));
                column.Item().Element(section => ComposePaymentFooterBlock(section, invoice, order, sellerProfile));
            });
        }

        private static void ComposeTotalsBlock(IContainer container, Order order, bool hasGstApplicableLines)
        {
            container.Border(1).BorderColor(BorderColor).Padding(8).Column(column =>
            {
                column.Item().Text("Tax Summary").FontSize(10).Bold().FontColor(BrandGreen);
                if (hasGstApplicableLines)
                {
                    TotalRow(column, "Total Amount Before Tax", "-");
                    TotalRow(column, "CGST", "-");
                    TotalRow(column, "SGST", "-");
                    TotalRow(column, "IGST", "-");
                    column.Item().PaddingTop(4).LineHorizontal(1).LineColor(Colors.Grey.Lighten1);
                }
                TotalRow(column, "Total Payable Amount", FormatMoney(order.TotalAmount), true);
            });
        }

        private static void HeaderCell(IContainer container, string text)
        {
            container.Background(PaleGreen).BorderRight(1).BorderBottom(1).BorderColor(BorderColor).PaddingVertical(5).PaddingHorizontal(4).Text(text).FontSize(8).Bold();
        }

        private static void BodyCell(IContainer container, string text)
        {
            container.BorderRight(1).BorderBottom(1).BorderColor(BorderColor).PaddingVertical(5).PaddingHorizontal(4).Text(text).FontSize(8);
        }

        private static void TotalRow(ColumnDescriptor column, string label, string value, bool bold = false)
        {
            column.Item().Row(row =>
            {
                row.RelativeItem().Text(label).FontSize(8);
                var text = row.ConstantItem(90).AlignRight().Text(value).FontSize(8);
                if (bold)
                {
                    text.Bold();
                }
            });
        }

        private static void ComposeWrappedText(ColumnDescriptor column, string? value, float fontSize)
        {
            foreach (var line in WrapCommaSeparatedText(value))
            {
                column.Item().Text(line).FontSize(fontSize);
            }
        }

        internal static IReadOnlyList<string> WrapCommaSeparatedText(string? value, int targetLineLength = 28)
        {
            if (string.IsNullOrWhiteSpace(value))
            {
                return new[] { "Not configured" };
            }

            var parts = value
                .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .Where(part => !string.IsNullOrWhiteSpace(part))
                .ToArray();

            if (parts.Length <= 1)
            {
                return new[] { value.Trim() };
            }

            var lines = new List<string>();
            var current = parts[0];
            var partsInCurrentLine = 1;

            for (var i = 1; i < parts.Length; i++)
            {
                var candidate = $"{current}, {parts[i]}";
                if (partsInCurrentLine < 2 && candidate.Length <= targetLineLength)
                {
                    current = candidate;
                    partsInCurrentLine++;
                    continue;
                }

                lines.Add($"{current},");
                current = parts[i];
                partsInCurrentLine = 1;
            }

            lines.Add(current);
            return lines;
        }

        internal static bool ShouldShowUpiQr(Invoice invoice, Order order)
        {
            var balance = order.TotalAmount - order.AmountPaid - order.AppliedCreditAmount;
            return invoice.Status != InvoiceStatus.Paid && order.InvoiceStatus != InvoiceStatus.Paid && balance > 0;
        }

        private static bool HasGstApplicableLines(IReadOnlyList<InvoicePdfLine> rows)
        {
            return rows.Any(row => row.GstRate > 0);
        }

        private static bool HasHsnLines(IReadOnlyList<InvoicePdfLine> rows)
        {
            return rows.Any(row => !string.IsNullOrWhiteSpace(row.HsnCode));
        }

        private static float GetDescriptionColumnWidth(bool hasGstApplicableLines, bool hasHsnLines)
        {
            if (hasGstApplicableLines && hasHsnLines)
            {
                return 2.8f;
            }

            if (hasGstApplicableLines)
            {
                return 3.2f;
            }

            return hasHsnLines ? 3.8f : 4.4f;
        }

        private static byte[] LoadUpiQrCode()
        {
            var candidates = new[]
            {
                Path.Combine(AppContext.BaseDirectory, UpiQrAssetRelativePath),
                Path.Combine(Directory.GetCurrentDirectory(), "backend", "SmartSofto.Commerce.Infrastructure", UpiQrAssetRelativePath)
            };

            var assetPath = candidates.FirstOrDefault(File.Exists);
            return assetPath == null ? Array.Empty<byte>() : File.ReadAllBytes(assetPath);
        }

        private static string FormatAddress(Order order)
        {
            var parts = new[]
            {
                order.ShippingAddressLine1,
                order.ShippingAddressLine2,
                order.ShippingCity,
                order.ShippingState,
                order.ShippingPostalCode,
                order.ShippingCountry
            };

            return string.Join(", ", parts.Where(part => !string.IsNullOrWhiteSpace(part)));
        }

        private static string FormatMoney(decimal value)
        {
            return $"INR {value:N2}";
        }

        private static string FormatQuantity(decimal value)
        {
            return value % 1 == 0 ? value.ToString("N0") : value.ToString("N3");
        }

        private static string SafeFileName(string value)
        {
            var invalid = Path.GetInvalidFileNameChars();
            var clean = new string(value.Select(ch => invalid.Contains(ch) ? '-' : ch).ToArray());
            return string.IsNullOrWhiteSpace(clean) ? "Invoice" : clean;
        }

        private static string FormatOptional(string? value, string fallback = "Not configured")
        {
            return string.IsNullOrWhiteSpace(value) ? fallback : value;
        }

        private sealed record InvoicePdfLine(
            string Description,
            string? HsnCode,
            decimal GstRate,
            decimal Quantity,
            string? Unit,
            decimal UnitPrice,
            decimal Total);
    }
}
