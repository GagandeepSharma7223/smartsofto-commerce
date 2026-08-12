using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using SmartSofto.Commerce.Application.Interfaces;
using SmartSofto.Commerce.Application.Settings;
using SmartSofto.Commerce.Infrastructure;
using SmartSofto.Commerce.Infrastructure.Identity;
using SmartSofto.Commerce.Infrastructure.Services;
using SmartSofto.Commerce.Api.Services;
using SmartSofto.Commerce.Api.Settings;
using SmartSofto.Commerce.Domain.Models;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Configuration
builder.Services.Configure<JwtSettings>(builder.Configuration.GetSection("JwtSettings"));
builder.Services.Configure<SmtpSettings>(builder.Configuration.GetSection("Smtp"));

// DbContext
builder.Services.AddDbContext<ApplicationDbContext>(options =>
{
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection"));
});

// Identity
builder.Services.AddIdentity<ApplicationUser, IdentityRole>()
    .AddEntityFrameworkStores<ApplicationDbContext>()
    .AddDefaultTokenProviders();

// JWT
var jwtSettings = builder.Configuration.GetSection("JwtSettings").Get<JwtSettings>() ?? new JwtSettings
{
    SecretKey = "super-secret-key-change-me-1234567890123456",
    Issuer = "smartsofto",
    Audience = "smartsofto-client",
    ExpirationInHours = 8
};

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtSettings.Issuer,
        ValidAudience = jwtSettings.Audience,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings.SecretKey))
    };
});

// DI
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ISaleService, SaleService>();
builder.Services.AddScoped<IInventoryService, InventoryService>();
builder.Services.AddScoped<IProductService, ProductService>();
builder.Services.AddScoped<IClientService, ClientService>();
builder.Services.AddScoped<IOrderService, OrderService>();
builder.Services.AddScoped<IOrderPricingService, OrderPricingService>();
builder.Services.AddScoped<IInvoiceService, InvoiceService>();
builder.Services.AddScoped<IInvoicePdfService, InvoicePdfService>();
builder.Services.AddScoped<IClientAccountService, ClientAccountService>();
builder.Services.AddScoped<IPlantService, PlantService>();
builder.Services.AddScoped<IAdminService, AdminService>();
builder.Services.AddScoped<JwtService>();
builder.Services.AddScoped<ICurrentTenantService, CurrentTenantService>();
builder.Services.AddScoped<ICurrentUserService, CurrentUserService>();
builder.Services.AddScoped<NoOpEmailSender>();
builder.Services.AddScoped<SmtpEmailSender>();
builder.Services.AddScoped<IEmailSender>(serviceProvider =>
{
    var configuration = serviceProvider.GetRequiredService<IConfiguration>();
    var smtpSection = configuration.GetSection("Smtp");
    var enabled = smtpSection.GetValue<bool>("Enabled");
    var host = smtpSection["Host"];
    var fromEmail = smtpSection["FromEmail"];
    var username = smtpSection["Username"];
    var password = smtpSection["Password"];

    var isConfigured =
        enabled &&
        !string.IsNullOrWhiteSpace(host) &&
        !string.IsNullOrWhiteSpace(fromEmail) &&
        !string.IsNullOrWhiteSpace(username) &&
        !string.IsNullOrWhiteSpace(password);

    return isConfigured
        ? serviceProvider.GetRequiredService<SmtpEmailSender>()
        : serviceProvider.GetRequiredService<NoOpEmailSender>();
});

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
    {
        policy.WithOrigins(
            "http://localhost:3000",
            "http://localhost:3001",
            "https://localhost:3000",
            "https://localhost:3001",
            "https://admin.smartsofto.com",
            "https://admin.freshmooz.com",
            "https://freshmooz.com",
            "https://www.freshmooz.com",
            "https://smartsofto.com",
            "https://www.smartsofto.com"
        )
        .AllowAnyHeader()
        .AllowAnyMethod()
        .AllowCredentials();
    });
});


var app = builder.Build();

var enableSwagger = app.Configuration.GetValue<bool>("Swagger:Enabled") || app.Environment.IsDevelopment();
if (enableSwagger)
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseRouting();
app.UseCors("Frontend");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

await SeedIdentityAsync(app.Services);

// Redirect root to Swagger UI for convenience
app.MapGet("/", () => Results.Redirect("/swagger"));

app.Run();

static async Task SeedIdentityAsync(IServiceProvider services)
{
    using var scope = services.CreateScope();
    var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();
    var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
    var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

    // Ensure roles exist (migrations seed, but keep idempotent)
    var roles = new[] { "Admin", "User" };
    foreach (var role in roles)
    {
        if (!await roleManager.RoleExistsAsync(role))
        {
            await roleManager.CreateAsync(new IdentityRole(role));
        }
    }

    var adminEmail = "admin@smartsofto.com";
    var adminUser = await userManager.FindByEmailAsync(adminEmail);
    if (adminUser == null)
    {
        adminUser = new ApplicationUser
        {
            UserName = "admin",
            Email = adminEmail,
            FirstName = "Admin",
            LastName = "User",
            EmailConfirmed = true,
            TenantId = 1,
            Role = "Admin"
        };

        var result = await userManager.CreateAsync(adminUser, "Admin@123");
        if (result.Succeeded)
        {
            await userManager.AddToRoleAsync(adminUser, "Admin");
        }
    }

    if (adminUser != null && !context.SellerProfiles.Any(profile => profile.TenantId == 1))
    {
        context.SellerProfiles.Add(new SellerProfile
        {
            TenantId = 1,
            AdminUserId = adminUser.Id,
            BusinessName = "Standard Paneer Gurugram",
            Gstin = "06DBRPS5510N1ZZ",
            Address = "HOUSE NO 3, MOHYAL COLONY, DPS Gurgaon Infant Wing, Sector 40, Gurugram, Haryana, 122001",
            AccountName = "Standard Paneer Gurugram",
            BankName = "IndusInd",
            AccountNumber = "252010000009",
            IfscCode = "INDB0000518",
            AuthorizedSignatory = "Bhupinder Singh Bali",
            CreatedAt = DateTime.UtcNow
        });
        await context.SaveChangesAsync();
    }
}


