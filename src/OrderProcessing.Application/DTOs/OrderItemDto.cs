namespace OrderProcessing.Application.DTOs;

public record OrderItemDto(
    Guid OrderItemId,
    string ProductId,
    string ProductName,
    int Quantity,
    decimal UnitPrice,
    decimal Subtotal);
