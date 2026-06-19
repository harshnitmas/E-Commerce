namespace OrderProcessing.Application.DTOs;

public record OrderDto(
    Guid OrderId,
    string CustomerId,
    string Status,
    decimal TotalAmount,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt,
    DateTimeOffset? CancelledAt,
    string? CancellationReason,
    List<OrderItemDto> Items);
