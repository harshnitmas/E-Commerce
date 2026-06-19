using MediatR;
using OrderProcessing.Application.DTOs;
using OrderProcessing.Domain.Common;

namespace OrderProcessing.Application.Orders.Commands.CancelOrder;

public record CancelOrderCommand(Guid OrderId, string Reason)
    : IRequest<Result<OrderDto, DomainError>>;
