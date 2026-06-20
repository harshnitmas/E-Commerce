using MediatR;
using Microsoft.AspNetCore.Mvc;
using OrderProcessing.API.Models;
using OrderProcessing.Application.DTOs;
using OrderProcessing.Application.Orders.Commands.CancelOrder;
using OrderProcessing.Application.Orders.Commands.CreateOrder;
using OrderProcessing.Application.Orders.Commands.UpdateOrderStatus;
using OrderProcessing.Application.Orders.Queries.GetOrderAudit;
using OrderProcessing.Application.Orders.Queries.GetOrderById;
using OrderProcessing.Application.Orders.Queries.ListOrders;
using OrderProcessing.Domain.Common;
using OrderProcessing.Domain.Enums;

namespace OrderProcessing.API.Controllers;

[ApiController]
[Route("api/v1/orders")]
public class OrdersController(IMediator mediator) : ControllerBase
{
    private string CorrelationId =>
        HttpContext.Items["X-Correlation-Id"]?.ToString() ?? "unknown";

    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<OrderDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> CreateOrder(
        [FromBody] CreateOrderRequest request, CancellationToken ct)
    {
        var command = new CreateOrderCommand(request.CustomerId, request.Items
            .Select(i => new CreateOrderItemInput(i.ProductId, i.ProductName, i.Quantity, i.UnitPrice))
            .ToList());

        var result = await mediator.Send(command, ct);
        return result.Match<IActionResult>(
            order => CreatedAtAction(nameof(GetOrder), new { id = order.OrderId },
                ApiResponse<OrderDto>.Ok(order, CorrelationId)),
            error => ErrorResponse(error));
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<OrderDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetOrder(
        Guid id, [FromQuery] string? customerId, CancellationToken ct)
    {
        var result = await mediator.Send(new GetOrderByIdQuery(id, customerId), ct);
        return result.Match<IActionResult>(
            order => Ok(ApiResponse<OrderDto>.Ok(order, CorrelationId)),
            error => ErrorResponse(error));
    }

    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<OrderDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ListOrders(
        [FromQuery] string? status,
        [FromQuery] string? customerId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        CancellationToken ct = default)
    {
        OrderStatus? parsedStatus = null;
        if (!string.IsNullOrEmpty(status) && Enum.TryParse<OrderStatus>(status, true, out var s))
            parsedStatus = s;

        var result = await mediator.Send(new ListOrdersQuery(parsedStatus, page, pageSize, customerId), ct);
        return result.Match<IActionResult>(
            paged => Ok(ApiResponse<PagedResult<OrderDto>>.Ok(paged, CorrelationId)),
            error => ErrorResponse(error));
    }

    [HttpPatch("{id:guid}/status")]
    [ProducesResponseType(typeof(ApiResponse<OrderDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> UpdateStatus(
        Guid id, [FromBody] UpdateStatusRequest request, CancellationToken ct)
    {
        if (!Enum.TryParse<OrderStatus>(request.Status, true, out var newStatus))
            return BadRequest(ProblemDetailsFor("Invalid status value."));

        var result = await mediator.Send(new UpdateOrderStatusCommand(id, newStatus), ct);
        return result.Match<IActionResult>(
            order => Ok(ApiResponse<OrderDto>.Ok(order, CorrelationId)),
            error => ErrorResponse(error));
    }

    [HttpPost("{id:guid}/cancel")]
    [ProducesResponseType(typeof(ApiResponse<OrderDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> CancelOrder(
        Guid id, [FromBody] CancelOrderRequest request, CancellationToken ct)
    {
        var result = await mediator.Send(new CancelOrderCommand(id, request.Reason), ct);
        return result.Match<IActionResult>(
            order => Ok(ApiResponse<OrderDto>.Ok(order, CorrelationId)),
            error => ErrorResponse(error));
    }

    [HttpGet("{id:guid}/audit")]
    [ProducesResponseType(typeof(ApiResponse<List<AuditEventDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetAuditLog(Guid id, CancellationToken ct)
    {
        var result = await mediator.Send(new GetOrderAuditQuery(id), ct);
        return result.Match<IActionResult>(
            events => Ok(ApiResponse<List<AuditEventDto>>.Ok(events, CorrelationId)),
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

public record CreateOrderRequest(string CustomerId, List<CreateOrderItemRequest> Items);
public record CreateOrderItemRequest(string ProductId, string ProductName, int Quantity, decimal UnitPrice);
public record UpdateStatusRequest(string Status);
public record CancelOrderRequest(string Reason);
