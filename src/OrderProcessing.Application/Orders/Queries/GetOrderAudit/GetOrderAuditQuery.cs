using MediatR;
using OrderProcessing.Application.DTOs;
using OrderProcessing.Domain.Common;

namespace OrderProcessing.Application.Orders.Queries.GetOrderAudit;

public record GetOrderAuditQuery(Guid OrderId) : IRequest<Result<List<AuditEventDto>, DomainError>>;
