using MediatR;
using OrderProcessing.Application.DTOs;
using OrderProcessing.Domain.Common;
using OrderProcessing.Domain.Enums;

namespace OrderProcessing.Application.Orders.Commands.UpdateOrderStatus;

public record UpdateOrderStatusCommand(Guid OrderId, OrderStatus NewStatus, string TriggeredBy = "Admin")
    : IRequest<Result<OrderDto, DomainError>>;
