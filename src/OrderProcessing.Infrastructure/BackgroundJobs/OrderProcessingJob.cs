using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using OrderProcessing.Application.Interfaces;
using OrderProcessing.Application.Messages;
using OrderProcessing.Domain.Enums;
using System.Diagnostics;

namespace OrderProcessing.Infrastructure.BackgroundJobs;

public class OrderProcessingJob(
    IServiceScopeFactory scopeFactory,
    ILogger<OrderProcessingJob> logger) : BackgroundService
{
    private static readonly TimeSpan Interval = TimeSpan.FromMinutes(5);
    private static readonly TimeSpan MinOrderAge = TimeSpan.FromMinutes(1);

    public DateTimeOffset LastRunAt { get; private set; } = DateTimeOffset.MinValue;

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(Interval);
        while (!stoppingToken.IsCancellationRequested && await timer.WaitForNextTickAsync(stoppingToken))
        {
            await RunBatchAsync(stoppingToken);
        }
    }

    private async Task RunBatchAsync(CancellationToken ct)
    {
        logger.LogInformation("OrderProcessingJob starting batch run at {Time}", DateTimeOffset.UtcNow);
        var sw = Stopwatch.StartNew();

        try
        {
            using var scope = scopeFactory.CreateScope();
            IOrderRepository orderRepo = scope.ServiceProvider.GetRequiredService<IOrderRepository>();
            IEventBus eventBus = scope.ServiceProvider.GetRequiredService<IEventBus>();

            DateTimeOffset cutoff = DateTimeOffset.UtcNow - MinOrderAge;
            var pendingOrders = await orderRepo.GetPendingOrdersOlderThanAsync(cutoff, ct).ConfigureAwait(false);

            if (pendingOrders.Count == 0)
            {
                logger.LogInformation("OrderProcessingJob: no eligible PENDING orders found");
                LastRunAt = DateTimeOffset.UtcNow;
                return;
            }

            var orderIds = pendingOrders.Select(o => o.Id).ToList();
            await orderRepo.BatchUpdateStatusAsync(orderIds, OrderStatus.Processing, ct).ConfigureAwait(false);

            DateTimeOffset occurredAt = DateTimeOffset.UtcNow;
            foreach (Guid orderId in orderIds)
            {
                try
                {
                    await eventBus.PublishAsync(new OrderStatusChangedMessage(
                        orderId, "Pending", "Processing", "BackgroundJob", occurredAt), ct)
                        .ConfigureAwait(false);
                }
                catch (Exception ex)
                {
                    logger.LogWarning(ex, "Failed to publish OrderStatusChangedMessage for order {OrderId} in batch — skipping", orderId);
                }
            }

            sw.Stop();
            logger.LogInformation(
                "OrderProcessingJob completed: {Count} orders → PROCESSING in {Ms}ms. OrderIds: [{Ids}]",
                orderIds.Count, sw.ElapsedMilliseconds, string.Join(", ", orderIds));

            LastRunAt = DateTimeOffset.UtcNow;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "OrderProcessingJob batch run failed");
            LastRunAt = DateTimeOffset.UtcNow;
        }
    }
}
