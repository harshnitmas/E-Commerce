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
        if (order is null) return DomainErrors.Order.NotFound;

        // Ownership check: if a customer ID was provided, verify the order belongs to them.
        // Return NotFound (not Forbidden) to avoid leaking whether the order exists.
        if (!string.IsNullOrEmpty(query.RequestingCustomerId)
            && order.CustomerId != query.RequestingCustomerId)
            return DomainErrors.Order.AccessDenied;

        return order.ToDto();
    }
}
