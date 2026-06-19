You are performing a full SDLC quality gate check on the E-Commerce Order Processing System. Run every step below in order, report the result of each, and produce a final pass/fail summary. Do not skip any step.

---

## Step 1 — .NET Build (zero warnings policy)

Run:
```
dotnet build --warnaserror
```
from the solution root (`c:\My Projects\E-Commerce`).

Report: PASS if exit code 0 and "0 Warning(s), 0 Error(s)". FAIL otherwise — show the full error output.

---

## Step 2 — TypeScript Compile Check

Run:
```
npx tsc --noEmit
```
from `src/OrderProcessing.UI`.

Report: PASS if no output (zero errors). FAIL otherwise — list every TS error.

---

## Step 3 — Unit Tests

Run:
```
dotnet test tests/OrderProcessing.UnitTests --logger "console;verbosity=minimal"
```

Report: PASS if all tests pass. FAIL if any test fails — show the failing test names and messages.

---

## Step 4 — Integration Tests

Run:
```
dotnet test tests/OrderProcessing.IntegrationTests --logger "console;verbosity=minimal"
```

Report: PASS if all tests pass. FAIL if any test fails. SKIP (with note) if Docker is not running (Testcontainers requires Docker).

---

## Step 5 — .NET Vulnerable Package Scan

Run:
```
dotnet list package --vulnerable --include-transitive
```
from the solution root.

Report: PASS if no vulnerabilities found. FAIL if any HIGH or CRITICAL vulnerabilities are listed — show the package name, severity, and CVE.

---

## Step 6 — npm Security Audit

Run:
```
npm audit --audit-level=high
```
from `src/OrderProcessing.UI`.

Report: PASS if exit code 0 (no high/critical issues). FAIL otherwise — show the vulnerable package names and severity.

---

## Step 7 — Secret / Credential Scan

Search the codebase (excluding `node_modules`, `bin`, `obj`, `.git`) for these patterns:
- Hardcoded passwords: `password\s*=\s*["'][^"']{6,}["']` (case-insensitive, NOT in appsettings files)
- Private keys: `-----BEGIN (RSA|EC|OPENSSH) PRIVATE KEY-----`
- Connection strings with embedded credentials in `.cs` or `.ts` files (not config files)
- Any file containing `sk-`, `ghp_`, `AKIA` (API key prefixes)

Report: PASS if nothing found. FAIL if any match — show the file path and line number.

---

## Step 8 — OWASP Top 10 Code Checklist

Search the codebase for these anti-patterns and report each one found:

| # | Check | Pattern to find | Expected: absent |
|---|-------|-----------------|-----------------|
| 1 | SQL Injection | `FromSqlRaw` or `ExecuteSqlRaw` with string interpolation `$"` | No raw interpolated SQL |
| 2 | XSS | `dangerouslySetInnerHTML` in `.tsx` files | Never used |
| 3 | Sensitive data in logs | `_logger` calls containing `password`, `cardNumber`, `ssn`, `secret` | Not logged |
| 4 | Hardcoded secrets | Literal strings matching `password`, `secret`, `apikey` assigned in `.cs` files | Not hardcoded |
| 5 | Missing error handling | `catch { }` empty catch blocks (swallows exceptions silently) | Only allowed for non-fatal MongoDB/Redis |
| 6 | CORS wildcard | `AllowAnyOrigin()` in `Program.cs` | Must be explicit origins |

Report each check individually: PASS or FAIL with file:line reference.

---

## Step 9 — Architecture Boundary Check

Verify that dependency rules are not violated:

1. `OrderProcessing.Domain.csproj` — must have zero `<PackageReference>` entries (pure .NET, no NuGet dependencies)
2. `OrderProcessing.Application.csproj` — must NOT reference `EntityFrameworkCore`, `MongoDB`, `Redis`, `MassTransit.RabbitMQ`
3. No `.cs` file in `src/OrderProcessing.Domain/` contains `using MediatR`, `using Microsoft.EntityFrameworkCore`, or `using MassTransit`
4. No controller in `src/OrderProcessing.API/Controllers/` directly injects `IOrderRepository`, `IOrderAuditRepository`, or `AppDbContext`

Report: PASS or FAIL per rule with evidence.

---

## Step 10 — Coding Standards Spot-Check

Scan `src/` (C# files only) for these violations:

| Rule | Pattern | Should NOT exist |
|------|---------|-----------------|
| No `var` for non-obvious types | `var result = new ` followed by a non-generic new | OK to use for anonymous/complex generics |
| No `DateTime.Now` | `DateTime.Now` | Use `DateTimeOffset.UtcNow` |
| No public fields | `public [a-zA-Z]+ [a-z]` in class body (not property) | Always use properties |
| Async naming | `async Task` method without `Async` suffix | Must end in `Async` |
| No raw error strings | `return "` or `throw new Exception("` in Domain/Application | Must use `DomainErrors` catalog |

Report each violation with file:line.

---

## Final Report

After all 10 steps, output a table:

```
╔══════════════════════════════════════════════╗
║          SDLC GATE CHECK — RESULTS           ║
╠══════════════════════════════════════════════╣
║  Step 1  .NET Build              [ PASS/FAIL ]  ║
║  Step 2  TypeScript Compile      [ PASS/FAIL ]  ║
║  Step 3  Unit Tests              [ PASS/FAIL ]  ║
║  Step 4  Integration Tests       [ PASS/FAIL ]  ║
║  Step 5  Vulnerable Packages .NET [ PASS/FAIL ] ║
║  Step 6  npm Audit               [ PASS/FAIL ]  ║
║  Step 7  Secret Scan             [ PASS/FAIL ]  ║
║  Step 8  OWASP Checklist         [ PASS/FAIL ]  ║
║  Step 9  Architecture Boundaries [ PASS/FAIL ]  ║
║  Step 10 Coding Standards        [ PASS/FAIL ]  ║
╠══════════════════════════════════════════════╣
║  OVERALL GATE    [ PASS / FAIL ]             ║
╚══════════════════════════════════════════════╝
```

If OVERALL is FAIL: list every action item numbered, with the file/line to fix.
If OVERALL is PASS: confirm "Ready to commit / raise PR."
