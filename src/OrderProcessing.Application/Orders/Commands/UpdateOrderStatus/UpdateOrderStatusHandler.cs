using MediatR;
using OrderProcessing.Application.DTOs;
using OrderProcessing.Application.Interfaces;
using OrderProcessing.Application.Messages;
using OrderProcessing.Domain.Common;
using OrderProcessing.Domain.Errors;

namespace OrderProcessing.Application.Orders.Commands.UpdateOrderStatus;

public class UpdateOrderStatusHandler(
    IOrderRepository orderRepository,
    IEventBus eventBus)
    : IRequestHandler<UpdateOrderStatusCommand, Result<OrderDto, DomainError>>
{
    public async Task<Result<OrderDto, DomainError>> Handle(
        UpdateOrderStatusCommand command, CancellationToken ct)
    {
        var order = await orderRepository.GetByIdAsync(command.OrderId, ct).ConfigureAwait(false);
        if (order is null) return DomainErrors.Order.NotFound;

        string previousStatus = order.Status.ToString();
        var result = order.UpdateStatus(command.NewStatus, command.TriggeredBy);
        if (result.IsFailure) return result.Error;

        await orderRepository.UpdateAsync(order, ct).ConfigureAwait(false);

        await eventBus.PublishAsync(new OrderStatusChangedMessage(
            order.Id,
            previousStatus,
            order.Status.ToString(),
            command.TriggeredBy,
            order.UpdatedAt), ct).ConfigureAwait(false);

        return order.ToDto();
    }
}
