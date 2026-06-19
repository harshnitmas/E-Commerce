using MassTransit;
using OrderProcessing.Application.Interfaces;

namespace OrderProcessing.Infrastructure.Messaging;

public class MassTransitEventBus(IPublishEndpoint publishEndpoint) : IEventBus
{
    public Task PublishAsync<T>(T message, CancellationToken ct = default) where T : class
        => publishEndpoint.Publish(message, ct);
}
