using backend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using backend.Infrastructure;
using Microsoft.AspNetCore.Authentication.Google;

var builder = WebApplication.CreateBuilder(args);

const string FrontendCorsPolicy = "FrontendCorsPolicy";

// ==============================
// SERVICES
// ==============================

// Controllers
builder.Services.AddControllers();

// Swagger / OpenAPI
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Main application database
builder.Services.AddDbContext<MainAppDbContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("MainAppDbConnection")));

// ML API client
builder.Services.AddHttpClient("MlApi", (sp, client) =>
{
    var cfg = sp.GetRequiredService<IConfiguration>();
    var baseUrl = cfg["Ml:BaseUrl"]?.Trim().TrimEnd('/');

    if (!string.IsNullOrWhiteSpace(baseUrl))
    {
        client.BaseAddress = new Uri(baseUrl + "/");
    }

    client.Timeout = TimeSpan.FromSeconds(120);
});

// Identity database
builder.Services.AddDbContext<AuthIdentityDbContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("AuthConnection")));

// ASP.NET Identity with roles
builder.Services.AddIdentity<ApplicationUser, IdentityRole>(options =>
{
    options.Password.RequireDigit = false;
    options.Password.RequireLowercase = false;
    options.Password.RequireNonAlphanumeric = false;
    options.Password.RequireUppercase = false;
    options.Password.RequiredLength = 14;
})
.AddEntityFrameworkStores<AuthIdentityDbContext>()
.AddDefaultTokenProviders();

// Google external authentication (optional — skipped if credentials not configured)
var googleClientId = builder.Configuration["Authentication:Google:ClientId"];
var googleClientSecret = builder.Configuration["Authentication:Google:ClientSecret"];
if (!string.IsNullOrWhiteSpace(googleClientId) && !string.IsNullOrWhiteSpace(googleClientSecret))
{
    builder.Services
        .AddAuthentication()
        .AddGoogle("Google", options =>
        {
            options.ClientId = googleClientId;
            options.ClientSecret = googleClientSecret;
            options.CallbackPath = "/signin-google";
        });
}

// Cookie settings
builder.Services.ConfigureApplicationCookie(options =>
{
    options.Cookie.HttpOnly = true;
    options.Cookie.SameSite = SameSiteMode.None;
    options.Cookie.SecurePolicy = CookieSecurePolicy.Always;
    options.ExpireTimeSpan = TimeSpan.FromDays(7);
    options.SlidingExpiration = true;
    // Return 401 for API calls instead of redirecting to /Account/Login
    options.Events.OnRedirectToLogin = context =>
    {
        if (context.Request.Path.StartsWithSegments("/api"))
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            return Task.CompletedTask;
        }
        context.Response.Redirect(context.RedirectUri);
        return Task.CompletedTask;
    };
});

// CORS for frontend
builder.Services.AddCors(options =>
{
    options.AddPolicy(FrontendCorsPolicy, policy =>
    {
        policy
            .WithOrigins(
                "http://localhost:5173",
                "https://localhost:5173",
                "http://127.0.0.1:5173",
                "https://safe-harbor.vercel.app",
                "https://nice-beach-0045c401e.6.azurestaticapps.net",
                "https://safeharbor.mhammerventures.com",
                "https://safe-harbor-app-cbhbghfvgzerf5f4.canadacentral-01.azurewebsites.net"
            )
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

// Authorization
builder.Services.AddAuthorization(options =>
{
    options.FallbackPolicy = new AuthorizationPolicyBuilder()
        .RequireAuthenticatedUser()
        .Build();
});

var app = builder.Build();

// Diagnostic: use category SafeHarbor.Ml so this is not filtered by "Microsoft.AspNetCore": "Warning" in appsettings.json.
var mlBaseResolved = app.Configuration["Ml:BaseUrl"]?.Trim();
var mlDiag = app.Services.GetRequiredService<ILoggerFactory>().CreateLogger("SafeHarbor.Ml");
mlDiag.LogInformation(
    "ML proxy: Ml:BaseUrl resolved to {Value}",
    string.IsNullOrEmpty(mlBaseResolved) ? "(empty — check Azure App Setting Ml__BaseUrl, two underscores)" : mlBaseResolved);

// ==============================
// SEED DEFAULT IDENTITY DATA
// ==============================

using (var scope = app.Services.CreateScope())
{
    await AuthIdentityGenerator.GenerateDefaultIdentityAsync(
        scope.ServiceProvider,
        app.Configuration);
}

// ==============================
// MIDDLEWARE PIPELINE
// ==============================

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}
else
{
    app.UseHsts();
}

app.UseHttpsRedirection();

app.UseSecurityHeaders();

app.UseCors(FrontendCorsPolicy);

app.Use(async (context, next) =>
{
    if (context.Request.Path.StartsWithSegments("/api/Ml", StringComparison.OrdinalIgnoreCase))
    {
        var started = DateTime.UtcNow;

        await next();

        var elapsedMs = (DateTime.UtcNow - started).TotalMilliseconds;

        app.Logger.LogInformation(
            "ML request {Method} {Path} -> {StatusCode} in {ElapsedMs:0.0}ms",
            context.Request.Method,
            context.Request.Path,
            context.Response.StatusCode,
            elapsedMs);

        return;
    }

    await next();
});

// Serve React frontend from wwwroot/ (before auth so static files are public)
app.UseDefaultFiles();
app.UseStaticFiles();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.MapFallbackToFile("index.html")
    .AllowAnonymous();

app.Run();