using MediatR;
using Microsoft.Extensions.Logging;
using OrderProcessing.Application.DTOs;
using OrderProcessing.Application.Interfaces;
using OrderProcessing.Application.Messages;
using OrderProcessing.Domain.Common;
using OrderProcessing.Domain.Errors;

namespace OrderProcessing.Application.Orders.Commands.UpdateOrderStatus;

public class UpdateOrderStatusHandler(
    IOrderRepository orderRepository,
    IEventBus eventBus,
    ILogger<UpdateOrderStatusHandler> logger)
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

        try
        {
            await eventBus.PublishAsync(new OrderStatusChangedMessage(
                order.Id, previousStatus, order.Status.ToString(),
                command.TriggeredBy, order.UpdatedAt), ct)
                .ConfigureAwait(false);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Failed to publish OrderStatusChangedMessage for order {OrderId} — audit/cache will be stale", order.Id);
        }

        return order.ToDto();
    }
}
