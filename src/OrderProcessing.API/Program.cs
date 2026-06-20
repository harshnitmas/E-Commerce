using Microsoft.EntityFrameworkCore;
using OrderProcessing.API.Middleware;
using OrderProcessing.Application.DependencyInjection;
using OrderProcessing.Application.Interfaces;
using OrderProcessing.Domain.Entities;
using OrderProcessing.Infrastructure.DependencyInjection;
using OrderProcessing.Infrastructure.Persistence.PostgreSQL;
using Serilog;

Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .CreateBootstrapLogger();

try
{
    var builder = WebApplication.CreateBuilder(args);

    builder.Host.UseSerilog((ctx, services, config) =>
    {
        config
            .ReadFrom.Configuration(ctx.Configuration)
            .ReadFrom.Services(services)
            .Enrich.FromLogContext()
            .Enrich.WithMachineName()
            .Enrich.WithEnvironmentName()
            .WriteTo.Console()
            .WriteTo.File("logs/log-.txt", rollingInterval: RollingInterval.Day, retainedFileCountLimit: 7);
    });

    builder.Services.AddControllers();
    builder.Services.AddEndpointsApiExplorer();
    builder.Services.AddSwaggerGen(c =>
    {
        c.SwaggerDoc("v1", new() { Title = "Order Processing API", Version = "v1" });
    });

    builder.Services.AddApplicationServices();
    builder.Services.AddInfrastructureServices(builder.Configuration);

    builder.Services.AddCors(opts =>
        opts.AddPolicy("AllowUI", p =>
            p.WithOrigins("http://localhost:5173", "http://localhost:3000")
             .AllowAnyMethod()
             .AllowAnyHeader()));

    builder.Services.AddHealthChecks()
        .AddNpgSql(builder.Configuration.GetConnectionString("PostgreSQL")!,
            name: "postgresql", tags: ["db"])
        .AddCheck<OrderProcessing.API.Middleware.MongoDbHealthCheck>("mongodb", tags: ["db"])
        .AddRedis(builder.Configuration.GetConnectionString("Redis")!,
            name: "redis", tags: ["cache"]);

    var app = builder.Build();

    app.UseMiddleware<ExceptionHandlingMiddleware>();
    app.UseMiddleware<CorrelationIdMiddleware>();

    if (app.Environment.IsDevelopment())
    {
        app.UseSwagger();
        app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "Order Processing API v1"));

        using var scope = app.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await db.Database.MigrateAsync();
        await SeedDefaultUsersAsync(scope.ServiceProvider);
    }

    app.UseCors("AllowUI");
    app.UseHttpsRedirection();
    app.MapControllers();
    app.MapHealthChecks("/health");

    await app.RunAsync();
}
catch (Exception ex) when (ex is not HostAbortedException)
{
    Log.Fatal(ex, "Application startup failed");
}
finally
{
    Log.CloseAndFlush();
}

// Ensures the admin account always exists. Idempotent — safe to run on every startup.
static async Task SeedDefaultUsersAsync(IServiceProvider services)
{
    AppDbContext db = services.GetRequiredService<AppDbContext>();
    IPasswordHasher hasher = services.GetRequiredService<IPasswordHasher>();

    if (!await db.Users.AnyAsync(u => u.Username == "admin"))
    {
        db.Users.Add(User.Create("admin", "Administrator", "admin@shopnow.com",
            hasher.Hash("admin"), "admin"));
        await db.SaveChangesAsync();
    }
}

// Required for WebApplicationFactory<Program> in integration tests.
public partial class Program { }
