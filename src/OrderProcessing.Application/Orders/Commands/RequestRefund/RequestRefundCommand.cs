using MediatR;
using OrderProcessing.Application.DTOs;
using OrderProcessing.Domain.Common;

namespace OrderProcessing.Application.Orders.Commands.RequestRefund;

public record RequestRefundCommand(Guid OrderId, string CustomerId)
    : IRequest<Result<OrderDto, DomainError>>;
