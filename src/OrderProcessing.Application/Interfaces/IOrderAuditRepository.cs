using OrderProcessing.Application.DTOs;

namespace OrderProcessing.Application.Interfaces;

public interface IOrderAuditRepository
{
    Task AppendAsync(AuditEventDto auditEvent, CancellationToken ct = default);
    Task<List<AuditEventDto>> GetByOrderIdAsync(Guid orderId, CancellationToken ct = default);
}
