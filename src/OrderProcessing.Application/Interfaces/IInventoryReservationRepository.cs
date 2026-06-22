using OrderProcessing.Domain.Entities;

namespace OrderProcessing.Application.Interfaces;

public interface IInventoryReservationRepository
{
    Task<InventoryReservation?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<List<InventoryReservation>> GetByIdsAsync(IEnumerable<Guid> ids, CancellationToken ct = default);
    Task<List<InventoryReservation>> GetExpiredActiveAsync(CancellationToken ct = default);
    Task AddAsync(InventoryReservation reservation, CancellationToken ct = default);
    Task UpdateAsync(InventoryReservation reservation, CancellationToken ct = default);
    Task UpdateRangeAsync(IEnumerable<InventoryReservation> reservations, CancellationToken ct = default);
}
