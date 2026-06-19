using OrderProcessing.Domain.Entities;
using OrderProcessing.Domain.Enums;

namespace OrderProcessing.Application.Interfaces;

public interface IOrderRepository
{
    Task<Order?> GetByIdAsync(Guid orderId, CancellationToken ct = default);
    Task<(List<Order> Items, int TotalCount)> ListAsync(
        OrderStatus? status, int page, int pageSize, CancellationToken ct = default);
    Task<List<Order>> GetPendingOrdersOlderThanAsync(
        DateTimeOffset cutoff, CancellationToken ct = default);
    Task AddAsync(Order order, CancellationToken ct = default);
    Task UpdateAsync(Order order, CancellationToken ct = default);
    Task BatchUpdateStatusAsync(
        List<Guid> orderIds, OrderStatus newStatus, CancellationToken ct = default);
}
