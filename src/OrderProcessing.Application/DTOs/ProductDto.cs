using OrderProcessing.Domain.Entities;

namespace OrderProcessing.Application.DTOs;

public record ProductDto(
    string ExternalId,
    string Name,
    string Sku,
    decimal Price,
    string Category,
    string ImageUrl,
    int StockQuantity,
    int ReservedQuantity,
    int AvailableQuantity,
    bool InStock);

public static class ProductMappingExtensions
{
    public static ProductDto ToDto(this Product p) => new(
        p.ExternalId, p.Name, p.Sku, p.Price,
        p.Category, p.ImageUrl,
        p.StockQuantity, p.ReservedQuantity, p.AvailableQuantity, p.InStock);
}
