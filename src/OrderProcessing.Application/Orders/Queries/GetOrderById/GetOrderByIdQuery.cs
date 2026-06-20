using MediatR;
using OrderProcessing.Application.DTOs;
using OrderProcessing.Domain.Common;

namespace OrderProcessing.Application.Orders.Queries.GetOrderById;

public record GetOrderByIdQuery(Guid OrderId, string? RequestingCustomerId = null) : IRequest<Result<OrderDto, DomainError>>;
