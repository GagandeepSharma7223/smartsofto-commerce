using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SmartSofto.Commerce.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddClientNormalizedPhone : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "NormalizedPhone",
                table: "Clients",
                type: "character varying(32)",
                maxLength: 32,
                nullable: true);

            migrationBuilder.Sql(@"
                UPDATE ""Clients""
                SET ""NormalizedPhone"" = NULLIF(regexp_replace(COALESCE(""PhoneNumber"", ''), '[^0-9]', '', 'g'), '');
            ");

            migrationBuilder.Sql(@"
                WITH ranked_duplicates AS (
                    SELECT ""Id"",
                           ROW_NUMBER() OVER (
                               PARTITION BY ""TenantId"", ""NormalizedPhone""
                               ORDER BY ""CreatedAt"", ""Id""
                           ) AS row_number
                    FROM ""Clients""
                    WHERE ""NormalizedPhone"" IS NOT NULL
                )
                UPDATE ""Clients"" c
                SET ""NormalizedPhone"" = NULL
                FROM ranked_duplicates d
                WHERE c.""Id"" = d.""Id""
                  AND d.row_number > 1;
            ");

            migrationBuilder.CreateIndex(
                name: "IX_Clients_TenantId_NormalizedPhone",
                table: "Clients",
                columns: new[] { "TenantId", "NormalizedPhone" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Clients_TenantId_NormalizedPhone",
                table: "Clients");

            migrationBuilder.DropColumn(
                name: "NormalizedPhone",
                table: "Clients");
        }
    }
}
