using MediatR;
using OrderProcessing.Application.DTOs;
using OrderProcessing.Domain.Common;

namespace OrderProcessing.Application.Inventory.Commands.ReserveStock;

public record ReserveStockItemInput(string ExternalProductId, int Quantity);

public record ReserveStockCommand(
    string CustomerId,
    List<ReserveStockItemInput> Items
) : IRequest<Result<List<ReservationDto>, DomainError>>;
