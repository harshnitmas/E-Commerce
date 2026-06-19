using MediatR;
using OrderProcessing.Application.DTOs;
using OrderProcessing.Domain.Common;
using OrderProcessing.Domain.Enums;

namespace OrderProcessing.Application.Orders.Queries.ListOrders;

public record ListOrdersQuery(
    OrderStatus? Status,
    int Page = 1,
    int PageSize = 10) : IRequest<Result<PagedResult<OrderDto>, DomainError>>;
