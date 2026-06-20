using MediatR;
using Microsoft.AspNetCore.Mvc;
using OrderProcessing.API.Models;
using OrderProcessing.Application.DTOs;
using OrderProcessing.Application.Users.Commands.RegisterUser;
using OrderProcessing.Application.Users.Queries.LoginUser;
using OrderProcessing.Domain.Common;

namespace OrderProcessing.API.Controllers;

[ApiController]
[Route("api/v1/auth")]
public class AuthController(IMediator mediator) : ControllerBase
{
    private string CorrelationId =>
        HttpContext.Items["X-Correlation-Id"]?.ToString() ?? "unknown";

    /// <summary>Register a new customer account.</summary>
    [HttpPost("register")]
    [ProducesResponseType(typeof(ApiResponse<UserDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request, CancellationToken ct)
    {
        var result = await mediator.Send(
            new RegisterUserCommand(request.DisplayName, request.Username, request.Email, request.Password), ct);

        return result.Match<IActionResult>(
            dto => CreatedAtAction(nameof(Login), ApiResponse<UserDto>.Ok(dto, CorrelationId)),
            error => ErrorResponse(error));
    }

    /// <summary>Authenticate with username and password.</summary>
    [HttpPost("login")]
    [ProducesResponseType(typeof(ApiResponse<UserDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Login([FromBody] LoginRequest request, CancellationToken ct)
    {
        var result = await mediator.Send(new LoginUserQuery(request.Username, request.Password), ct);

        return result.Match<IActionResult>(
            dto => Ok(ApiResponse<UserDto>.Ok(dto, CorrelationId)),
            _ => Unauthorized(ProblemDetailsFor("Invalid username or password.")));
    }

    private IActionResult ErrorResponse(DomainError error) => error.Type switch
    {
        ErrorType.Conflict  => Conflict(ProblemDetailsFor(error.Message, error.Code)),
        ErrorType.Validation => BadRequest(ProblemDetailsFor(error.Message, error.Code)),
        _ => StatusCode(500, ProblemDetailsFor("An unexpected error occurred."))
    };

    private ProblemDetails ProblemDetailsFor(string detail, string? code = null) => new()
    {
        Detail = detail,
        Extensions = { ["correlationId"] = CorrelationId, ["code"] = code }
    };
}

public record RegisterRequest(string DisplayName, string Username, string Email, string Password);
public record LoginRequest(string Username, string Password);
