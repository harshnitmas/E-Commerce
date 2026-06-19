namespace OrderProcessing.Application.DTOs;

public record AuditEventDto(
    string Id,
    string OrderId,
    string EventType,
    string? PreviousStatus,
    string NewStatus,
    string TriggeredBy,
    DateTimeOffset OccurredAt);
