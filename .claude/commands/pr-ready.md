You are checking whether the current branch is ready to raise a Pull Request. Work through every item in the Definition of Done checklist, run the necessary commands, and produce a structured PR readiness report.

---

## Step 1 — Branch Status

Run:
```
git status
git log main..HEAD --oneline
git diff main...HEAD --stat
```

Report:
- Current branch name
- Number of commits ahead of main
- Files changed (count and list)
- Any uncommitted changes (these must be committed or stashed before PR)

---

## Step 2 — Definition of Done Checklist

Run each check and mark ✅ DONE or ❌ MISSING:

| # | Check | Command | Pass condition |
|---|-------|---------|----------------|
| 1 | .NET builds clean | `dotnet build --warnaserror` | 0 errors, 0 warnings |
| 2 | TypeScript compiles | `npx tsc --noEmit` (in `src/OrderProcessing.UI`) | No output |
| 3 | Unit tests pass | `dotnet test tests/OrderProcessing.UnitTests` | All pass |
| 4 | Integration tests pass | `dotnet test tests/OrderProcessing.IntegrationTests` | All pass (skip if Docker down) |
| 5 | No vulnerable packages | `dotnet list package --vulnerable` | No HIGH/CRITICAL |
| 6 | No npm high vulnerabilities | `npm audit --audit-level=high` (in `src/OrderProcessing.UI`) | Exit 0 |
| 7 | No secrets committed | Scan staged files for credentials | None found |
| 8 | New feature has tests | Check if new `.cs` command/handler files have corresponding test files | At least 1 unit test |

---

## Step 3 — PR Description Draft

Based on `git diff main...HEAD`, generate a complete PR description using the project template:

```markdown
## Summary
<!-- What changed and why — written for a reviewer who hasn't seen the branch -->

## Changes
- [ ] Domain: <list domain changes or "No changes">
- [ ] Application: <list command/query/DTO changes>
- [ ] Infrastructure: <list persistence/messaging changes>
- [ ] API: <list endpoint/middleware changes>
- [ ] UI: <list page/component/hook changes>

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manually tested happy path: <describe>
- [ ] Manually tested error cases: <describe>

## Security
- [ ] No secrets committed
- [ ] OWASP checklist reviewed
- [ ] No new `dotnet list package --vulnerable` results

## Definition of Done
- [ ] Code compiles with zero warnings
- [ ] TypeScript compiles clean
- [ ] All existing tests pass
- [ ] New feature has ≥1 unit test and ≥1 integration test
- [ ] Swagger docs updated (if new endpoints added)
- [ ] Health check still passes
- [ ] No new npm audit high/critical vulnerabilities
```

---

## Final Output

```
╔══════════════════════════════════════════╗
║          PR READINESS REPORT             ║
╠══════════════════════════════════════════╣
║  Branch: <name>    Commits ahead: <N>   ║
╠══════════════════════════════════════════╣
║  DoD Item 1  .NET Build        [ ✅/❌ ] ║
║  DoD Item 2  TypeScript        [ ✅/❌ ] ║
║  DoD Item 3  Unit Tests        [ ✅/❌ ] ║
║  DoD Item 4  Integration Tests [ ✅/❌ ] ║
║  DoD Item 5  .NET Packages     [ ✅/❌ ] ║
║  DoD Item 6  npm Audit         [ ✅/❌ ] ║
║  DoD Item 7  No Secrets        [ ✅/❌ ] ║
║  DoD Item 8  Tests for Feature [ ✅/❌ ] ║
╠══════════════════════════════════════════╣
║  VERDICT: READY TO PR / NOT READY       ║
╚══════════════════════════════════════════╝
```

If NOT READY: list every blocking item with the exact fix needed.
If READY: output the completed PR description draft so the user can paste it directly into GitHub.
