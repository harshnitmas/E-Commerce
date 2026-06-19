using MongoDB.Driver;
using OrderProcessing.Application.DTOs;
using OrderProcessing.Application.Interfaces;

namespace OrderProcessing.Infrastructure.Persistence.MongoDB;

public class OrderAuditRepository(IMongoDatabase database) : IOrderAuditRepository
{
    private readonly IMongoCollection<OrderAuditDocument> _collection =
        database.GetCollection<OrderAuditDocument>("order_audit_events");

    public async Task AppendAsync(AuditEventDto auditEvent, CancellationToken ct = default)
    {
        var document = new OrderAuditDocument
        {
            OrderId = auditEvent.OrderId,
            EventType = auditEvent.EventType,
            PreviousStatus = auditEvent.PreviousStatus,
            NewStatus = auditEvent.NewStatus,
            TriggeredBy = auditEvent.TriggeredBy,
            OccurredAt = auditEvent.OccurredAt
        };
        await _collection.InsertOneAsync(document, cancellationToken: ct);
    }

    public async Task<List<AuditEventDto>> GetByOrderIdAsync(Guid orderId, CancellationToken ct = default)
    {
        var filter = Builders<OrderAuditDocument>.Filter.Eq(d => d.OrderId, orderId.ToString());
        var sort = Builders<OrderAuditDocument>.Sort.Descending(d => d.OccurredAt);

        var documents = await _collection
            .Find(filter)
            .Sort(sort)
            .ToListAsync(ct);

        return documents.Select(d => new AuditEventDto(
            d.Id,
            d.OrderId,
            d.EventType,
            d.PreviousStatus,
            d.NewStatus,
            d.TriggeredBy,
            d.OccurredAt)).ToList();
    }
}
