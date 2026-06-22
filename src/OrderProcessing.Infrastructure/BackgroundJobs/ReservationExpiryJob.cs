using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using OrderProcessing.Application.Interfaces;
using OrderProcessing.Domain.Entities;
using OrderProcessing.Domain.Enums;

namespace OrderProcessing.Infrastructure.BackgroundJobs;

public class ReservationExpiryJob(
    IServiceScopeFactory scopeFactory,
    ILogger<ReservationExpiryJob> logger) : BackgroundService
{
    private static readonly TimeSpan Interval = TimeSpan.FromMinutes(1);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using PeriodicTimer timer = new(Interval);
        while (!stoppingToken.IsCancellationRequested && await timer.WaitForNextTickAsync(stoppingToken))
        {
            try
            {
                await ExpireStaleReservationsAsync(stoppingToken).ConfigureAwait(false);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "ReservationExpiryJob iteration failed");
            }
        }
    }

    private async Task ExpireStaleReservationsAsync(CancellationToken ct)
    {
        using IServiceScope scope = scopeFactory.CreateScope();
        IInventoryReservationRepository reservationRepo =
            scope.ServiceProvider.GetRequiredService<IInventoryReservationRepository>();
        IProductRepository productRepo =
            scope.ServiceProvider.GetRequiredService<IProductRepository>();

        List<InventoryReservation> expired = await reservationRepo.GetExpiredActiveAsync(ct).ConfigureAwait(false);
        if (expired.Count == 0) return;

        List<string> externalIds = expired.Select(r => r.ExternalProductId).Distinct().ToList();
        List<Product> products = await productRepo.GetByExternalIdsAsync(externalIds, ct).ConfigureAwait(false);

        foreach (InventoryReservation reservation in expired)
        {
            Product? product = products.FirstOrDefault(p => p.ExternalId == reservation.ExternalProductId);
            product?.ReleaseReservation(reservation.Quantity);
            reservation.MarkExpired();
        }

        await productRepo.UpdateRangeAsync(products, ct).ConfigureAwait(false);
        await reservationRepo.UpdateRangeAsync(expired, ct).ConfigureAwait(false);

        logger.LogInformation("ReservationExpiryJob: expired {Count} stale reservations", expired.Count);
    }
}
