using OrderProcessing.Domain.Common;
using OrderProcessing.Domain.Enums;

namespace OrderProcessing.Domain.Events;

public record OrderStatusChangedEvent(
    Guid EventId,
    DateTimeOffset OccurredAt,
    Guid OrderId,
    OrderStatus PreviousStatus,
    OrderStatus NewStatus,
    string TriggeredBy) : IDomainEvent
{
    public static OrderStatusChangedEvent Create(
        Guid orderId, OrderStatus previous, OrderStatus next, string triggeredBy)
        => new(Guid.NewGuid(), DateTimeOffset.UtcNow, orderId, previous, next, triggeredBy);
}
