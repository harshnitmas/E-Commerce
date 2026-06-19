using OrderProcessing.Domain.Common;
using OrderProcessing.Domain.Errors;

namespace OrderProcessing.Domain.Entities;

public class OrderItem : Entity<Guid>
{
    public Guid OrderId { get; private set; }
    public Guid ProductId { get; private set; }
    public string ProductName { get; private set; } = string.Empty;
    public int Quantity { get; private set; }
    public decimal UnitPrice { get; private set; }
    public decimal Subtotal => Quantity * UnitPrice;

    private OrderItem() { }

    public static Result<OrderItem, DomainError> Create(
        Guid orderId, Guid productId, string productName, int quantity, decimal unitPrice)
    {
        if (string.IsNullOrWhiteSpace(productName))
            return DomainErrors.OrderItem.ProductNameRequired;
        if (quantity < 1)
            return DomainErrors.OrderItem.QuantityMustBePositive;
        if (unitPrice <= 0)
            return DomainErrors.OrderItem.PriceMustBePositive;

        return new OrderItem
        {
            Id = Guid.NewGuid(),
            OrderId = orderId,
            ProductId = productId,
            ProductName = productName.Trim(),
            Quantity = quantity,
            UnitPrice = unitPrice
        };
    }
}
