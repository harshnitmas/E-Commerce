using OrderProcessing.Domain.Common;
using OrderProcessing.Domain.Enums;

namespace OrderProcessing.Domain.Entities;

public class InventoryReservation : Entity<Guid>
{
    public Guid ProductId { get; private set; }
    public string ExternalProductId { get; private set; } = string.Empty;
    public string CustomerId { get; private set; } = string.Empty;
    public int Quantity { get; private set; }
    public DateTimeOffset ExpiresAt { get; private set; }
    public ReservationStatus Status { get; private set; }
    public DateTimeOffset CreatedAt { get; private set; }
    public Guid? ConvertedOrderId { get; private set; }

    private InventoryReservation() { }

    public static InventoryReservation Create(
        Guid productId, string externalProductId, string customerId,
        int quantity, TimeSpan ttl)
    {
        return new InventoryReservation
        {
            Id = Guid.NewGuid(),
            ProductId = productId,
            ExternalProductId = externalProductId,
            CustomerId = customerId,
            Quantity = quantity,
            ExpiresAt = DateTimeOffset.UtcNow.Add(ttl),
            Status = ReservationStatus.Active,
            CreatedAt = DateTimeOffset.UtcNow
        };
    }

    public bool IsExpired => DateTimeOffset.UtcNow >= ExpiresAt;

    public void Convert(Guid orderId)
    {
        Status = ReservationStatus.Converted;
        ConvertedOrderId = orderId;
    }

    public void Release()
    {
        Status = ReservationStatus.Released;
    }

    public void MarkExpired()
    {
        Status = ReservationStatus.Expired;
    }
}
