using OrderProcessing.Domain.Common;

namespace OrderProcessing.Domain.Events;

public record OrderCreatedEvent(
    Guid EventId,
    DateTimeOffset OccurredAt,
    Guid OrderId,
    string CustomerId,
    decimal TotalAmount) : IDomainEvent
{
    public static OrderCreatedEvent Create(Guid orderId, string customerId, decimal totalAmount)
        => new(Guid.NewGuid(), DateTimeOffset.UtcNow, orderId, customerId, totalAmount);
}
