using MediatR;
using OrderProcessing.Application.DTOs;
using OrderProcessing.Application.Interfaces;
using OrderProcessing.Domain.Common;
using OrderProcessing.Domain.Entities;
using OrderProcessing.Domain.Errors;

namespace OrderProcessing.Application.Orders.Commands.RequestRefund;

public class RequestRefundHandler(IOrderRepository orderRepository)
    : IRequestHandler<RequestRefundCommand, Result<OrderDto, DomainError>>
{
    public async Task<Result<OrderDto, DomainError>> Handle(
        RequestRefundCommand command, CancellationToken ct)
    {
        Order? order = await orderRepository.GetByIdAsync(command.OrderId, ct).ConfigureAwait(false);
        if (order is null || order.CustomerId != command.CustomerId)
            return DomainErrors.Order.NotFound;

        Result<Order, DomainError> result = order.RequestRefund();
        if (result.IsFailure) return result.Error;

        await orderRepository.UpdateAsync(order, ct).ConfigureAwait(false);
        return order.ToDto();
    }
}
