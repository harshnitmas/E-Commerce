using MediatR;
using OrderProcessing.Application.DTOs;
using OrderProcessing.Application.Interfaces;
using OrderProcessing.Domain.Common;
using OrderProcessing.Domain.Errors;

namespace OrderProcessing.Application.Orders.Queries.GetOrderAudit;

public class GetOrderAuditHandler(
    IOrderRepository orderRepository,
    IOrderAuditRepository auditRepository)
    : IRequestHandler<GetOrderAuditQuery, Result<List<AuditEventDto>, DomainError>>
{
    public async Task<Result<List<AuditEventDto>, DomainError>> Handle(
        GetOrderAuditQuery query, CancellationToken ct)
    {
        var order = await orderRepository.GetByIdAsync(query.OrderId, ct).ConfigureAwait(false);
        if (order is null) return DomainErrors.Order.NotFound;

        List<AuditEventDto> events = await auditRepository
            .GetByOrderIdAsync(query.OrderId, ct).ConfigureAwait(false);

        return events;
    }
}
