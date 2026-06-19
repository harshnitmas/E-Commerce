using OrderProcessing.Domain.Common;

namespace OrderProcessing.Domain.Events;

public record OrderCancelledEvent(
    Guid EventId,
    DateTimeOffset OccurredAt,
    Guid OrderId,
    string CustomerId,
    string Reason) : IDomainEvent
{
    public static OrderCancelledEvent Create(Guid orderId, string customerId, string reason)
        => new(Guid.NewGuid(), DateTimeOffset.UtcNow, orderId, customerId, reason);
}
