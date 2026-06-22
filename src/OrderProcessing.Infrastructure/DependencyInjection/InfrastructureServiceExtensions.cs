using MassTransit;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using MongoDB.Bson;
using MongoDB.Bson.Serialization;
using MongoDB.Bson.Serialization.Serializers;
using MongoDB.Driver;
using OrderProcessing.Application.Interfaces;
using OrderProcessing.Infrastructure.BackgroundJobs;
using OrderProcessing.Infrastructure.Messaging;
using OrderProcessing.Infrastructure.Messaging.Consumers;
using OrderProcessing.Infrastructure.Persistence.MongoDB;
using OrderProcessing.Infrastructure.Persistence.PostgreSQL;
using OrderProcessing.Infrastructure.Persistence.Redis;
using OrderProcessing.Infrastructure.Repositories;
using OrderProcessing.Infrastructure.Security;
using StackExchange.Redis;

namespace OrderProcessing.Infrastructure.DependencyInjection;

public static class InfrastructureServiceExtensions
{
    public static IServiceCollection AddInfrastructureServices(
        this IServiceCollection services, IConfiguration config)
    {
        AddPostgreSQL(services, config);
        AddMongoDB(services, config);
        AddRedis(services, config);
        AddMessaging(services, config);

        services.AddScoped<IOrderRepository, OrderRepository>();
        services.AddScoped<IOrderAuditRepository, OrderAuditRepository>();
        services.AddScoped<IOrderCacheService, OrderCacheService>();
        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<IProductRepository, ProductRepository>();
        services.AddScoped<IInventoryReservationRepository, InventoryReservationRepository>();
        services.AddScoped<IPasswordHasher, PasswordHasher>();
        services.AddScoped<IEventBus, MassTransitEventBus>();
        services.AddHostedService<OrderProcessingJob>();
        services.AddHostedService<ReservationExpiryJob>();

        return services;
    }

    private static void AddPostgreSQL(IServiceCollection services, IConfiguration config)
    {
        string connectionString = config.GetConnectionString("PostgreSQL")
            ?? throw new InvalidOperationException("PostgreSQL connection string is required.");

        services.AddDbContext<AppDbContext>(opts =>
            opts.UseNpgsql(connectionString));
    }

    private static void AddMongoDB(IServiceCollection services, IConfiguration config)
    {
        BsonSerializer.RegisterSerializer(new DateTimeOffsetSerializer(BsonType.String));

        string connectionString = config.GetConnectionString("MongoDB")
            ?? throw new InvalidOperationException("MongoDB connection string is required.");
        string databaseName = config["MongoDB:DatabaseName"] ?? "OrderProcessingDb";

        var client = new MongoClient(connectionString);
        IMongoDatabase database = client.GetDatabase(databaseName);

        services.AddSingleton<IMongoClient>(client);
        services.AddSingleton(database);
    }

    private static void AddRedis(IServiceCollection services, IConfiguration config)
    {
        string connectionString = config.GetConnectionString("Redis")
            ?? throw new InvalidOperationException("Redis connection string is required.");

        services.AddSingleton<IConnectionMultiplexer>(
            ConnectionMultiplexer.Connect(connectionString));
    }

    private static void AddMessaging(IServiceCollection services, IConfiguration config)
    {
        string host = config["RabbitMQ:Host"] ?? "localhost";
        string username = config["RabbitMQ:Username"] ?? "rabbit_user";
        string password = config["RabbitMQ:Password"] ?? "rabbit_pass";

        services.AddMassTransit(x =>
        {
            x.AddConsumer<OrderCreatedConsumer>();
            x.AddConsumer<OrderStatusChangedConsumer>();
            x.AddConsumer<OrderCancelledConsumer>();

            x.UsingRabbitMq((context, cfg) =>
            {
                cfg.Host(host, "/", h =>
                {
                    h.Username(username);
                    h.Password(password);
                });

                cfg.ConfigureEndpoints(context);
            });
        });
    }
}
