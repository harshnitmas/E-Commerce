using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using OrderProcessing.Application.DTOs;
using OrderProcessing.Application.Interfaces;
using OrderProcessing.Application.Messages;
using OrderProcessing.Application.Orders.Commands.CreateOrder;
using OrderProcessing.Domain.Common;
using OrderProcessing.Domain.Entities;
using OrderProcessing.Domain.Errors;

namespace OrderProcessing.UnitTests.Orders;

public class CreateOrderHandlerTests
{
    private readonly Mock<IOrderRepository> _orderRepositoryMock = new();
    private readonly Mock<IEventBus> _eventBusMock = new();
    private readonly NullLogger<CreateOrderHandler> _logger = new();

    private CreateOrderHandler CreateHandler() =>
        new(_orderRepositoryMock.Object, _eventBusMock.Object, _logger);

    private static List<CreateOrderItemInput> ValidItems() =>
    [
        new CreateOrderItemInput("prod-1", "Widget A", 2, 15.00m)
    ];

    [Fact]
    public async Task Handle_WithEmptyItemsList_ReturnsMustHaveItemsValidationError()
    {
        // Arrange
        CreateOrderCommand command = new("cust-1", []);
        CreateOrderHandler handler = CreateHandler();

        // Act
        Result<OrderDto, DomainError> result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsFailure.Should().BeTrue();
        result.Error.Code.Should().Be(DomainErrors.Order.MustHaveItems.Code);

        _orderRepositoryMock.Verify(r => r.AddAsync(It.IsAny<Order>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Handle_WithValidCommand_CallsRepositoryPublishesEventAndReturnsOrderDto()
    {
        // Arrange
        _orderRepositoryMock
            .Setup(r => r.AddAsync(It.IsAny<Order>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        _eventBusMock
            .Setup(e => e.PublishAsync(It.IsAny<OrderCreatedMessage>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        CreateOrderCommand command = new("cust-42", ValidItems());
        CreateOrderHandler handler = CreateHandler();

        // Act
        Result<OrderDto, DomainError> result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();

        OrderDto dto = result.Value;
        dto.CustomerId.Should().Be("cust-42");
        dto.Status.Should().Be("Pending");
        dto.TotalAmount.Should().Be(30.00m);

        _orderRepositoryMock.Verify(r => r.AddAsync(It.IsAny<Order>(), It.IsAny<CancellationToken>()), Times.Once);
        _eventBusMock.Verify(e => e.PublishAsync(It.IsAny<OrderCreatedMessage>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_WhenEventBusThrows_HandlerStillReturnsSuccess()
    {
        // Arrange
        _orderRepositoryMock
            .Setup(r => r.AddAsync(It.IsAny<Order>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        _eventBusMock
            .Setup(e => e.PublishAsync(It.IsAny<OrderCreatedMessage>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("RabbitMQ unavailable"));

        CreateOrderCommand command = new("cust-42", ValidItems());
        CreateOrderHandler handler = CreateHandler();

        // Act
        Result<OrderDto, DomainError> result = await handler.Handle(command, CancellationToken.None);

        // Assert — event failures must be non-fatal
        result.IsSuccess.Should().BeTrue();
        result.Value.Status.Should().Be("Pending");
    }
}
