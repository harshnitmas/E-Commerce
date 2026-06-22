using MediatR;
using OrderProcessing.Application.DTOs;
using OrderProcessing.Application.Interfaces;
using OrderProcessing.Domain.Common;
using OrderProcessing.Domain.Entities;
using OrderProcessing.Domain.Errors;

namespace OrderProcessing.Application.Inventory.Commands.ReserveStock;

public class ReserveStockHandler(
    IProductRepository productRepository,
    IInventoryReservationRepository reservationRepository)
    : IRequestHandler<ReserveStockCommand, Result<List<ReservationDto>, DomainError>>
{
    private static readonly TimeSpan RESERVATION_TTL = TimeSpan.FromMinutes(15);

    public async Task<Result<List<ReservationDto>, DomainError>> Handle(
        ReserveStockCommand command, CancellationToken ct)
    {
        List<string> externalIds = command.Items.Select(i => i.ExternalProductId).ToList();
        List<Product> products = await productRepository.GetByExternalIdsAsync(externalIds, ct).ConfigureAwait(false);

        var reservations = new List<InventoryReservation>();
        var updatedProducts = new List<Product>();

        foreach (ReserveStockItemInput item in command.Items)
        {
            Product? product = products.FirstOrDefault(p => p.ExternalId == item.ExternalProductId);
            if (product is null)
                return DomainErrors.Inventory.ProductNotFound;

            Result<Product, DomainError> reserveResult = product.Reserve(item.Quantity);
            if (reserveResult.IsFailure)
                return reserveResult.Error;

            InventoryReservation reservation = InventoryReservation.Create(
                product.Id, product.ExternalId, command.CustomerId, item.Quantity, RESERVATION_TTL);

            reservations.Add(reservation);
            updatedProducts.Add(product);
        }

        await productRepository.UpdateRangeAsync(updatedProducts, ct).ConfigureAwait(false);

        foreach (InventoryReservation reservation in reservations)
            await reservationRepository.AddAsync(reservation, ct).ConfigureAwait(false);

        List<ReservationDto> dtos = reservations
            .Select(r => new ReservationDto(r.Id, r.ExternalProductId, r.Quantity, r.ExpiresAt))
            .ToList();

        return dtos;
    }
}
