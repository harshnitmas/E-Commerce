using MediatR;
using OrderProcessing.Application.DTOs;
using OrderProcessing.Domain.Common;

namespace OrderProcessing.Application.Orders.Commands.ProcessRefund;

public record ProcessRefundCommand(Guid OrderId, bool Approve)
    : IRequest<Result<OrderDto, DomainError>>;
