using MediatR;
using Microsoft.AspNetCore.Mvc;
using OrderProcessing.API.Models;
using OrderProcessing.Application.DTOs;
using OrderProcessing.Application.Inventory.Commands.ReleaseReservation;
using OrderProcessing.Application.Inventory.Commands.ReserveStock;
using OrderProcessing.Application.Products.Queries.GetProducts;
using OrderProcessing.Domain.Common;

namespace OrderProcessing.API.Controllers;

[ApiController]
[Route("api/v1/products")]
public class ProductsController(IMediator mediator) : ControllerBase
{
    private string CorrelationId =>
        HttpContext.Items["X-Correlation-Id"]?.ToString() ?? "unknown";

    /// <summary>List all products with live stock counts.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<List<ProductDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetProducts(CancellationToken ct)
    {
        Result<List<ProductDto>, DomainError> result = await mediator.Send(new GetProductsQuery(), ct);
        return result.Match<IActionResult>(
            products => Ok(ApiResponse<List<ProductDto>>.Ok(products, CorrelationId)),
            error => ErrorResponse(error));
    }

    /// <summary>Reserve stock for checkout (15-min hold). Returns reservation IDs to include with the order.</summary>
    [HttpPost("reserve")]
    [ProducesResponseType(typeof(ApiResponse<List<ReservationDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> ReserveStock(
        [FromBody] ReserveStockRequest request, CancellationToken ct)
    {
        var command = new ReserveStockCommand(
            request.CustomerId,
            request.Items.Select(i => new ReserveStockItemInput(i.ExternalProductId, i.Quantity)).ToList());

        Result<List<ReservationDto>, DomainError> result = await mediator.Send(command, ct);
        return result.Match<IActionResult>(
            reservations => Ok(ApiResponse<List<ReservationDto>>.Ok(reservations, CorrelationId)),
            error => ErrorResponse(error));
    }

    /// <summary>Release reservations (user abandoned checkout).</summary>
    [HttpPost("release")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ReleaseReservations(
        [FromBody] ReleaseReservationsRequest request, CancellationToken ct)
    {
        Result<bool, DomainError> result = await mediator.Send(
            new ReleaseReservationCommand(request.ReservationIds), ct);
        return result.Match<IActionResult>(
            _ => Ok(ApiResponse<bool>.Ok(true, CorrelationId)),
            error => ErrorResponse(error));
    }

    private IActionResult ErrorResponse(DomainError error) => error.Type switch
    {
        ErrorType.NotFound => NotFound(ProblemDetailsFor(error.Message, error.Code)),
        ErrorType.Validation => BadRequest(ProblemDetailsFor(error.Message, error.Code)),
        ErrorType.BusinessRule => UnprocessableEntity(ProblemDetailsFor(error.Message, error.Code)),
        ErrorType.Conflict => Conflict(ProblemDetailsFor(error.Message, error.Code)),
        _ => StatusCode(500, ProblemDetailsFor("An unexpected error occurred."))
    };

    private ProblemDetails ProblemDetailsFor(string detail, string? code = null) => new()
    {
        Detail = detail,
        Extensions = { ["correlationId"] = CorrelationId, ["code"] = code }
    };
}

public record ReserveStockRequest(string CustomerId, List<ReserveStockItemRequest> Items);
public record ReserveStockItemRequest(string ExternalProductId, int Quantity);
public record ReleaseReservationsRequest(List<Guid> ReservationIds);
