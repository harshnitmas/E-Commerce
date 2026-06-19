# API Layer — CLAUDE.md

Inherits all rules from [root CLAUDE.md](../../CLAUDE.md).

## Responsibility
HTTP surface only. No business logic here — delegate everything to MediatR.

## Controller Rules
- All controllers inherit `ControllerBase` with `[ApiController]` + `[Route("api/v1/[controller]")]`
- Each action: one `await _mediator.Send(command/query)` then `result.Match(Ok, Problem)`
- Return types: `ActionResult<ApiResponse<T>>` where `ApiResponse<T>` wraps data + correlationId
- Never inject repositories or DbContext directly into controllers
- Max 15 lines per action method — if longer, move logic to a handler

## Error Handling
- `result.Failure` → `Problem(...)` using RFC 7807 ProblemDetails
- Map `DomainError.Code` to HTTP status: `NOT_FOUND=404`, `INVALID_STATUS=422`, `ALREADY_CANCELLED=409`
- Unhandled exceptions → global exception middleware → 500 with correlation ID (never expose stack traces)

## Middleware Order (Program.cs)
1. `UseSerilogRequestLogging()`
2. `UseExceptionHandler()` / `UseDeveloperExceptionPage()` (dev only)
3. `UseHttpsRedirection()`
4. `UseCors()`
5. `UseAuthentication()` / `UseAuthorization()` (when added)
6. `MapControllers()`
7. `MapHealthChecks("/health")`

## Health Checks
- PostgreSQL: `AddNpgSql(connectionString)` via `AspNetCore.HealthChecks.NpgSql`
- Redis: `AddRedis(connectionString)` via `AspNetCore.HealthChecks.Redis`
- MongoDB: Custom `MongoDbHealthCheck : IHealthCheck` (do NOT use AspNetCore.HealthChecks.MongoDb — version conflict with Driver 3.x)

## Swagger
- Only enabled in Development environment
- All endpoints documented with `[ProducesResponseType]` attributes
- XML docs enabled (`<GenerateDocumentationFile>true</GenerateDocumentationFile>`)

## CORS
```csharp
// Development: allow UI dev server
origins: ["http://localhost:5173", "http://localhost:3000"]
// Production: set via CORS_ORIGINS environment variable
```

## Logging (Serilog)
- Structured logging: always include `OrderId`, `CustomerId`, `CorrelationId` as properties
- Never log full request bodies (may contain PII)
- Log levels: Debug (dev), Information (prod), always Warning+ for infrastructure failures

## Auto-Migration (Dev Only)
```csharp
// In Program.cs — development only
if (app.Environment.IsDevelopment())
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<OrderDbContext>();
    await db.Database.MigrateAsync();
}
```
Never run auto-migration in production — use explicit `dotnet ef database update`.
