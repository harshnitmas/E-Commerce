using Microsoft.EntityFrameworkCore;
using OrderProcessing.Application.Interfaces;
using OrderProcessing.Domain.Entities;
using OrderProcessing.Domain.Enums;
using OrderProcessing.Infrastructure.Persistence.PostgreSQL;

namespace OrderProcessing.Infrastructure.Repositories;

public class OrderRepository(AppDbContext dbContext) : IOrderRepository
{
    public async Task<Order?> GetByIdAsync(Guid orderId, CancellationToken ct = default)
        => await dbContext.Orders
            .Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.Id == orderId, ct);

    public async Task<(List<Order> Items, int TotalCount)> ListAsync(
        OrderStatus? status, string? customerId, int page, int pageSize, CancellationToken ct = default)
    {
        var query = dbContext.Orders
            .Include(o => o.Items)
            .AsNoTracking()
            .AsQueryable();

        if (status.HasValue)
            query = query.Where(o => o.Status == status.Value);

        if (!string.IsNullOrEmpty(customerId))
            query = query.Where(o => o.CustomerId == customerId);

        var totalCount = await query.CountAsync(ct);
        var items = await query
            .OrderByDescending(o => o.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        return (items, totalCount);
    }

    public async Task<List<Order>> GetPendingOrdersOlderThanAsync(
        DateTimeOffset cutoff, CancellationToken ct = default)
        => await dbContext.Orders
            .Where(o => o.Status == OrderStatus.Pending && o.CreatedAt < cutoff)
            .ToListAsync(ct);

    public async Task AddAsync(Order order, CancellationToken ct = default)
    {
        await dbContext.Orders.AddAsync(order, ct);
        await dbContext.SaveChangesAsync(ct);
    }

    public async Task UpdateAsync(Order order, CancellationToken ct = default)
    {
        dbContext.Orders.Update(order);
        await dbContext.SaveChangesAsync(ct);
    }

    public async Task BatchUpdateStatusAsync(
        List<Guid> orderIds, OrderStatus newStatus, CancellationToken ct = default)
    {
        // ExecuteUpdateAsync bypasses the EF change tracker and the UpdatedAt concurrency token.
        // This is intentional for bulk operations — individual row-level conflicts are not checked.
        await dbContext.Orders
            .Where(o => orderIds.Contains(o.Id))
            .ExecuteUpdateAsync(s => s
                .SetProperty(o => o.Status, newStatus)
                .SetProperty(o => o.UpdatedAt, DateTimeOffset.UtcNow), ct);
    }
}
