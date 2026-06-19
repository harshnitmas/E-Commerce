using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace OrderProcessing.Infrastructure.Persistence.MongoDB;

public class OrderAuditDocument
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = ObjectId.GenerateNewId().ToString();

    [BsonElement("order_id")]
    public string OrderId { get; set; } = string.Empty;

    [BsonElement("event_type")]
    public string EventType { get; set; } = string.Empty;

    [BsonElement("previous_status")]
    public string? PreviousStatus { get; set; }

    [BsonElement("new_status")]
    public string NewStatus { get; set; } = string.Empty;

    [BsonElement("triggered_by")]
    public string TriggeredBy { get; set; } = string.Empty;

    [BsonElement("occurred_at")]
    public DateTimeOffset OccurredAt { get; set; }
}
