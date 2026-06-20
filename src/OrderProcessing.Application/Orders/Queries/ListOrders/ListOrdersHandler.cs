using MediatR;
using OrderProcessing.Application.DTOs;
using OrderProcessing.Application.Interfaces;
using OrderProcessing.Domain.Common;

namespace OrderProcessing.Application.Orders.Queries.ListOrders;

public class ListOrdersHandler(
    IOrderRepository orderRepository,
    IOrderCacheService cacheService)
    : IRequestHandler<ListOrdersQuery, Result<PagedResult<OrderDto>, DomainError>>
{
    public async Task<Result<PagedResult<OrderDto>, DomainError>> Handle(
        ListOrdersQuery query, CancellationToken ct)
    {
        var cached = await cacheService.GetListAsync(query.Status, query.CustomerId, query.Page, query.PageSize, ct);
        if (cached is not null) return cached;

        var (items, totalCount) = await orderRepository.ListAsync(
            query.Status, query.CustomerId, query.Page, query.PageSize, ct);

        var result = new PagedResult<OrderDto>(
            items.Select(o => o.ToDto()).ToList(),
            query.Page,
            query.PageSize,
            totalCount);

        await cacheService.SetListAsync(query.Status, query.CustomerId, query.Page, query.PageSize, result, ct);

        return result;
    }
}
