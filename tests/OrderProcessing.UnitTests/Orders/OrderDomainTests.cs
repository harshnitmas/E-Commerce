using FluentAssertions;
using OrderProcessing.Domain.Common;
using OrderProcessing.Domain.Entities;
using OrderProcessing.Domain.Enums;
using OrderProcessing.Domain.Errors;

namespace OrderProcessing.UnitTests.Orders;

public class OrderDomainTests
{
    private static OrderItem CreateValidItem(string productName = "Widget", int quantity = 2, decimal unitPrice = 9.99m)
    {
        Result<OrderItem, DomainError> result = OrderItem.Create(Guid.Empty, "prod-1", productName, quantity, unitPrice);
        result.IsSuccess.Should().BeTrue("test setup must create a valid item");
        return result.Value;
    }

    [Fact]
    public void Create_WithEmptyItemsList_ReturnsMustHaveItemsError()
    {
        // Act
        Result<Order, DomainError> result = Order.Create("cust-1", []);

        // Assert
        result.IsFailure.Should().BeTrue();
        result.Error.Code.Should().Be(DomainErrors.Order.MustHaveItems.Code);
    }

    [Fact]
    public void Create_WithValidItems_ReturnsSuccessWithPendingStatusAndCorrectTotal()
    {
        // Arrange
        List<OrderItem> items =
        [
            CreateValidItem("Widget A", quantity: 2, unitPrice: 10.00m),
            CreateValidItem("Widget B", quantity: 1, unitPrice: 5.50m),
        ];

        // Act
        Result<Order, DomainError> result = Order.Create("cust-1", items);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value.Status.Should().Be(OrderStatus.Pending);
        result.Value.TotalAmount.Should().Be(25.50m);
        result.Value.Items.Should().HaveCount(2);
        result.Value.CustomerId.Should().Be("cust-1");
    }

    [Fact]
    public void Cancel_WhenStatusIsProcessing_ReturnsCanOnlyCancelPendingError()
    {
        // Arrange
        List<OrderItem> items = [CreateValidItem()];
        Order order = Order.Create("cust-1", items).Value;
        order.UpdateStatus(OrderStatus.Processing);

        // Act
        Result<Order, DomainError> result = order.Cancel("Changed my mind");

        // Assert
        result.IsFailure.Should().BeTrue();
        result.Error.Code.Should().Be(DomainErrors.Order.CanOnlyCancelPending.Code);
    }

    [Fact]
    public void Cancel_WithEmptyReason_ReturnsCancellationReasonRequiredError()
    {
        // Arrange
        List<OrderItem> items = [CreateValidItem()];
        Order order = Order.Create("cust-1", items).Value;

        // Act
        Result<Order, DomainError> result = order.Cancel("   ");

        // Assert
        result.IsFailure.Should().BeTrue();
        result.Error.Code.Should().Be(DomainErrors.Order.CancellationReasonRequired.Code);
    }

    [Fact]
    public void Cancel_WhenPendingWithValidReason_ReturnsSuccessWithCancelledStatusAndReasonSet()
    {
        // Arrange
        List<OrderItem> items = [CreateValidItem()];
        Order order = Order.Create("cust-1", items).Value;

        // Act
        Result<Order, DomainError> result = order.Cancel("No longer needed");

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value.Status.Should().Be(OrderStatus.Cancelled);
        result.Value.CancellationReason.Should().Be("No longer needed");
        result.Value.CancelledAt.Should().NotBeNull();
    }

    [Fact]
    public void UpdateStatus_WithInvalidTransitionPendingToShipped_ReturnsInvalidStatusTransitionError()
    {
        // Arrange
        List<OrderItem> items = [CreateValidItem()];
        Order order = Order.Create("cust-1", items).Value;

        // Act — Pending → Shipped is not a valid transition
        Result<Order, DomainError> result = order.UpdateStatus(OrderStatus.Shipped);

        // Assert
        result.IsFailure.Should().BeTrue();
        result.Error.Code.Should().Be("Order.InvalidStatusTransition");
    }

    [Fact]
    public void UpdateStatus_WithValidTransitionPendingToProcessing_ReturnsSuccess()
    {
        // Arrange
        List<OrderItem> items = [CreateValidItem()];
        Order order = Order.Create("cust-1", items).Value;

        // Act
        Result<Order, DomainError> result = order.UpdateStatus(OrderStatus.Processing);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value.Status.Should().Be(OrderStatus.Processing);
    }
}
