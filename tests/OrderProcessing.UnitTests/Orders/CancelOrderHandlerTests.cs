using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using OrderProcessing.Application.DTOs;
using OrderProcessing.Application.Interfaces;
using OrderProcessing.Application.Messages;
using OrderProcessing.Application.Orders.Commands.CancelOrder;
using OrderProcessing.Domain.Common;
using OrderProcessing.Domain.Entities;
using OrderProcessing.Domain.Enums;
using OrderProcessing.Domain.Errors;

namespace OrderProcessing.UnitTests.Orders;

public class CancelOrderHandlerTests
{
    private readonly Mock<IOrderRepository> _orderRepositoryMock = new();
    private readonly Mock<IEventBus> _eventBusMock = new();
    private readonly NullLogger<CancelOrderHandler> _logger = new();

    private CancelOrderHandler CreateHandler() =>
        new(_orderRepositoryMock.Object, _eventBusMock.Object, _logger);

    private static Order BuildPendingOrder()
    {
        Result<OrderItem, DomainError> itemResult = OrderItem.Create(Guid.Empty, "prod-1", "Widget", 1, 10.00m);
        itemResult.IsSuccess.Should().BeTrue();
        Result<Order, DomainError> orderResult = Order.Create("cust-1", [itemResult.Value]);
        orderResult.IsSuccess.Should().BeTrue();
        return orderResult.Value;
    }

    [Fact]
    public async Task Handle_WhenOrderNotFound_ReturnsNotFoundError()
    {
        // Arrange
        Guid orderId = Guid.NewGuid();
        _orderRepositoryMock
            .Setup(r => r.GetByIdAsync(orderId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Order?)null);

        CancelOrderCommand command = new(orderId, "Changed my mind");
        CancelOrderHandler handler = CreateHandler();

        // Act
        Result<OrderDto, DomainError> result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsFailure.Should().BeTrue();
        result.Error.Code.Should().Be(DomainErrors.Order.NotFound.Code);
    }

    [Fact]
    public async Task Handle_WhenOrderIsNotPending_ReturnsCanOnlyCancelPendingError()
    {
        // Arrange
        Order order = BuildPendingOrder();
        order.UpdateStatus(OrderStatus.Processing);

        _orderRepositoryMock
            .Setup(r => r.GetByIdAsync(order.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(order);

        CancelOrderCommand command = new(order.Id, "Changed my mind");
        CancelOrderHandler handler = CreateHandler();

        // Act
        Result<OrderDto, DomainError> result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsFailure.Should().BeTrue();
        result.Error.Code.Should().Be(DomainErrors.Order.CanOnlyCancelPending.Code);

        _orderRepositoryMock.Verify(r => r.UpdateAsync(It.IsAny<Order>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Handle_WhenOrderIsPendingWithValidReason_UpdatesRepoPublishesEventAndReturnsCancelledDto()
    {
        // Arrange
        Order order = BuildPendingOrder();

        _orderRepositoryMock
            .Setup(r => r.GetByIdAsync(order.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(order);

        _orderRepositoryMock
            .Setup(r => r.UpdateAsync(It.IsAny<Order>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        _eventBusMock
            .Setup(e => e.PublishAsync(It.IsAny<OrderCancelledMessage>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        CancelOrderCommand command = new(order.Id, "No longer needed");
        CancelOrderHandler handler = CreateHandler();

        // Act
        Result<OrderDto, DomainError> result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();

        OrderDto dto = result.Value;
        dto.Status.Should().Be("Cancelled");
        dto.CancellationReason.Should().Be("No longer needed");
        dto.CancelledAt.Should().NotBeNull();

        _orderRepositoryMock.Verify(r => r.UpdateAsync(It.IsAny<Order>(), It.IsAny<CancellationToken>()), Times.Once);
        _eventBusMock.Verify(e => e.PublishAsync(It.IsAny<OrderCancelledMessage>(), It.IsAny<CancellationToken>()), Times.Once);
    }
}
