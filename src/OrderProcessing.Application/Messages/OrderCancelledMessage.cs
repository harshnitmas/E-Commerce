namespace OrderProcessing.Application.Messages;

public record OrderCancelledMessage(
    Guid OrderId,
    string Reason,
    string TriggeredBy,
    DateTimeOffset OccurredAt);
