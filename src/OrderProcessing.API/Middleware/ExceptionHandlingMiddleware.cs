using FluentValidation;
using Microsoft.AspNetCore.Mvc;
using OrderProcessing.Domain.Common;
using System.Net;

namespace OrderProcessing.API.Middleware;

public class ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (ValidationException ex)
        {
            await WriteProblemAsync(context, StatusCodes.Status400BadRequest,
                "Validation Failed", ex.Errors.Select(e => e.ErrorMessage).ToList());
        }
        catch (Exception ex)
        {
            var correlationId = context.Items["X-Correlation-Id"]?.ToString() ?? "unknown";
            logger.LogError(ex, "Unhandled exception. CorrelationId: {CorrelationId}", correlationId);
            await WriteProblemAsync(context, StatusCodes.Status500InternalServerError,
                "Internal Server Error", ["An unexpected error occurred. Please try again later."]);
        }
    }

    private static async Task WriteProblemAsync(HttpContext context, int statusCode, string title, List<string> errors)
    {
        var correlationId = context.Items["X-Correlation-Id"]?.ToString() ?? "unknown";
        context.Response.StatusCode = statusCode;
        context.Response.ContentType = "application/problem+json";

        var problem = new ProblemDetails
        {
            Title = title,
            Status = statusCode,
            Extensions =
            {
                ["errors"] = errors,
                ["correlationId"] = correlationId
            }
        };

        await context.Response.WriteAsJsonAsync(problem);
    }
}
