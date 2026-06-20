using MassTransit;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Moq;
using OrderProcessing.Application.DTOs;
using OrderProcessing.Application.Interfaces;
using OrderProcessing.Domain.Enums;
using OrderProcessing.Infrastructure.Persistence.PostgreSQL;
using Testcontainers.PostgreSql;

namespace OrderProcessing.IntegrationTests.Infrastructure;

public class OrderProcessingWebApplicationFactory : WebApplicationFactory<Program>, IAsyncLifetime
{
    private readonly PostgreSqlContainer _postgresContainer = new PostgreSqlBuilder()
        .WithDatabase("order_processing_test")
        .WithUsername("test_user")
        .WithPassword("test_pass")
        .Build();

    public async Task InitializeAsync()
    {
        await _postgresContainer.StartAsync();
    }

    public new async Task DisposeAsync()
    {
        await _postgresContainer.DisposeAsync();
        await base.DisposeAsync();
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");

        // Provide test-safe configuration values before DI registration runs.
        // This prevents ConnectionMultiplexer.Connect from throwing on an empty string
        // and ensures AddNpgsql health check has a syntactically valid placeholder.
        builder.ConfigureAppConfiguration((_, config) =>
        {
            config.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:PostgreSQL"] = _postgresContainer.GetConnectionString(),
                // Redis and MongoDB need syntactically valid strings to avoid eager-connect
                // failures in InfrastructureServiceExtensions; we replace the actual
                // service registrations below before any requests are served.
                ["ConnectionStrings:Redis"] = "localhost:6399,abortConnect=false",
                ["ConnectionStrings:MongoDB"] = "mongodb://localhost:27099/?connectTimeoutMS=100",
                ["RabbitMQ:Host"] = "localhost",
                ["RabbitMQ:Username"] = "guest",
                ["RabbitMQ:Password"] = "guest",
            });
        });

        builder.ConfigureServices(services =>
        {
            // ── PostgreSQL ──────────────────────────────────────────────────────────
            // Remove the DbContext registered by InfrastructureServiceExtensions and
            // replace it with one pointing at the Testcontainer.
            ServiceDescriptor? dbCtxDescriptor = services.SingleOrDefault(
                d => d.ServiceType == typeof(DbContextOptions<AppDbContext>));
            if (dbCtxDescriptor is not null)
                services.Remove(dbCtxDescriptor);

            services.AddDbContext<AppDbContext>(opts =>
                opts.UseNpgsql(_postgresContainer.GetConnectionString()));

            // ── MassTransit ─────────────────────────────────────────────────────────
            // Remove the RabbitMQ-backed MassTransit registration and replace with
            // an in-memory transport so tests don't need a running broker.
            List<ServiceDescriptor> massTransitDescriptors = services
                .Where(d => d.ServiceType.Namespace?.StartsWith("MassTransit") == true)
                .ToList();
            foreach (ServiceDescriptor descriptor in massTransitDescriptors)
                services.Remove(descriptor);

            services.AddMassTransit(x => x.UsingInMemory((ctx, cfg) => cfg.ConfigureEndpoints(ctx)));

            // ── MongoDB (IOrderAuditRepository) ─────────────────────────────────────
            // Replace the real repository with a no-op mock so tests don't require
            // a running MongoDB instance.
            ServiceDescriptor? auditDescriptor = services.SingleOrDefault(
                d => d.ServiceType == typeof(IOrderAuditRepository));
            if (auditDescriptor is not null)
                services.Remove(auditDescriptor);

            Mock<IOrderAuditRepository> auditMock = new();
            auditMock
                .Setup(r => r.AppendAsync(It.IsAny<AuditEventDto>(), It.IsAny<CancellationToken>()))
                .Returns(Task.CompletedTask);
            auditMock
                .Setup(r => r.GetByOrderIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync([]);
            services.AddScoped<IOrderAuditRepository>(_ => auditMock.Object);

            // ── Redis (IOrderCacheService) ───────────────────────────────────────────
            // Replace with a no-op mock so tests don't require a running Redis instance.
            ServiceDescriptor? cacheDescriptor = services.SingleOrDefault(
                d => d.ServiceType == typeof(IOrderCacheService));
            if (cacheDescriptor is not null)
                services.Remove(cacheDescriptor);

            Mock<IOrderCacheService> cacheMock = new();
            cacheMock
                .Setup(c => c.GetListAsync(
                    It.IsAny<OrderStatus?>(),
                    It.IsAny<string?>(),
                    It.IsAny<int>(),
                    It.IsAny<int>(),
                    It.IsAny<CancellationToken>()))
                .ReturnsAsync((PagedResult<OrderDto>?)null);
            cacheMock
                .Setup(c => c.SetListAsync(
                    It.IsAny<OrderStatus?>(),
                    It.IsAny<string?>(),
                    It.IsAny<int>(),
                    It.IsAny<int>(),
                    It.IsAny<PagedResult<OrderDto>>(),
                    It.IsAny<CancellationToken>()))
                .Returns(Task.CompletedTask);
            cacheMock
                .Setup(c => c.InvalidateListAsync(It.IsAny<CancellationToken>()))
                .Returns(Task.CompletedTask);
            services.AddScoped<IOrderCacheService>(_ => cacheMock.Object);

            // Remove the eager Redis IConnectionMultiplexer singleton so it doesn't
            // attempt a real connection when the service provider is built.
            ServiceDescriptor? multiplexerDescriptor = services.SingleOrDefault(
                d => d.ServiceType == typeof(StackExchange.Redis.IConnectionMultiplexer));
            if (multiplexerDescriptor is not null)
                services.Remove(multiplexerDescriptor);

            // Replace real MongoDB client/database singletons with mocks so the
            // MongoDbHealthCheck and any other MongoDB consumers do not attempt real
            // connections during test runs.
            ServiceDescriptor? mongoClientDescriptor = services.SingleOrDefault(
                d => d.ServiceType == typeof(MongoDB.Driver.IMongoClient));
            if (mongoClientDescriptor is not null)
                services.Remove(mongoClientDescriptor);

            ServiceDescriptor? mongoDatabaseDescriptor = services.SingleOrDefault(
                d => d.ServiceType == typeof(MongoDB.Driver.IMongoDatabase));
            if (mongoDatabaseDescriptor is not null)
                services.Remove(mongoDatabaseDescriptor);

            // Provide a mock IMongoClient so MongoDbHealthCheck can be constructed.
            Mock<MongoDB.Driver.IMongoClient> mongoClientMock = new();
            Mock<MongoDB.Driver.IMongoDatabase> mongoDatabaseMock = new();
            mongoClientMock
                .Setup(c => c.GetDatabase(It.IsAny<string>(), It.IsAny<MongoDB.Driver.MongoDatabaseSettings?>()))
                .Returns(mongoDatabaseMock.Object);
            services.AddSingleton<MongoDB.Driver.IMongoClient>(mongoClientMock.Object);
            services.AddSingleton<MongoDB.Driver.IMongoDatabase>(mongoDatabaseMock.Object);

            // ── Schema creation ──────────────────────────────────────────────────────
            // EnsureCreated is used because no EF migrations exist yet.
            ServiceProvider sp = services.BuildServiceProvider();
            using IServiceScope scope = sp.CreateScope();
            AppDbContext db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            db.Database.EnsureCreated();
        });
    }
}
