# React UI Layer — CLAUDE.md

Inherits all rules from [root CLAUDE.md](../../../CLAUDE.md).

## Stack
| Tool | Version | Role |
|------|---------|------|
| React | 18 | UI framework |
| TypeScript | 5 (strict) | Type safety |
| Vite | 5 | Build tool, dev server (port 5173) |
| React Router | v6 | Client-side routing |
| TanStack Query | v5 | Server state (orders API) |
| Zustand | latest | Client state (cart, checkout steps) |
| Tailwind CSS | v3 | Styling |
| Framer Motion | latest | Animations |
| Lucide React | latest | Icons |
| Sonner | latest | Toast notifications |
| Axios | latest | HTTP client |

## Folder Structure
```
src/
├── api/           # Axios client + typed API functions
├── components/    # Reusable UI components (layout, order, product, ui)
├── hooks/         # Custom hooks (useOrders.ts wraps TanStack Query)
├── lib/           # Pure utilities (utils.ts, constants.ts)
├── mocks/         # Mock data (products, payment, user) — never real API calls
├── pages/         # Route-level components (one folder per page)
├── router/        # createBrowserRouter config
├── stores/        # Zustand stores (cart.store.ts, checkout.store.ts)
└── main.tsx       # App entry — RouterProvider + QueryClientProvider
```

## Component Rules
- Page components: `pages/<Name>/index.tsx` (default export)
- Shared components: `components/<category>/<ComponentName>.tsx` (named export)
- No business logic in components — extract to hooks or utils
- Loading states: always show skeleton or spinner — never blank screens
- Error states: always show a human-readable message with retry option
- Empty states: always show a helpful message with a CTA

## State Management Rules
- **Server state** (orders, products): TanStack Query only — no Zustand for API data
- **Client state** (cart, checkout step, UI toggles): Zustand
- **Cart** persists to `localStorage` key `shopnow-cart` via Zustand `persist` middleware
- **No prop drilling** beyond 2 levels — use context or Zustand

## API Integration
- Base URL: `http://localhost:5000/api/v1` (from `VITE_API_BASE_URL` env var)
- All requests include `X-Correlation-Id` header (UUID generated per request)
- Response envelope: `{ success, data, error, correlationId }` — unwrapped by Axios interceptor
- On 4xx: show toast error with `error.message` from response body
- On 5xx: show generic "Something went wrong" toast

## Mock Data (never real payment or auth)
- **Products**: 24 mock products in `src/mocks/products.mock.ts` — never fetched from API
- **Payment**: `processMockPayment()` waits 1.5s, always returns success — never real gateway
- **User**: `MOCK_USER` (Alex Johnson, `cust-550e8400-...`) — hardcoded, no auth flow
- Real API calls: only order CRUD (POST/GET/PATCH/DELETE `/api/v1/orders`)

## Styling Rules
- Colors: `primary: #FF6B35`, `secondary: #1A1A2E`, `accent: #16213E`
- Breakpoints: mobile-first (`sm:`, `md:`, `lg:`, `xl:`)
- No inline `style={{}}` — use Tailwind classes only
- Animations: use Framer Motion `motion.div` with `initial/animate/exit` — keep under 300ms for UI transitions
- Icons: Lucide React only — no emoji icons except in user-facing status badges

## Routing
- All routes lazy-loaded via `React.lazy()` + `<Suspense>` fallback spinner
- Checkout uses `CheckoutLayout` (no header/footer)
- 404 catch-all at `path: '*'`

## Performance Rules
- Images: always set `width` + `height` to prevent layout shift
- Lists: always use stable `key` props (order ID, product ID — never array index)
- TanStack Query: `staleTime: 30_000` (30s) default; override per-query if needed
- Bundle: no direct lodash import — use native JS equivalents

## Testing Checklist (before marking UI task done)
- [ ] Start dev server (`npm run dev`) and navigate the changed page
- [ ] Test on mobile viewport (375px wide) — must be usable without horizontal scroll
- [ ] Check loading state (throttle network in DevTools)
- [ ] Check empty state (no orders, empty cart)
- [ ] Check error state (stop the API server, observe graceful error message)
- [ ] `tsc --noEmit` passes with zero errors
- [ ] No `console.error` or `console.warn` in browser DevTools

## Environment Variables
```
VITE_API_BASE_URL=http://localhost:5000/api/v1
```
Add to `.env.local` (not committed). See `.env.example` at repo root.
