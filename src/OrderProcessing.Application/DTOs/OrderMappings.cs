using OrderProcessing.Domain.Entities;

namespace OrderProcessing.Application.DTOs;

public static class OrderMappings
{
    public static OrderDto ToDto(this Order order) => new(
        order.Id,
        order.CustomerId,
        order.Status.ToString(),
        order.TotalAmount,
        order.CreatedAt,
        order.UpdatedAt,
        order.CancelledAt,
        order.CancellationReason,
        order.Items.Select(i => i.ToDto()).ToList());

    public static OrderItemDto ToDto(this OrderItem item) => new(
        item.Id,
        item.ProductId,
        item.ProductName,
        item.Quantity,
        item.UnitPrice,
        item.Subtotal);
}
