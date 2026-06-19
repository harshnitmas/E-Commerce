# Infrastructure Layer — CLAUDE.md

Inherits all rules from [root CLAUDE.md](../../CLAUDE.md).

## Responsibility
Implements interfaces defined in Application layer. Three persistence stores + background job.

## PostgreSQL / EF Core
- **Code First**: all schema changes via migrations (`dotnet ef migrations add <Name>`)
- **Naming convention**: snake_case table/column names via `UseSnakeCaseNamingConvention()`
- **Concurrency token**: `builder.Property(o => o.UpdatedAt).IsConcurrencyToken()` — do NOT use `UseXminAsConcurrencyToken` (obsolete in Npgsql 8.x)
- **Entity configurations**: one `IEntityTypeConfiguration<T>` per entity in `Configurations/` folder
- **Computed properties**: `Ignore()` in configuration (e.g., `OrderItem.Subtotal`)
- **Migrations command** (run from solution root):
  ```bash
  dotnet ef migrations add <MigrationName> \
    --project src/OrderProcessing.Infrastructure \
    --startup-project src/OrderProcessing.API
  ```

### EF Core Anti-Patterns to Avoid
- Never use `SaveChanges()` — always `SaveChangesAsync(CancellationToken)`
- Never load entire collections to count — use `CountAsync()`
- Never use `.ToList()` then filter — filter in LINQ before materializing
- No raw SQL strings — use `FromSqlInterpolated` if raw SQL is unavoidable

## MongoDB (Audit Log)
- Collection: `order_audit_events` in database `order_processing`
- `OrderAuditDocument` is **append-only** — never update or delete audit records
- All MongoDB writes are **non-fatal**: wrapped in `try/catch`, failure logged as Warning, never propagated
- Index: `{ orderId: 1, occurredAt: -1 }` (set in `MongoDbServiceExtensions`)
- Driver version: **MongoDB.Driver 3.1.0** — API differs from 2.x (no `BsonDocument` implicit cast from string)

### MongoDB Connection
```csharp
// From IMongoClient — always use injected client, never create new MongoClient()
var database = _mongoClient.GetDatabase("order_processing");
var collection = database.GetCollection<OrderAuditDocument>("order_audit_events");
```

## Redis (Cache)
- Key pattern: `orders:list:{status}:{page}:{pageSize}`
- TTL: **60 seconds** for list cache
- On write (create/update/cancel): invalidate all matching keys via `KEYS orders:list:*` pattern scan
- All Redis operations **non-fatal**: catch `RedisException`, log Warning, continue without cache
- Graceful degradation: cache miss → fetch from PostgreSQL → re-cache

### Redis Client
```csharp
// Always use IConnectionMultiplexer (singleton) — never create new ConnectionMultiplexer()
var db = _redis.GetDatabase();
```

## Background Job (OrderProcessingJob)
- Uses `PeriodicTimer` with 5-minute interval — do NOT use `Task.Delay` loop or `System.Threading.Timer`
- Registered as `IHostedService` (not `BackgroundService` subclass — keeps it testable)
- Auto-transitions: `PENDING → PROCESSING` for orders older than 5 minutes
- Uses `ExecuteUpdateAsync` for batch updates (single SQL statement, not per-entity SaveChanges)
- After batch update: writes MongoDB audit event per order (non-fatal), invalidates Redis list cache

### Job Error Handling
```csharp
// Catch all exceptions in ExecuteAsync — never let job crash the host
try { await ProcessPendingOrdersAsync(stoppingToken); }
catch (Exception ex) { _logger.LogError(ex, "Background job iteration failed"); }
```

## Polly (Resilience)
- Retry policy: 3 retries with exponential backoff on transient DB errors
- Applied to: `IOrderRepository` PostgreSQL calls only
- Do NOT apply retry to MongoDB/Redis — those have their own non-fatal handling

## Dependency Registration (InfrastructureServiceExtensions)
All registrations in one extension method — no direct registrations in `Program.cs`:
```csharp
services.AddInfrastructure(configuration);
```
Order: PostgreSQL → MongoDB → Redis → Repositories → Background Job
