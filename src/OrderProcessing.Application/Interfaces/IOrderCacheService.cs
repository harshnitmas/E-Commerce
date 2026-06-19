using OrderProcessing.Application.DTOs;
using OrderProcessing.Domain.Enums;

namespace OrderProcessing.Application.Interfaces;

public interface IOrderCacheService
{
    Task<PagedResult<OrderDto>?> GetListAsync(
        OrderStatus? status, int page, int pageSize, CancellationToken ct = default);
    Task SetListAsync(
        OrderStatus? status, int page, int pageSize,
        PagedResult<OrderDto> result, CancellationToken ct = default);
    Task InvalidateListAsync(CancellationToken ct = default);
}
