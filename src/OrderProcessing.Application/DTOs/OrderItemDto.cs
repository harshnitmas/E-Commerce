namespace OrderProcessing.Application.DTOs;

public record OrderItemDto(
    Guid OrderItemId,
    Guid ProductId,
    string ProductName,
    int Quantity,
    decimal UnitPrice,
    decimal Subtotal);
