# E-Commerce Order Processing — Root CLAUDE.md

## Project Overview
Full-stack order processing system: .NET 8 Clean Architecture API + React 18 UI.
Polyglot persistence: PostgreSQL (orders), MongoDB (audit log), Redis (cache).

## Repository Layout
```
E-Commerce/
├── src/
│   ├── OrderProcessing.Domain/          # Entities, value objects, domain events
│   ├── OrderProcessing.Application/     # CQRS handlers, DTOs, interfaces
│   ├── OrderProcessing.Infrastructure/  # EF Core, MongoDB, Redis, background job
│   └── OrderProcessing.API/             # Controllers, middleware, Program.cs
├── tests/
│   ├── OrderProcessing.UnitTests/
│   └── OrderProcessing.IntegrationTests/
├── src/OrderProcessing.UI/              # React 18 + TypeScript + Vite 5
├── docker-compose.yml                   # PostgreSQL 16, MongoDB 7, Redis 7
├── .env.example                         # Required environment variables
└── OrderProcessing.sln
```

## Architecture Principles
- **Clean Architecture**: dependencies flow inward. Domain has zero external packages.
- **CQRS via MediatR**: Commands mutate state, Queries read state — never mix.
- **Result<TValue, TError>**: never throw for business failures; use Match() at boundaries.
- **Aggregate Root**: private constructors + static factory methods; raise domain events.
- **Domain Events**: `IDomainEvent` is a pure C# interface — no MediatR reference in Domain.

## Running Locally
```bash
# 1. Start infrastructure
docker-compose up -d

# 2. Run API
cd src/OrderProcessing.API
dotnet run

# 3. Run UI
cd src/OrderProcessing.UI
npm install && npm run dev
```
API: http://localhost:5000 | Swagger: http://localhost:5000/swagger
UI: http://localhost:5173

## Coding Standards (enforced on every task)

### C# Rules
- `TreatWarningsAsErrors=true` in all .csproj files
- Nullable reference types enabled (`<Nullable>enable</Nullable>`)
- No `var` for non-obvious types; use explicit type names
- One class per file; file name matches class name
- Private fields: `_camelCase`. Properties: `PascalCase`. Constants: `UPPER_SNAKE_CASE`
- Never `public` a field — always use properties
- Extension methods go in a `{Type}Extensions.cs` file
- Async methods must end in `Async`; always `ConfigureAwait(false)` in library code
- No `DateTime.Now` — use `DateTimeOffset.UtcNow`
- No raw strings for error messages — use `DomainErrors` static catalog

### TypeScript/React Rules
- `strict: true` in tsconfig; never use `any`
- Prefer `const` over `let`; avoid `var`
- Named exports for components; default export only for page-level components
- Component files: `PascalCase.tsx`. Hooks: `useCamelCase.ts`. Utilities: `camelCase.ts`
- No inline styles — use Tailwind classes
- `type` not `interface` for DTOs/props (interfaces reserved for contracts with implements)
- Always handle loading + error states in data-fetching components

## Code Review Checklist (run mentally before every commit)
- [ ] No secrets, connection strings, or credentials in code
- [ ] All new public API surfaces have XML doc comments (C#) or JSDoc (TS)
- [ ] No TODO/FIXME left without a GitHub issue number
- [ ] Result pattern used — no unguarded exceptions crossing layer boundaries
- [ ] Unit tests added or updated for changed business logic
- [ ] No N+1 queries (check EF Core — use `.Include()` or split queries)
- [ ] Redis/MongoDB failures are non-fatal (wrapped in try/catch with logged warning)

## OWASP Security Rules
- **Injection**: Use EF Core parameterized queries only — never string-interpolated SQL
- **Broken Auth**: All endpoints except health checks require auth headers (future: JWT)
- **Sensitive Data**: No PII in logs; mask card numbers, SSN in audit events
- **XSS**: React escapes by default; never use `dangerouslySetInnerHTML`
- **CORS**: Locked to `localhost:5173` (dev) and explicit production origins
- **Dependency scanning**: Run `dotnet list package --vulnerable` and `npm audit` before PR

## Definition of Done
- [ ] Code compiles with zero warnings (`dotnet build -warnaserror`)
- [ ] TypeScript compiles clean (`tsc --noEmit`)
- [ ] All existing tests pass (`dotnet test`)
- [ ] New feature has ≥1 unit test and ≥1 integration test
- [ ] Swagger docs updated (new endpoints appear in /swagger)
- [ ] Health check passes (`GET /health`)
- [ ] No new `npm audit` high/critical vulnerabilities
- [ ] PR description follows template in docs/PR_TEMPLATE.md

## PR Review Format
```
## Summary
<!-- What changed and why -->

## Changes
- [ ] Domain: ...
- [ ] Application: ...
- [ ] Infrastructure: ...
- [ ] API: ...
- [ ] UI: ...

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manually tested happy path
- [ ] Manually tested error cases

## Security
- [ ] No secrets committed
- [ ] OWASP checklist reviewed
- [ ] No new `dotnet list package --vulnerable` results

## Definition of Done
- [ ] All items in root CLAUDE.md DoD are satisfied
```
