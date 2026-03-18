using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Infrastructure;
using SmartSofto.Commerce.Infrastructure;

#nullable disable

namespace SmartSofto.Commerce.Infrastructure.Migrations
{
    [DbContext(typeof(ApplicationDbContext))]
    [Migration("20260317123000_AddProductIsActive")]
    public partial class AddProductIsActive : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                "ALTER TABLE \"Products\" ADD COLUMN IF NOT EXISTS \"IsActive\" boolean NOT NULL DEFAULT TRUE;"
            );
            migrationBuilder.Sql(
                "UPDATE \"Products\" SET \"IsActive\" = TRUE WHERE \"IsActive\" IS NULL;"
            );
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                "ALTER TABLE \"Products\" DROP COLUMN IF EXISTS \"IsActive\";"
            );
        }
    }
}
