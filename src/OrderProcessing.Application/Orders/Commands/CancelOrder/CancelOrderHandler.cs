using MediatR;
using OrderProcessing.Application.DTOs;
using OrderProcessing.Application.Interfaces;
using OrderProcessing.Application.Messages;
using OrderProcessing.Domain.Common;
using OrderProcessing.Domain.Errors;

namespace OrderProcessing.Application.Orders.Commands.CancelOrder;

public class CancelOrderHandler(
    IOrderRepository orderRepository,
    IEventBus eventBus)
    : IRequestHandler<CancelOrderCommand, Result<OrderDto, DomainError>>
{
    public async Task<Result<OrderDto, DomainError>> Handle(
        CancelOrderCommand command, CancellationToken ct)
    {
        var order = await orderRepository.GetByIdAsync(command.OrderId, ct).ConfigureAwait(false);
        if (order is null) return DomainErrors.Order.NotFound;

        var result = order.Cancel(command.Reason);
        if (result.IsFailure) return result.Error;

        await orderRepository.UpdateAsync(order, ct).ConfigureAwait(false);

        await eventBus.PublishAsync(new OrderCancelledMessage(
            order.Id,
            command.Reason,
            "Customer",
            order.CancelledAt ?? DateTimeOffset.UtcNow), ct).ConfigureAwait(false);

        return order.ToDto();
    }
}
