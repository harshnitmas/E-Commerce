using System.Text.Json;
using Microsoft.Extensions.Logging;
using OrderProcessing.Application.DTOs;
using OrderProcessing.Application.Interfaces;
using OrderProcessing.Domain.Enums;
using StackExchange.Redis;

namespace OrderProcessing.Infrastructure.Persistence.Redis;

public class OrderCacheService(IConnectionMultiplexer redis, ILogger<OrderCacheService> logger)
    : IOrderCacheService
{
    private static readonly TimeSpan Ttl = TimeSpan.FromSeconds(60);
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    private static string BuildKey(OrderStatus? status, int page, int pageSize)
        => $"orders:list:{status?.ToString() ?? "all"}:{page}:{pageSize}";

    public async Task<PagedResult<OrderDto>?> GetListAsync(
        OrderStatus? status, int page, int pageSize, CancellationToken ct = default)
    {
        try
        {
            var db = redis.GetDatabase();
            var cached = await db.StringGetAsync(BuildKey(status, page, pageSize));
            if (!cached.HasValue) return null;
            return JsonSerializer.Deserialize<PagedResult<OrderDto>>(cached!, JsonOptions);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Redis read failed, falling back to database");
            return null;
        }
    }

    public async Task SetListAsync(
        OrderStatus? status, int page, int pageSize,
        PagedResult<OrderDto> result, CancellationToken ct = default)
    {
        try
        {
            var db = redis.GetDatabase();
            var json = JsonSerializer.Serialize(result, JsonOptions);
            await db.StringSetAsync(BuildKey(status, page, pageSize), json, Ttl);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Redis write failed, cache not populated");
        }
    }

    public async Task InvalidateListAsync(CancellationToken ct = default)
    {
        try
        {
            var server = redis.GetServer(redis.GetEndPoints().First());
            var keys = server.Keys(pattern: "orders:list:*").ToArray();
            if (keys.Length > 0)
            {
                var db = redis.GetDatabase();
                await db.KeyDeleteAsync(keys);
            }
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Redis cache invalidation failed");
        }
    }
}
