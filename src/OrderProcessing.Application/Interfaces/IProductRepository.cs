using OrderProcessing.Domain.Entities;

namespace OrderProcessing.Application.Interfaces;

public interface IProductRepository
{
    Task<List<Product>> GetAllAsync(CancellationToken ct = default);
    Task<Product?> GetByExternalIdAsync(string externalId, CancellationToken ct = default);
    Task<List<Product>> GetByExternalIdsAsync(IEnumerable<string> externalIds, CancellationToken ct = default);
    Task AddRangeAsync(IEnumerable<Product> products, CancellationToken ct = default);
    Task UpdateAsync(Product product, CancellationToken ct = default);
    Task UpdateRangeAsync(IEnumerable<Product> products, CancellationToken ct = default);
}
