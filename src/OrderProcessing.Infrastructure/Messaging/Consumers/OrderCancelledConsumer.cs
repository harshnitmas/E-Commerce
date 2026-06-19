using MassTransit;
using Microsoft.Extensions.Logging;
using OrderProcessing.Application.DTOs;
using OrderProcessing.Application.Interfaces;
using OrderProcessing.Application.Messages;

namespace OrderProcessing.Infrastructure.Messaging.Consumers;

public class OrderCancelledConsumer(
    IOrderAuditRepository auditRepository,
    IOrderCacheService cacheService,
    ILogger<OrderCancelledConsumer> logger) : IConsumer<OrderCancelledMessage>
{
    public async Task Consume(ConsumeContext<OrderCancelledMessage> context)
    {
        OrderCancelledMessage msg = context.Message;

        try
        {
            await auditRepository.AppendAsync(new AuditEventDto(
                string.Empty,
                msg.OrderId.ToString(),
                "OrderCancelled",
                "Pending",
                "Cancelled",
                msg.TriggeredBy,
                msg.OccurredAt), context.CancellationToken).ConfigureAwait(false);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Failed to write audit for OrderCancelled {OrderId}", msg.OrderId);
        }

        try
        {
            await cacheService.InvalidateListAsync(context.CancellationToken).ConfigureAwait(false);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Failed to invalidate Redis cache after OrderCancelled {OrderId}", msg.OrderId);
        }
    }
}
