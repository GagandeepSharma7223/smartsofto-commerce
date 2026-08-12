using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SmartSofto.Commerce.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddProductGstFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "GstRate",
                table: "Products",
                type: "numeric(5,2)",
                precision: 5,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<string>(
                name: "HsnCode",
                table: "Products",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "GstRate",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "HsnCode",
                table: "Products");
        }
    }
}
