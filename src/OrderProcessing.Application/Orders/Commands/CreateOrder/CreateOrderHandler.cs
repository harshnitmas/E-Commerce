using MediatR;
using Microsoft.Extensions.Logging;
using OrderProcessing.Application.DTOs;
using OrderProcessing.Application.Interfaces;
using OrderProcessing.Application.Messages;
using OrderProcessing.Domain.Common;
using OrderProcessing.Domain.Entities;
using OrderProcessing.Domain.Enums;

namespace OrderProcessing.Application.Orders.Commands.CreateOrder;

public class CreateOrderHandler(
    IOrderRepository orderRepository,
    IProductRepository productRepository,
    IInventoryReservationRepository reservationRepository,
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

        List<OrderItem> items = itemResults.Select(r => r.Value).ToList();

        Result<Order, DomainError> orderResult = Order.Create(command.CustomerId, items);
        if (orderResult.IsFailure) return orderResult.Error;

        Order order = orderResult.Value;

        // Reduce inventory — convert reservations if provided, otherwise direct deduct
        Result<bool, DomainError> stockResult = command.ReservationIds is { Count: > 0 }
            ? await ConvertReservationsAsync(command.ReservationIds, order.Id, items, ct).ConfigureAwait(false)
            : await DirectDeductStockAsync(items, ct).ConfigureAwait(false);

        if (stockResult.IsFailure) return stockResult.Error;

        await orderRepository.AddAsync(order, ct).ConfigureAwait(false);

        try
        {
            await eventBus.PublishAsync(new OrderCreatedMessage(
                order.Id, order.CustomerId, order.TotalAmount, "Customer", order.CreatedAt), ct)
                .ConfigureAwait(false);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Failed to publish OrderCreatedMessage for order {OrderId}", order.Id);
        }

        return order.ToDto();
    }

    private async Task<Result<bool, DomainError>> ConvertReservationsAsync(
        List<Guid> reservationIds, Guid orderId, List<OrderItem> items, CancellationToken ct)
    {
        List<InventoryReservation> reservations = await reservationRepository
            .GetByIdsAsync(reservationIds, ct).ConfigureAwait(false);

        List<string> externalIds = reservations.Select(r => r.ExternalProductId).Distinct().ToList();
        List<Product> products = await productRepository
            .GetByExternalIdsAsync(externalIds, ct).ConfigureAwait(false);

        foreach (InventoryReservation reservation in reservations.Where(r => r.Status == ReservationStatus.Active))
        {
            Product? product = products.FirstOrDefault(p => p.ExternalId == reservation.ExternalProductId);
            if (product is null) continue;

            OrderItem? matchingItem = items.FirstOrDefault(i => i.ProductId == reservation.ExternalProductId);
            int qty = matchingItem?.Quantity ?? reservation.Quantity;

            Result<Product, DomainError> result = product.ConfirmSale(qty);
            if (result.IsFailure) return result.Error;

            reservation.Convert(orderId);
        }

        await productRepository.UpdateRangeAsync(products, ct).ConfigureAwait(false);
        await reservationRepository.UpdateRangeAsync(reservations, ct).ConfigureAwait(false);
        return true;
    }

    private async Task<Result<bool, DomainError>> DirectDeductStockAsync(
        List<OrderItem> items, CancellationToken ct)
    {
        List<string> externalIds = items.Select(i => i.ProductId).ToList();
        List<Product> products = await productRepository
            .GetByExternalIdsAsync(externalIds, ct).ConfigureAwait(false);

        foreach (OrderItem item in items)
        {
            Product? product = products.FirstOrDefault(p => p.ExternalId == item.ProductId);
            if (product is null)
            {
                logger.LogWarning("Stock deduct skipped: product {ProductId} not in inventory", item.ProductId);
                continue;
            }

            Result<Product, DomainError> result = product.ConfirmSale(item.Quantity);
            if (result.IsFailure) return result.Error;
        }

        await productRepository.UpdateRangeAsync(products, ct).ConfigureAwait(false);
        return true;
    }
}
