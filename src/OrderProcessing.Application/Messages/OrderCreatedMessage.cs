namespace OrderProcessing.Application.Messages;

public record OrderCreatedMessage(
    Guid OrderId,
    string CustomerId,
    decimal TotalAmount,
    string TriggeredBy,
    DateTimeOffset OccurredAt);
