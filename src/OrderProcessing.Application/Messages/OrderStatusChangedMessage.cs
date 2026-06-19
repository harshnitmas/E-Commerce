namespace OrderProcessing.Application.Messages;

public record OrderStatusChangedMessage(
    Guid OrderId,
    string PreviousStatus,
    string NewStatus,
    string TriggeredBy,
    DateTimeOffset OccurredAt);
