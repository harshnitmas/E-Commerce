using MediatR;
using Microsoft.Extensions.Logging;
using OrderProcessing.Application.DTOs;
using OrderProcessing.Application.Interfaces;
using OrderProcessing.Application.Messages;
using OrderProcessing.Domain.Common;
using OrderProcessing.Domain.Errors;

namespace OrderProcessing.Application.Orders.Commands.CancelOrder;

public class CancelOrderHandler(
    IOrderRepository orderRepository,
    IEventBus eventBus,
    ILogger<CancelOrderHandler> logger)
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

        try
        {
            await eventBus.PublishAsync(new OrderCancelledMessage(
                order.Id, command.Reason, "Customer",
                order.CancelledAt ?? DateTimeOffset.UtcNow), ct)
                .ConfigureAwait(false);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Failed to publish OrderCancelledMessage for order {OrderId} — audit/cache will be stale", order.Id);
        }

        return order.ToDto();
    }
}
