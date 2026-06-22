using Microsoft.EntityFrameworkCore;
using OrderProcessing.Application.Interfaces;
using OrderProcessing.Domain.Entities;
using OrderProcessing.Domain.Enums;
using OrderProcessing.Infrastructure.Persistence.PostgreSQL;

namespace OrderProcessing.Infrastructure.Repositories;

public class InventoryReservationRepository(AppDbContext db) : IInventoryReservationRepository
{
    public async Task<InventoryReservation?> GetByIdAsync(Guid id, CancellationToken ct = default) =>
        await db.InventoryReservations.FindAsync([id], ct).ConfigureAwait(false);

    public async Task<List<InventoryReservation>> GetByIdsAsync(
        IEnumerable<Guid> ids, CancellationToken ct = default)
    {
        List<Guid> idList = ids.ToList();
        return await db.InventoryReservations
            .Where(r => idList.Contains(r.Id))
            .ToListAsync(ct).ConfigureAwait(false);
    }

    public async Task<List<InventoryReservation>> GetExpiredActiveAsync(CancellationToken ct = default) =>
        await db.InventoryReservations
            .Where(r => r.Status == ReservationStatus.Active && r.ExpiresAt <= DateTimeOffset.UtcNow)
            .ToListAsync(ct).ConfigureAwait(false);

    public async Task AddAsync(InventoryReservation reservation, CancellationToken ct = default)
    {
        await db.InventoryReservations.AddAsync(reservation, ct).ConfigureAwait(false);
        await db.SaveChangesAsync(ct).ConfigureAwait(false);
    }

    public async Task UpdateAsync(InventoryReservation reservation, CancellationToken ct = default)
    {
        db.InventoryReservations.Update(reservation);
        await db.SaveChangesAsync(ct).ConfigureAwait(false);
    }

    public async Task UpdateRangeAsync(IEnumerable<InventoryReservation> reservations, CancellationToken ct = default)
    {
        db.InventoryReservations.UpdateRange(reservations);
        await db.SaveChangesAsync(ct).ConfigureAwait(false);
    }
}
