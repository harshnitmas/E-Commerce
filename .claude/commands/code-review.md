You are performing a thorough code review of the changes in this session (or the files provided as arguments). Review against the project's coding standards defined in CLAUDE.md.

If the user passed file paths as arguments (e.g. `/code-review src/OrderProcessing.API/Controllers/OrdersController.cs`), review those specific files. Otherwise review all files changed since the last git commit.

---

## How to get the changed files

Run:
```
git diff --name-only HEAD
git diff --name-only --cached
```

Read every changed file fully before commenting.

---

## Review Dimensions

For each changed file, evaluate all applicable dimensions below. Only call out actual issues — do not invent problems.

### 1. Correctness
- Does the logic match the intent? Are there off-by-one errors, wrong conditions, incorrect status transitions?
- Are all Result<T,E> failure paths handled at every caller?
- Are null checks present where needed (nullable reference types enabled)?

### 2. Clean Architecture Boundaries
- Domain layer: zero external package references, no EF Core / MassTransit / MediatR imports
- Application layer: no direct infrastructure references (no EF Core DbContext, no IMongoClient, no IConnectionMultiplexer)
- Controllers: only inject IMediator — never repositories or DbContext directly

### 3. C# Coding Standards (from CLAUDE.md)
- No `var` for non-obvious types
- No `DateTime.Now` — must use `DateTimeOffset.UtcNow`
- Private fields `_camelCase`, Properties `PascalCase`, Constants `UPPER_SNAKE_CASE`
- No public fields
- Async methods end in `Async`
- `ConfigureAwait(false)` on all awaits in library/infrastructure code
- No raw error strings — use `DomainErrors` catalog
- One class per file

### 4. TypeScript/React Standards (for .tsx/.ts files)
- `strict: true` compliant — no implicit `any`
- No inline `style={{}}` — Tailwind classes only
- No `dangerouslySetInnerHTML`
- Loading + error states handled in every data-fetching component
- `type` (not `interface`) for DTOs/props
- Named exports for components, default export only for pages

### 5. Security (OWASP)
- No string-interpolated SQL (`$"SELECT..."`)
- No secrets or credentials hardcoded
- No PII in log statements
- No `AllowAnyOrigin()` in CORS config
- Input validation present at API boundary (FluentValidation)

### 6. Performance
- No N+1 queries (EF Core: use `.Include()` or `.AsSplitQuery()`)
- No `.ToList()` before filtering — filter in LINQ first
- Redis/MongoDB failures are non-fatal (wrapped in try/catch)
- No blocking `.Result` or `.Wait()` on async calls

### 7. Test Coverage
- Is there a unit test for every new business rule added?
- Are validators tested for both valid and invalid inputs?
- Integration test added for new API endpoints?

### 8. Documentation
- XML doc comments on new public C# API surfaces (`/// <summary>`)
- JSDoc on exported TypeScript functions/types
- No TODO/FIXME without a GitHub issue number

---

## Output Format

Use this structure:

### `<filename>` — <APPROVED / NEEDS CHANGES / CRITICAL>

**Summary:** One sentence on what this file does.

**Issues found:**
| Severity | Line | Issue | Suggestion |
|----------|------|-------|------------|
| 🔴 Critical | 42 | ... | ... |
| 🟠 Major | 17 | ... | ... |
| 🟡 Minor | 88 | ... | ... |
| 💡 Suggestion | 103 | ... | ... |

*(If no issues: "No issues found — approved.")*

---

## Final Summary

After reviewing all files:

```
Files reviewed: N
  🔴 Critical issues : X  ← must fix before merge
  🟠 Major issues    : X  ← should fix before merge  
  🟡 Minor issues    : X  ← fix or accept risk
  💡 Suggestions     : X  ← optional improvements

Verdict: APPROVED / APPROVED WITH COMMENTS / CHANGES REQUESTED
```

If CHANGES REQUESTED: list the critical and major items as a numbered action list.
