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
    private const string VERSION_KEY = "orders:cache:v";
    private static readonly TimeSpan Ttl = TimeSpan.FromSeconds(60);
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    private async Task<long> GetVersionAsync(IDatabase db)
    {
        RedisValue value = await db.StringGetAsync(VERSION_KEY).ConfigureAwait(false);
        return value.TryParse(out long version) ? version : 0;
    }

    private static string BuildKey(long version, OrderStatus? status, string? customerId, int page, int pageSize)
        => $"orders:list:v{version}:{status?.ToString() ?? "all"}:{customerId ?? "all"}:{page}:{pageSize}";

    public async Task<PagedResult<OrderDto>?> GetListAsync(
        OrderStatus? status, string? customerId, int page, int pageSize, CancellationToken ct = default)
    {
        try
        {
            IDatabase db = redis.GetDatabase();
            long version = await GetVersionAsync(db).ConfigureAwait(false);
            RedisValue cached = await db.StringGetAsync(BuildKey(version, status, customerId, page, pageSize)).ConfigureAwait(false);
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
        OrderStatus? status, string? customerId, int page, int pageSize,
        PagedResult<OrderDto> result, CancellationToken ct = default)
    {
        try
        {
            IDatabase db = redis.GetDatabase();
            long version = await GetVersionAsync(db).ConfigureAwait(false);
            string json = JsonSerializer.Serialize(result, JsonOptions);
            await db.StringSetAsync(BuildKey(version, status, customerId, page, pageSize), json, Ttl).ConfigureAwait(false);
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
            IDatabase db = redis.GetDatabase();
            // Increment version to invalidate all existing list keys in O(1) without SCAN.
            // Old keys expire via TTL; new writes go to the next version's key namespace.
            await db.StringIncrementAsync(VERSION_KEY).ConfigureAwait(false);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Redis cache version increment failed, cache may be stale");
        }
    }
}
