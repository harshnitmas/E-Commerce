using MediatR;
using Microsoft.Extensions.Logging;
using OrderProcessing.Application.DTOs;
using OrderProcessing.Application.Interfaces;
using OrderProcessing.Application.Messages;
using OrderProcessing.Domain.Common;
using OrderProcessing.Domain.Entities;

namespace OrderProcessing.Application.Orders.Commands.CreateOrder;

public class CreateOrderHandler(
    IOrderRepository orderRepository,
    IEventBus eventBus,
    ILogger<CreateOrderHandler> logger)
    : IRequestHandler<CreateOrderCommand, Result<OrderDto, DomainError>>
{
    public async Task<Result<OrderDto, DomainError>> Handle(
        CreateOrderCommand command, CancellationToken ct)
    {
        var itemResults = command.Items
            .Select(i => OrderItem.Create(Guid.Empty, i.ProductId, i.ProductName, i.Quantity, i.UnitPrice))
            .ToList();

        var failedItem = itemResults.FirstOrDefault(r => r.IsFailure);
        if (failedItem is not null) return failedItem.Error;

        var items = itemResults.Select(r => r.Value).ToList();

        var orderResult = Order.Create(command.CustomerId, items);
        if (orderResult.IsFailure) return orderResult.Error;

        Order order = orderResult.Value;
        await orderRepository.AddAsync(order, ct).ConfigureAwait(false);

        try
        {
            await eventBus.PublishAsync(new OrderCreatedMessage(
                order.Id, order.CustomerId, order.TotalAmount, "Customer", order.CreatedAt), ct)
                .ConfigureAwait(false);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Failed to publish OrderCreatedMessage for order {OrderId} — audit/cache will be stale", order.Id);
        }

        return order.ToDto();
    }
}
