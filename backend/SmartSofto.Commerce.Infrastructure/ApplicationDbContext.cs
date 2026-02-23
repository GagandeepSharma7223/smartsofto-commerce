using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using SmartSofto.Commerce.Domain.Models;
using SmartSofto.Commerce.Infrastructure.Identity;
using Microsoft.AspNetCore.Identity;

namespace SmartSofto.Commerce.Infrastructure
{
    public class ApplicationDbContext : IdentityDbContext<ApplicationUser>
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<Product> Products { get; set; }
        public DbSet<Client> Clients { get; set; }
        public DbSet<Order> Orders { get; set; }
        public DbSet<OrderItem> OrderItems { get; set; }
        public DbSet<Sale> Sales { get; set; }
        public DbSet<SaleItem> SaleItems { get; set; }
        public DbSet<Plant> Plants { get; set; }
        public DbSet<Invoice> Invoices { get; set; }
        public DbSet<ClientAddress> ClientAddresses { get; set; }
        public DbSet<Tenant> Tenants { get; set; }
        public DbSet<InventoryTransaction> InventoryTransactions { get; set; }

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            builder.Entity<ApplicationUser>(entity =>
            {
                entity.Property(e => e.FirstName).HasMaxLength(100);
                entity.Property(e => e.LastName).HasMaxLength(100);
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
                entity.Property(e => e.TenantId).HasDefaultValue(1);

                entity.HasIndex(e => new { e.UserName, e.TenantId }).IsUnique();
                entity.HasIndex(e => new { e.Email, e.TenantId }).IsUnique();
            });

            // Seed base roles
            builder.Entity<IdentityRole>().HasData(
                new IdentityRole
                {
                    Id = "4f5f94ce-2e49-4a8a-9e5f-2dfe2e1b6a01",
                    Name = "Admin",
                    NormalizedName = "ADMIN"
                },
                new IdentityRole
                {
                    Id = "e2b9a6d1-1cc2-4c6e-8a3e-6a8b1f73c7b5",
                    Name = "User",
                    NormalizedName = "USER"
                });

            builder.Entity<Product>(entity =>
            {
                entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
                entity.Property(e => e.Description).HasMaxLength(500);
                entity.Property(e => e.Price).HasPrecision(18, 2);
                entity.Property(e => e.ImageFileName).HasMaxLength(256);
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
                entity.Property(e => e.TenantId).HasDefaultValue(1);
            });

            builder.Entity<Client>(entity =>
            {
                entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
                entity.Property(e => e.Email).HasMaxLength(100);
                entity.Property(e => e.PhoneNumber).HasMaxLength(20);
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
                entity.Property(e => e.TenantId).HasDefaultValue(1);
            });

            builder.Entity<Plant>(entity =>
            {
                entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
                entity.Property(e => e.Description).HasMaxLength(500);
                entity.Property(e => e.Address).HasMaxLength(200);
                entity.Property(e => e.City).HasMaxLength(100);
                entity.Property(e => e.State).HasMaxLength(100);
                entity.Property(e => e.PostalCode).HasMaxLength(20);
                entity.Property(e => e.Country).HasMaxLength(100);
                entity.Property(e => e.Phone).HasMaxLength(20);
                entity.Property(e => e.Email).HasMaxLength(100);
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
                entity.Property(e => e.TenantId).HasDefaultValue(1);
            });

            builder.Entity<Order>(entity =>
            {
                entity.Property(e => e.OrderNumber).IsRequired().HasMaxLength(50);
                entity.Property(e => e.UnitPrice).HasPrecision(18, 2);
                entity.Property(e => e.TotalAmount).HasPrecision(18, 2);
                entity.Property(e => e.Status).IsRequired().HasMaxLength(50);
                entity.Property(e => e.ShippingName).HasMaxLength(100);
                entity.Property(e => e.ShippingPhone).HasMaxLength(20);
                entity.Property(e => e.ShippingAddressLine1).HasMaxLength(200);
                entity.Property(e => e.ShippingAddressLine2).HasMaxLength(200);
                entity.Property(e => e.ShippingCity).HasMaxLength(50);
                entity.Property(e => e.ShippingState).HasMaxLength(50);
                entity.Property(e => e.ShippingPostalCode).HasMaxLength(20);
                entity.Property(e => e.ShippingCountry).HasMaxLength(50);
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
                entity.Property(e => e.TenantId).HasDefaultValue(1);
            });

            builder.Entity<OrderItem>(entity =>
            {
                entity.Property(e => e.UnitPrice).HasPrecision(18, 2);
                entity.Property(e => e.DiscountAmount).HasPrecision(18, 2).HasDefaultValue(0m);
                entity.Property(e => e.TenantId).HasDefaultValue(1);
            });

            builder.Entity<Sale>(entity =>
            {
                entity.Property(e => e.TotalAmount).HasPrecision(18, 2);
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
                entity.Property(e => e.TenantId).HasDefaultValue(1);
            });

            builder.Entity<SaleItem>(entity =>
            {
                // keep defaults
            });

            builder.Entity<User>()
                .HasIndex(u => u.Username)
                .IsUnique();

            builder.Entity<User>()
                .HasIndex(u => u.Email)
                .IsUnique();

            builder.Entity<Client>()
                .HasIndex(c => c.Email)
                .IsUnique();

            builder.Entity<Order>()
                .HasOne(o => o.Client)
                .WithMany()
                .HasForeignKey(o => o.ClientId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<Order>()
                .HasOne(o => o.Product)
                .WithMany()
                .HasForeignKey(o => o.ProductId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<Invoice>(entity =>
            {
                entity.Property(e => e.CreatedUtc).HasDefaultValueSql("CURRENT_TIMESTAMP");
            });

            builder.Entity<Invoice>()
                .HasOne(i => i.Order)
                .WithMany()
                .HasForeignKey(i => i.OrderId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<ClientAddress>(entity =>
            {
                entity.Property(e => e.UserId).HasMaxLength(450);
                entity.Property(e => e.AddressLine1).HasMaxLength(200).IsRequired();
                entity.Property(e => e.AddressLine2).HasMaxLength(200);
                entity.Property(e => e.City).HasMaxLength(50).IsRequired();
                entity.Property(e => e.State).HasMaxLength(50).IsRequired();
                entity.Property(e => e.PostalCode).HasMaxLength(20).IsRequired();
                entity.Property(e => e.Country).HasMaxLength(50);
                entity.Property(e => e.TenantId).HasDefaultValue(1);
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
                entity.HasIndex(e => new { e.TenantId, e.UserId });
                entity.HasIndex(e => new { e.TenantId, e.ClientId });

                entity.HasOne<Client>()
                    .WithMany()
                    .HasForeignKey(e => e.ClientId)
                    .OnDelete(DeleteBehavior.Restrict);
            });
            builder.Entity<Tenant>().HasData(
                new Tenant
                {
                    Id = 1,
                    Code = "freshmooz",
                    Name = "FreshMooz",
                    PrimaryDomain = null,
                    SettingsJson = null,
                    IsActive = true
                });            builder.Entity<InventoryTransaction>(entity =>
            {
                entity.Property(e => e.Reason).IsRequired().HasMaxLength(50);
                entity.Property(e => e.ReferenceType).IsRequired().HasMaxLength(50);
                entity.Property(e => e.ReferenceId).HasMaxLength(100);
                entity.Property(e => e.Note).HasColumnType("text");
                entity.Property(e => e.CreatedUtc).HasDefaultValueSql("CURRENT_TIMESTAMP");
                entity.Property(e => e.TenantId).HasDefaultValue(1);

                entity.HasIndex(e => new { e.TenantId, e.ProductId, e.CreatedUtc }).IsDescending(false, false, true);
                entity.HasIndex(e => new { e.TenantId, e.CreatedUtc }).IsDescending(false, true);

                entity.HasOne(e => e.Product)
                    .WithMany()
                    .HasForeignKey(e => e.ProductId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne<ApplicationUser>()
                    .WithMany()
                    .HasForeignKey(e => e.CreatedByUserId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne<Tenant>()
                    .WithMany()
                    .HasForeignKey(e => e.TenantId)
                    .OnDelete(DeleteBehavior.Restrict);
            });
        }
    }
}




