using MassTransit;
using Microsoft.Extensions.Logging;
using OrderProcessing.Application.DTOs;
using OrderProcessing.Application.Interfaces;
using OrderProcessing.Application.Messages;

namespace OrderProcessing.Infrastructure.Messaging.Consumers;

public class OrderCreatedConsumer(
    IOrderAuditRepository auditRepository,
    ILogger<OrderCreatedConsumer> logger) : IConsumer<OrderCreatedMessage>
{
    public async Task Consume(ConsumeContext<OrderCreatedMessage> context)
    {
        OrderCreatedMessage msg = context.Message;
        try
        {
            await auditRepository.AppendAsync(new AuditEventDto(
                string.Empty,
                msg.OrderId.ToString(),
                "OrderCreated",
                null,
                "Pending",
                msg.TriggeredBy,
                msg.OccurredAt), context.CancellationToken).ConfigureAwait(false);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Failed to write audit for OrderCreated {OrderId}", msg.OrderId);
        }
    }
}
