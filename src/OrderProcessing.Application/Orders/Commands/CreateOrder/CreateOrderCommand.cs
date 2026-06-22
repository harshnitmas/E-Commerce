using MediatR;
using OrderProcessing.Application.DTOs;
using OrderProcessing.Domain.Common;

namespace OrderProcessing.Application.Orders.Commands.CreateOrder;

public record CreateOrderItemInput(
    string ProductId,
    string ProductName,
    int Quantity,
    decimal UnitPrice);

public record CreateOrderCommand(
    string CustomerId,
    List<CreateOrderItemInput> Items,
    List<Guid>? ReservationIds = null) : IRequest<Result<OrderDto, DomainError>>;
