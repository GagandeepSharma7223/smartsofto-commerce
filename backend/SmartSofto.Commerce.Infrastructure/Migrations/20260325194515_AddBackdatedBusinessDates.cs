using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SmartSofto.Commerce.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddBackdatedBusinessDates : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<DateTime>(
                name: "OrderDate",
                table: "Orders",
                type: "date",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone");

            migrationBuilder.AddColumn<DateTime>(
                name: "InvoiceDate",
                table: "Invoices",
                type: "date",
                nullable: false,
                defaultValueSql: "CURRENT_DATE");

            migrationBuilder.AddColumn<DateTime>(
                name: "EffectiveDate",
                table: "InventoryTransactions",
                type: "date",
                nullable: false,
                defaultValueSql: "CURRENT_DATE");

            migrationBuilder.Sql(@"
                UPDATE ""Invoices""
                SET ""InvoiceDate"" = COALESCE(DATE(""CreatedAt""), DATE(""CreatedUtc""), CURRENT_DATE)
                WHERE ""InvoiceDate"" IS NULL OR ""InvoiceDate"" = DATE '0001-01-01';
            ");

            migrationBuilder.Sql(@"
                UPDATE ""InventoryTransactions""
                SET ""EffectiveDate"" = COALESCE(DATE(""CreatedUtc""), CURRENT_DATE)
                WHERE ""EffectiveDate"" IS NULL OR ""EffectiveDate"" = DATE '0001-01-01';
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "InvoiceDate",
                table: "Invoices");

            migrationBuilder.DropColumn(
                name: "EffectiveDate",
                table: "InventoryTransactions");

            migrationBuilder.AlterColumn<DateTime>(
                name: "OrderDate",
                table: "Orders",
                type: "timestamp with time zone",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "date");
        }
    }
}
