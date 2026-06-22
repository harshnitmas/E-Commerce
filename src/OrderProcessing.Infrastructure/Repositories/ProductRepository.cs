using Microsoft.EntityFrameworkCore;
using OrderProcessing.Application.Interfaces;
using OrderProcessing.Domain.Entities;
using OrderProcessing.Infrastructure.Persistence.PostgreSQL;

namespace OrderProcessing.Infrastructure.Repositories;

public class ProductRepository(AppDbContext db) : IProductRepository
{
    public async Task<List<Product>> GetAllAsync(CancellationToken ct = default) =>
        await db.Products.AsNoTracking().ToListAsync(ct).ConfigureAwait(false);

    public async Task<Product?> GetByExternalIdAsync(string externalId, CancellationToken ct = default) =>
        await db.Products.FirstOrDefaultAsync(p => p.ExternalId == externalId, ct).ConfigureAwait(false);

    public async Task<List<Product>> GetByExternalIdsAsync(
        IEnumerable<string> externalIds, CancellationToken ct = default)
    {
        List<string> ids = externalIds.ToList();
        return await db.Products
            .Where(p => ids.Contains(p.ExternalId))
            .ToListAsync(ct).ConfigureAwait(false);
    }

    public async Task AddRangeAsync(IEnumerable<Product> products, CancellationToken ct = default)
    {
        await db.Products.AddRangeAsync(products, ct).ConfigureAwait(false);
        await db.SaveChangesAsync(ct).ConfigureAwait(false);
    }

    public async Task UpdateAsync(Product product, CancellationToken ct = default)
    {
        db.Products.Update(product);
        await db.SaveChangesAsync(ct).ConfigureAwait(false);
    }

    public async Task UpdateRangeAsync(IEnumerable<Product> products, CancellationToken ct = default)
    {
        db.Products.UpdateRange(products);
        await db.SaveChangesAsync(ct).ConfigureAwait(false);
    }
}
