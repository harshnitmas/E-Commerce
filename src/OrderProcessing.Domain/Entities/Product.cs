using OrderProcessing.Domain.Common;
using OrderProcessing.Domain.Errors;

namespace OrderProcessing.Domain.Entities;

public class Product : AggregateRoot<Guid>
{
    public string ExternalId { get; private set; } = string.Empty;
    public string Name { get; private set; } = string.Empty;
    public string Sku { get; private set; } = string.Empty;
    public decimal Price { get; private set; }
    public string Category { get; private set; } = string.Empty;
    public string ImageUrl { get; private set; } = string.Empty;
    public int StockQuantity { get; private set; }
    public int ReservedQuantity { get; private set; }
    public int AvailableQuantity => StockQuantity - ReservedQuantity;
    public bool InStock => AvailableQuantity > 0;

    private Product() { }

    public static Product Create(
        string externalId, string name, string sku,
        decimal price, string category, string imageUrl, int stockQuantity)
    {
        return new Product
        {
            Id = Guid.NewGuid(),
            ExternalId = externalId,
            Name = name,
            Sku = sku,
            Price = price,
            Category = category,
            ImageUrl = imageUrl,
            StockQuantity = stockQuantity,
            ReservedQuantity = 0
        };
    }

    public Result<Product, DomainError> Reserve(int quantity)
    {
        if (quantity < 1)
            return DomainErrors.Inventory.QuantityMustBePositive;

        if (AvailableQuantity < quantity)
            return DomainErrors.Inventory.InsufficientStock(Name, AvailableQuantity);

        ReservedQuantity += quantity;
        return this;
    }

    public Result<Product, DomainError> ReleaseReservation(int quantity)
    {
        if (quantity < 1)
            return DomainErrors.Inventory.QuantityMustBePositive;

        ReservedQuantity = Math.Max(0, ReservedQuantity - quantity);
        return this;
    }

    public Result<Product, DomainError> ConfirmSale(int quantity)
    {
        if (StockQuantity < quantity)
            return DomainErrors.Inventory.InsufficientStock(Name, StockQuantity);

        StockQuantity -= quantity;
        ReservedQuantity = Math.Max(0, ReservedQuantity - quantity);
        return this;
    }

    public void RestoreStock(int quantity)
    {
        StockQuantity += quantity;
    }

    public void SetStock(int quantity)
    {
        StockQuantity = Math.Max(0, quantity);
    }
}
