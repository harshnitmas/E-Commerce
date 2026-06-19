using MediatR;
using OrderProcessing.Application.DTOs;
using OrderProcessing.Application.Interfaces;
using OrderProcessing.Application.Messages;
using OrderProcessing.Domain.Common;
using OrderProcessing.Domain.Entities;

namespace OrderProcessing.Application.Orders.Commands.CreateOrder;

public class CreateOrderHandler(
    IOrderRepository orderRepository,
    IEventBus eventBus)
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

        await eventBus.PublishAsync(new OrderCreatedMessage(
            order.Id,
            order.CustomerId,
            order.TotalAmount,
            "Customer",
            order.CreatedAt), ct).ConfigureAwait(false);

        return order.ToDto();
    }
}
