using OrderProcessing.Domain.Common;
using OrderProcessing.Domain.Enums;
using OrderProcessing.Domain.Errors;
using OrderProcessing.Domain.Events;

namespace OrderProcessing.Domain.Entities;

public class Order : AggregateRoot<Guid>
{
    private readonly List<OrderItem> _items = [];

    public string CustomerId { get; private set; } = string.Empty;
    public OrderStatus Status { get; private set; }
    public decimal TotalAmount { get; private set; }
    public DateTimeOffset CreatedAt { get; private set; }
    public DateTimeOffset UpdatedAt { get; private set; }
    public DateTimeOffset? CancelledAt { get; private set; }
    public string? CancellationReason { get; private set; }

    public IReadOnlyList<OrderItem> Items => _items.AsReadOnly();

    private Order() { }

    public static Result<Order, DomainError> Create(string customerId, List<OrderItem> items)
    {
        if (items.Count == 0)
            return DomainErrors.Order.MustHaveItems;

        var orderId = Guid.NewGuid();
        var now = DateTimeOffset.UtcNow;

        var order = new Order
        {
            Id = orderId,
            CustomerId = customerId,
            Status = OrderStatus.Pending,
            CreatedAt = now,
            UpdatedAt = now
        };

        foreach (var item in items)
            order._items.Add(item);

        order.TotalAmount = order._items.Sum(i => i.Subtotal);
        order.AddDomainEvent(OrderCreatedEvent.Create(orderId, customerId, order.TotalAmount));

        return order;
    }

    public Result<Order, DomainError> UpdateStatus(OrderStatus newStatus, string triggeredBy = "Admin")
    {
        if (Status == OrderStatus.Cancelled)
            return DomainErrors.Order.AlreadyCancelled;

        if (!IsValidTransition(Status, newStatus))
            return DomainErrors.Order.InvalidStatusTransition(Status.ToString(), newStatus.ToString());

        var previous = Status;
        Status = newStatus;
        UpdatedAt = DateTimeOffset.UtcNow;

        AddDomainEvent(OrderStatusChangedEvent.Create(Id, previous, newStatus, triggeredBy));

        return this;
    }

    public Result<Order, DomainError> Cancel(string reason, string triggeredBy = "Customer")
    {
        if (Status != OrderStatus.Pending)
            return DomainErrors.Order.CanOnlyCancelPending;

        if (string.IsNullOrWhiteSpace(reason))
            return DomainErrors.Order.CancellationReasonRequired;

        var previous = Status;
        Status = OrderStatus.Cancelled;
        CancelledAt = DateTimeOffset.UtcNow;
        UpdatedAt = DateTimeOffset.UtcNow;
        CancellationReason = reason.Trim();

        AddDomainEvent(OrderStatusChangedEvent.Create(Id, previous, OrderStatus.Cancelled, triggeredBy));
        AddDomainEvent(OrderCancelledEvent.Create(Id, CustomerId, reason));

        return this;
    }

    private static bool IsValidTransition(OrderStatus from, OrderStatus to) => (from, to) switch
    {
        (OrderStatus.Pending, OrderStatus.Processing) => true,
        (OrderStatus.Processing, OrderStatus.Shipped) => true,
        (OrderStatus.Shipped, OrderStatus.Delivered) => true,
        _ => false
    };
}
