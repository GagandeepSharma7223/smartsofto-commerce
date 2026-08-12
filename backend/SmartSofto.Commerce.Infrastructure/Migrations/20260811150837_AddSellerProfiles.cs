using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace SmartSofto.Commerce.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddSellerProfiles : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "SellerProfileId",
                table: "Invoices",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "SellerProfiles",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    BusinessName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Gstin = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Address = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    AccountName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    BankName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    AccountNumber = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    IfscCode = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    AuthorizedSignatory = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    AdminUserId = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: false),
                    TenantId = table.Column<int>(type: "integer", nullable: false, defaultValue: 1),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SellerProfiles", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SellerProfiles_AspNetUsers_AdminUserId",
                        column: x => x.AdminUserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_SellerProfiles_Tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "Tenants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Invoices_SellerProfileId",
                table: "Invoices",
                column: "SellerProfileId");

            migrationBuilder.CreateIndex(
                name: "IX_Invoices_TenantId_SellerProfileId",
                table: "Invoices",
                columns: new[] { "TenantId", "SellerProfileId" });

            migrationBuilder.CreateIndex(
                name: "IX_SellerProfiles_AdminUserId",
                table: "SellerProfiles",
                column: "AdminUserId");

            migrationBuilder.CreateIndex(
                name: "IX_SellerProfiles_TenantId_AdminUserId",
                table: "SellerProfiles",
                columns: new[] { "TenantId", "AdminUserId" },
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Invoices_SellerProfiles_SellerProfileId",
                table: "Invoices",
                column: "SellerProfileId",
                principalTable: "SellerProfiles",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Invoices_SellerProfiles_SellerProfileId",
                table: "Invoices");

            migrationBuilder.DropTable(
                name: "SellerProfiles");

            migrationBuilder.DropIndex(
                name: "IX_Invoices_SellerProfileId",
                table: "Invoices");

            migrationBuilder.DropIndex(
                name: "IX_Invoices_TenantId_SellerProfileId",
                table: "Invoices");

            migrationBuilder.DropColumn(
                name: "SellerProfileId",
                table: "Invoices");
        }
    }
}
