using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SmartSofto.Commerce.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddClientGstinAndInvoiceBuyerSnapshot : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "BuyerBusinessName",
                table: "Invoices",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "BuyerGstin",
                table: "Invoices",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Gstin",
                table: "Clients",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "BuyerBusinessName",
                table: "Invoices");

            migrationBuilder.DropColumn(
                name: "BuyerGstin",
                table: "Invoices");

            migrationBuilder.DropColumn(
                name: "Gstin",
                table: "Clients");
        }
    }
}
