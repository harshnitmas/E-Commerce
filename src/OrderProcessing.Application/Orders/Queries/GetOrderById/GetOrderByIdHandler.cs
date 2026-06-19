using MediatR;
using OrderProcessing.Application.DTOs;
using OrderProcessing.Application.Interfaces;
using OrderProcessing.Domain.Common;
using OrderProcessing.Domain.Errors;

namespace OrderProcessing.Application.Orders.Queries.GetOrderById;

public class GetOrderByIdHandler(IOrderRepository orderRepository)
    : IRequestHandler<GetOrderByIdQuery, Result<OrderDto, DomainError>>
{
    public async Task<Result<OrderDto, DomainError>> Handle(
        GetOrderByIdQuery query, CancellationToken ct)
    {
        var order = await orderRepository.GetByIdAsync(query.OrderId, ct);
        return order is null ? DomainErrors.Order.NotFound : order.ToDto();
    }
}
