using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SmartSofto.Commerce.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddSellerStateAndOrderItemGstSnapshots : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "GstStateCode",
                table: "SellerProfiles",
                type: "character varying(2)",
                maxLength: 2,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "State",
                table: "SellerProfiles",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<decimal>(
                name: "CgstAmount",
                table: "OrderItems",
                type: "numeric(18,2)",
                precision: 18,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "GstRate",
                table: "OrderItems",
                type: "numeric(5,2)",
                precision: 5,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<string>(
                name: "HsnCode",
                table: "OrderItems",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "IgstAmount",
                table: "OrderItems",
                type: "numeric(18,2)",
                precision: 18,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "LineTotal",
                table: "OrderItems",
                type: "numeric(18,2)",
                precision: 18,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "SgstAmount",
                table: "OrderItems",
                type: "numeric(18,2)",
                precision: 18,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "TaxableAmount",
                table: "OrderItems",
                type: "numeric(18,2)",
                precision: 18,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.Sql(
                """
                UPDATE "SellerProfiles"
                SET "State" = 'Haryana', "GstStateCode" = '06'
                WHERE "TenantId" = 1 AND "BusinessName" = 'Standard Paneer Gurugram';
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "GstStateCode",
                table: "SellerProfiles");

            migrationBuilder.DropColumn(
                name: "State",
                table: "SellerProfiles");

            migrationBuilder.DropColumn(
                name: "CgstAmount",
                table: "OrderItems");

            migrationBuilder.DropColumn(
                name: "GstRate",
                table: "OrderItems");

            migrationBuilder.DropColumn(
                name: "HsnCode",
                table: "OrderItems");

            migrationBuilder.DropColumn(
                name: "IgstAmount",
                table: "OrderItems");

            migrationBuilder.DropColumn(
                name: "LineTotal",
                table: "OrderItems");

            migrationBuilder.DropColumn(
                name: "SgstAmount",
                table: "OrderItems");

            migrationBuilder.DropColumn(
                name: "TaxableAmount",
                table: "OrderItems");
        }
    }
}
