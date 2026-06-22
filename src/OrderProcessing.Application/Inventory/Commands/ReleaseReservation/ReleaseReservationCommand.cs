using MediatR;
using OrderProcessing.Domain.Common;

namespace OrderProcessing.Application.Inventory.Commands.ReleaseReservation;

public record ReleaseReservationCommand(List<Guid> ReservationIds)
    : IRequest<Result<bool, DomainError>>;
