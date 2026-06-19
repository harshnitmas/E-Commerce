using MassTransit;
using Microsoft.Extensions.Logging;
using OrderProcessing.Application.DTOs;
using OrderProcessing.Application.Interfaces;
using OrderProcessing.Application.Messages;

namespace OrderProcessing.Infrastructure.Messaging.Consumers;

public class OrderStatusChangedConsumer(
    IOrderAuditRepository auditRepository,
    IOrderCacheService cacheService,
    ILogger<OrderStatusChangedConsumer> logger) : IConsumer<OrderStatusChangedMessage>
{
    public async Task Consume(ConsumeContext<OrderStatusChangedMessage> context)
    {
        OrderStatusChangedMessage msg = context.Message;

        try
        {
            await auditRepository.AppendAsync(new AuditEventDto(
                string.Empty,
                msg.OrderId.ToString(),
                "StatusChanged",
                msg.PreviousStatus,
                msg.NewStatus,
                msg.TriggeredBy,
                msg.OccurredAt), context.CancellationToken).ConfigureAwait(false);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Failed to write audit for StatusChanged {OrderId}", msg.OrderId);
        }

        try
        {
            await cacheService.InvalidateListAsync(context.CancellationToken).ConfigureAwait(false);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Failed to invalidate Redis cache after StatusChanged {OrderId}", msg.OrderId);
        }
    }
}
