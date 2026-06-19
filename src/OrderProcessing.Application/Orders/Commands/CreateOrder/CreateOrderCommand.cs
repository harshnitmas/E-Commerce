using MediatR;
using OrderProcessing.Application.DTOs;
using OrderProcessing.Domain.Common;

namespace OrderProcessing.Application.Orders.Commands.CreateOrder;

public record CreateOrderItemInput(
    Guid ProductId,
    string ProductName,
    int Quantity,
    decimal UnitPrice);

public record CreateOrderCommand(
    string CustomerId,
    List<CreateOrderItemInput> Items) : IRequest<Result<OrderDto, DomainError>>;
