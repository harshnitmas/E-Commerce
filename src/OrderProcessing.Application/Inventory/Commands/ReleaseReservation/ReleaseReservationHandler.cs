using MediatR;
using OrderProcessing.Application.Interfaces;
using OrderProcessing.Domain.Common;
using OrderProcessing.Domain.Entities;
using OrderProcessing.Domain.Enums;

namespace OrderProcessing.Application.Inventory.Commands.ReleaseReservation;

public class ReleaseReservationHandler(
    IInventoryReservationRepository reservationRepository,
    IProductRepository productRepository)
    : IRequestHandler<ReleaseReservationCommand, Result<bool, DomainError>>
{
    public async Task<Result<bool, DomainError>> Handle(
        ReleaseReservationCommand command, CancellationToken ct)
    {
        List<InventoryReservation> reservations = await reservationRepository
            .GetByIdsAsync(command.ReservationIds, ct).ConfigureAwait(false);

        List<InventoryReservation> active = reservations
            .Where(r => r.Status == ReservationStatus.Active)
            .ToList();

        if (active.Count == 0) return true;

        List<string> externalIds = active.Select(r => r.ExternalProductId).Distinct().ToList();
        List<Product> products = await productRepository
            .GetByExternalIdsAsync(externalIds, ct).ConfigureAwait(false);

        foreach (InventoryReservation reservation in active)
        {
            Product? product = products.FirstOrDefault(p => p.ExternalId == reservation.ExternalProductId);
            product?.ReleaseReservation(reservation.Quantity);
            reservation.Release();
        }

        await productRepository.UpdateRangeAsync(products, ct).ConfigureAwait(false);
        await reservationRepository.UpdateRangeAsync(active, ct).ConfigureAwait(false);

        return true;
    }
}
