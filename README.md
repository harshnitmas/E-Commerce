# E-Commerce Order Processing System

Full-stack order management system built with **.NET 8 Clean Architecture** and **React 18**. Demonstrates polyglot persistence (PostgreSQL + MongoDB + Redis), CQRS with MediatR, domain-driven design, and a rich Amazon-style UI.

---

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Folder Structure](#folder-structure)
3. [Tech Stack](#tech-stack)
4. [Features](#features)
5. [API Endpoints](#api-endpoints)
6. [UI Pages](#ui-pages)
7. [Running Locally](#running-locally)
8. [Database & Migrations](#database--migrations)
9. [Testing](#testing)
10. [Environment Variables](#environment-variables)
11. [Design Decisions](#design-decisions)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                   React 18 UI                        │
│  (Vite 5 · TanStack Query · Zustand · Tailwind CSS) │
└──────────────────────┬──────────────────────────────┘
                       │ HTTP (Axios · REST)
┌──────────────────────▼──────────────────────────────┐
│              OrderProcessing.API                     │
│     (ASP.NET Core 8 · Swagger · Serilog · CORS)     │
└──────────────────────┬──────────────────────────────┘
                       │ MediatR (CQRS)
┌──────────────────────▼──────────────────────────────┐
│           OrderProcessing.Application                │
│   (Commands · Queries · Validators · DTOs · Interfaces) │
└──────────────────────┬──────────────────────────────┘
                       │ Interfaces (DI)
┌──────────────────────▼──────────────────────────────┐
│          OrderProcessing.Infrastructure              │
│  PostgreSQL (EF Core 8)  │  MongoDB  │  Redis        │
│  + Background Job (PeriodicTimer, 5 min)             │
└──────────────────────────────────────────────────────┘
         ▲ depends only on Domain interfaces
┌────────┴────────────────────────────────────────────┐
│            OrderProcessing.Domain                    │
│   (Entities · Value Objects · Domain Events · Errors) │
│            Zero external dependencies                │
└─────────────────────────────────────────────────────┘
```

### Persistence Strategy

| Store | Role | Why |
|-------|------|-----|
| **PostgreSQL 16** | Orders, order items | ACID transactions, relational integrity |
| **MongoDB 7** | Audit event log | Append-only, schema-flexible, non-fatal writes |
| **Redis 7** | Order list cache (60s TTL) | Reduce PostgreSQL read load on list queries |

---

## Folder Structure

```
E-Commerce/
│
├── src/
│   ├── OrderProcessing.Domain/              # Core business rules — no external deps
│   │   ├── Common/
│   │   │   ├── AggregateRoot.cs             # Base class with domain event collection
│   │   │   ├── IDomainEvent.cs              # Pure marker interface (no MediatR)
│   │   │   └── Result.cs                    # Result<TValue, TError> + Match()
│   │   ├── Entities/
│   │   │   ├── Order.cs                     # Aggregate root, status transitions, cancel
│   │   │   └── OrderItem.cs                 # Value in the order, holds Subtotal
│   │   ├── Enums/
│   │   │   └── OrderStatus.cs               # Pending, Processing, Shipped, Delivered, Cancelled
│   │   ├── Errors/
│   │   │   └── DomainErrors.cs              # Static error catalog (no raw strings)
│   │   └── Events/
│   │       ├── OrderCreatedEvent.cs
│   │       ├── OrderStatusChangedEvent.cs
│   │       └── OrderCancelledEvent.cs
│   │
│   ├── OrderProcessing.Application/         # Use-cases, orchestration — no infra deps
│   │   ├── Commands/
│   │   │   ├── CreateOrder/                 # CreateOrderCommand + Handler + Validator
│   │   │   ├── UpdateOrderStatus/           # UpdateOrderStatusCommand + Handler + Validator
│   │   │   └── CancelOrder/                 # CancelOrderCommand + Handler + Validator
│   │   ├── Queries/
│   │   │   ├── GetOrderById/                # GetOrderByIdQuery + Handler
│   │   │   ├── ListOrders/                  # ListOrdersQuery + Handler (paginated)
│   │   │   └── GetOrderAudit/               # GetOrderAuditQuery + Handler
│   │   ├── DTOs/
│   │   │   ├── OrderDto.cs                  # Public-facing order shape
│   │   │   ├── OrderItemDto.cs
│   │   │   ├── AuditEventDto.cs
│   │   │   └── OrderMappings.cs             # ToDto() extension methods (Mapster)
│   │   ├── Interfaces/
│   │   │   ├── IOrderRepository.cs          # PostgreSQL operations
│   │   │   ├── IOrderAuditRepository.cs     # MongoDB append + fetch
│   │   │   └── IOrderCacheService.cs        # Redis get/set/invalidate
│   │   └── Common/
│   │       ├── Behaviors/
│   │       │   ├── ValidationBehavior.cs    # FluentValidation pipeline
│   │       │   └── LoggingBehavior.cs       # Structured request logging
│   │       └── DependencyInjection/
│   │           └── ApplicationServiceExtensions.cs
│   │
│   ├── OrderProcessing.Infrastructure/      # Implements Application interfaces
│   │   ├── Persistence/
│   │   │   ├── PostgreSQL/
│   │   │   │   ├── OrderDbContext.cs        # EF Core DbContext, snake_case naming
│   │   │   │   ├── OrderRepository.cs       # IOrderRepository impl + Polly retry
│   │   │   │   ├── Migrations/              # EF Core code-first migrations
│   │   │   │   └── Configurations/
│   │   │   │       ├── OrderConfiguration.cs      # Owned entities, concurrency token
│   │   │   │       └── OrderItemConfiguration.cs  # Ignores computed Subtotal
│   │   │   ├── MongoDB/
│   │   │   │   ├── OrderAuditDocument.cs    # Audit event document shape
│   │   │   │   └── OrderAuditRepository.cs  # Non-fatal append-only writes
│   │   │   └── Redis/
│   │   │       └── OrderCacheService.cs     # 60s TTL, pattern-based invalidation
│   │   ├── BackgroundJobs/
│   │   │   └── OrderProcessingJob.cs        # PeriodicTimer, Pending→Processing every 5 min
│   │   └── DependencyInjection/
│   │       └── InfrastructureServiceExtensions.cs
│   │
│   ├── OrderProcessing.API/                 # HTTP surface — no business logic
│   │   ├── Controllers/
│   │   │   └── OrdersController.cs          # 6 endpoints, delegates to MediatR
│   │   ├── Middleware/
│   │   │   ├── ExceptionMiddleware.cs       # RFC 7807 ProblemDetails for unhandled errors
│   │   │   └── MongoDbHealthCheck.cs        # Custom IHealthCheck (avoids v2/v3 conflict)
│   │   ├── appsettings.json
│   │   ├── appsettings.Development.json     # Local connection strings
│   │   └── Program.cs                       # DI composition root, middleware pipeline
│   │
│   └── OrderProcessing.UI/                  # React 18 frontend
│       ├── public/
│       ├── src/
│       │   ├── api/
│       │   │   ├── client.ts                # Axios instance, correlation ID header
│       │   │   ├── orders.api.ts            # Typed API functions (create/get/list/update/cancel/audit)
│       │   │   └── types.ts                 # Shared TypeScript types (OrderDto, etc.)
│       │   ├── components/
│       │   │   ├── layout/
│       │   │   │   ├── Header.tsx           # Nav, search bar, cart badge
│       │   │   │   └── Footer.tsx
│       │   │   ├── order/
│       │   │   │   └── OrderStatusBadge.tsx # Color-coded status pill
│       │   │   ├── product/
│       │   │   │   └── ProductCard.tsx      # Product grid card with add-to-cart
│       │   │   └── ui/                      # Generic UI primitives (Button, Modal, etc.)
│       │   ├── hooks/
│       │   │   └── useOrders.ts             # TanStack Query wrappers for all order API calls
│       │   ├── lib/
│       │   │   ├── constants.ts             # ORDER_STATUS_CONFIG, STATUS_STEPS, PROMO_CODES
│       │   │   └── utils.ts                 # formatCurrency, formatDate, truncateId, cn()
│       │   ├── mocks/
│       │   │   ├── products.mock.ts         # 24 products across 6 categories (never from API)
│       │   │   ├── payment.mock.ts          # processMockPayment() — 1.5s delay, always succeeds
│       │   │   └── user.mock.ts             # MOCK_USER: Alex Johnson, hardcoded customer ID
│       │   ├── pages/
│       │   │   ├── Home/                    # Hero, categories, featured products, deals
│       │   │   ├── Products/
│       │   │   │   ├── index.tsx            # Grid with sidebar filters + sorting + pagination
│       │   │   │   └── detail.tsx           # Image gallery, add to cart, related products
│       │   │   ├── Cart/                    # Item list, qty controls, promo code, summary
│       │   │   ├── Checkout/                # 4-step: Address → Delivery → Payment → Review
│       │   │   ├── OrderConfirmation/       # Confetti, order summary, next steps
│       │   │   ├── Orders/
│       │   │   │   ├── index.tsx            # Status-tab list, cancel dialog
│       │   │   │   └── detail.tsx           # Full order detail, status timeline
│       │   │   ├── OrderTracking/           # Visual progress bar, mock delivery timeline
│       │   │   ├── OrderAudit/              # Timeline of MongoDB audit events (real API)
│       │   │   └── Admin/                   # Stats, full order table, inline status update
│       │   ├── router/
│       │   │   └── index.tsx                # createBrowserRouter, all routes lazy-loaded
│       │   ├── stores/
│       │   │   ├── cart.store.ts            # Zustand, persisted to localStorage
│       │   │   └── checkout.store.ts        # Zustand, step/address/delivery/promo state
│       │   └── main.tsx                     # RouterProvider + QueryClientProvider + Toaster
│       ├── .env.local                       # VITE_API_BASE_URL (not committed)
│       ├── tailwind.config.js               # Custom colors: primary #FF6B35, secondary #1A1A2E
│       ├── tsconfig.app.json                # strict: true, path aliases
│       └── vite.config.ts                   # Port 5173, @/ alias, API proxy
│
├── tests/
│   ├── OrderProcessing.UnitTests/           # Domain rules + Application handlers (Moq)
│   └── OrderProcessing.IntegrationTests/   # Full HTTP round-trips (Testcontainers)
│
├── docker-compose.yml                       # PostgreSQL 16, MongoDB 7, Redis 7-alpine
├── .env.example                             # All required environment variables documented
├── CLAUDE.md                                # AI coding standards + OWASP + DoD checklist
└── OrderProcessing.sln
```

---

## Tech Stack

### Backend
| Package | Version | Purpose |
|---------|---------|---------|
| .NET | 8.0 | Target framework |
| MediatR | 12.4.1 | CQRS dispatcher |
| FluentValidation | 11.11.0 | Command/query validators |
| Mapster | 7.4.0 | Object mapping (DTOs) |
| EF Core + Npgsql | 8.x | PostgreSQL ORM |
| MongoDB.Driver | 3.1.0 | Audit log persistence |
| StackExchange.Redis | 2.8.16 | Order list caching |
| Polly | 8.5.2 | Retry policies on DB calls |
| Serilog | latest | Structured logging (file + console) |
| Swashbuckle | 6.x | Swagger / OpenAPI |
| xUnit + Moq + FluentAssertions | latest | Unit & integration tests |
| Testcontainers | latest | Docker-based integration tests |

### Frontend
| Package | Version | Purpose |
|---------|---------|---------|
| React | 18 | UI framework |
| TypeScript | 5 (strict) | Type safety |
| Vite | 5 | Build tool + dev server |
| React Router | v6 | Client-side routing |
| TanStack Query | v5 | Server state + caching |
| Zustand | latest | Client state (cart, checkout) |
| Tailwind CSS | v3 | Utility-first styling |
| Framer Motion | latest | Animations |
| Lucide React | latest | Icon set |
| Sonner | latest | Toast notifications |
| Axios | latest | HTTP client |

---

## Features

### Order Management
| Feature | Details |
|---------|---------|
| **Create Order** | POST with multiple line items; calculates totals; raises `OrderCreatedEvent` |
| **Get Order** | Fetch by GUID; 404 via Result pattern (no exceptions) |
| **List Orders** | Paginated (page + pageSize); filterable by status; Redis-cached for 60s |
| **Update Status** | PATCH with target status; enforces valid transitions only |
| **Cancel Order** | Only allowed on `Pending` orders; captures cancel reason; raises `OrderCancelledEvent` |
| **Order Audit Log** | GET `/orders/{id}/audit` — full MongoDB event timeline |

### Status State Machine
```
Pending ──▶ Processing ──▶ Shipped ──▶ Delivered
   │
   └──▶ Cancelled  (only from Pending)
```
Invalid transitions are rejected with `422 Unprocessable Entity`.

### Background Job
- Runs every **5 minutes** via `PeriodicTimer` (hosted service)
- Auto-transitions all `Pending` orders older than 5 minutes → `Processing`
- Batch update via `ExecuteUpdateAsync` (single SQL round-trip)
- Writes MongoDB audit event per transitioned order
- Invalidates Redis list cache after batch

### Resilience & Observability
- **Polly**: 3 retries with exponential backoff on PostgreSQL transient errors
- **MongoDB/Redis**: non-fatal — failures logged as Warning, system continues
- **Serilog**: structured logs with `OrderId`, `CustomerId`, `CorrelationId` enrichment
- **Health checks**: `/health` endpoint (PostgreSQL + Redis + MongoDB)
- **Correlation ID**: every HTTP request gets `X-Correlation-Id` tracked end-to-end

---

## API Endpoints

Base URL: `http://localhost:5000/api/v1`

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/orders` | Create a new order |
| `GET` | `/orders/{id}` | Get order by ID |
| `GET` | `/orders` | List orders (paginated, filterable) |
| `PATCH` | `/orders/{id}/status` | Update order status |
| `DELETE` | `/orders/{id}` | Cancel order (Pending only) |
| `GET` | `/orders/{id}/audit` | Fetch audit log from MongoDB |
| `GET` | `/health` | Infrastructure health check |
| `GET` | `/swagger` | Interactive API documentation (dev only) |

### Example: Create Order
```json
POST /api/v1/orders
{
  "customerId": "cust-550e8400-e29b-41d4-a716-446655440000",
  "items": [
    { "productId": "prod-001", "productName": "iPhone 15 Pro", "unitPrice": 999.99, "quantity": 1 },
    { "productId": "prod-002", "productName": "AirPods Pro", "unitPrice": 249.99, "quantity": 2 }
  ]
}
```

### Example: Update Status
```json
PATCH /api/v1/orders/{id}/status
{ "status": "Shipped" }
```

### List Orders Query Parameters
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `status` | string | — | Filter by status (Pending, Processing, etc.) |
| `page` | int | 1 | Page number |
| `pageSize` | int | 10 | Items per page (max 50) |

---

## UI Pages

| Route | Page | What it does |
|-------|------|-------------|
| `/` | Home | Hero banner, category strip, featured products, deals of the day, trust badges |
| `/products` | Product List | Grid with sidebar filters (category, price range, in-stock), sorting, pagination |
| `/products/:id` | Product Detail | Image gallery, add-to-cart with animation, buy-now, related products |
| `/cart` | Cart | Line items with qty controls, promo codes (`SAVE10` = 10% off), order summary |
| `/checkout` | Checkout | 4-step wizard: Shipping Address → Delivery Option → Payment (mock) → Review & Place |
| `/checkout/success` | Order Confirmation | Confetti animation, order ID, estimated delivery, next steps |
| `/orders` | Order History | Status tabs, paginated order cards, cancel with reason dialog |
| `/orders/:id` | Order Detail | Full order breakdown, status timeline, cancel modal |
| `/orders/:id/track` | Order Tracking | Visual route progress bar, mock delivery event timeline per status |
| `/orders/:id/audit` | Audit Log | MongoDB-sourced event timeline (real API call) |
| `/admin` | Admin Dashboard | Stats cards, full orders table, inline status transitions, cancel |

### Mock Data (no real integrations)
- **Products**: 24 hardcoded products across Electronics, Books, Clothing, Home & Kitchen, Sports, Beauty
- **Payment**: always succeeds after a 1.5s simulated delay — no real gateway
- **User**: hardcoded `MOCK_USER` (Alex Johnson) — no authentication flow
- **Orders**: all order CRUD hits the real .NET API

---

## Running Locally

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- [Node.js 20+](https://nodejs.org/)

### Step 1 — Start Infrastructure
```bash
docker-compose up -d
# Starts PostgreSQL:5432, MongoDB:27017, Redis:6379
```

### Step 2 — Run Database Migrations
```bash
dotnet ef migrations add InitialCreate \
  --project src/OrderProcessing.Infrastructure \
  --startup-project src/OrderProcessing.API

dotnet ef database update \
  --startup-project src/OrderProcessing.API
```

### Step 3 — Run the API
```bash
cd src/OrderProcessing.API
dotnet run
# API:     http://localhost:5000
# Swagger: http://localhost:5000/swagger
```

### Step 4 — Run the UI
```bash
cd src/OrderProcessing.UI
npm install
npm run dev
# UI: http://localhost:5173
```

### Verify Health
```bash
curl http://localhost:5000/health
# Expected: {"status":"Healthy","results":{"postgresql":{"status":"Healthy"},"redis":{"status":"Healthy"},"mongodb":{"status":"Healthy"}}}
```

---

## Database & Migrations

### EF Core (PostgreSQL)
```bash
# Add a new migration
dotnet ef migrations add <MigrationName> \
  --project src/OrderProcessing.Infrastructure \
  --startup-project src/OrderProcessing.API

# Apply migrations
dotnet ef database update --startup-project src/OrderProcessing.API

# Rollback one migration
dotnet ef database update <PreviousMigrationName> --startup-project src/OrderProcessing.API
```

### MongoDB
No schema migrations needed — audit collection is append-only. Index is created on startup:
```
db.order_audit_events.createIndex({ orderId: 1, occurredAt: -1 })
```

### Redis
No setup needed — keys are created on first cache write, expire after 60 seconds.

---

## Testing

### Unit Tests
```bash
dotnet test tests/OrderProcessing.UnitTests
```
Covers: domain entity business rules, status transition validation, Result pattern, Application command handlers (with Moq).

### Integration Tests
```bash
dotnet test tests/OrderProcessing.IntegrationTests
```
Spins up real PostgreSQL + MongoDB + Redis via **Testcontainers** — full HTTP round-trip tests using `WebApplicationFactory`.

### Run All Tests
```bash
dotnet test
```

### UI Type Check
```bash
cd src/OrderProcessing.UI
npx tsc --noEmit    # zero errors expected
npm run build       # production bundle
```

---

## Environment Variables

Copy `.env.example` to `.env` and update values for your environment.

| Variable | Used By | Default |
|----------|---------|---------|
| `POSTGRES_USER` | docker-compose, API | `order_user` |
| `POSTGRES_PASSWORD` | docker-compose, API | `order_pass` |
| `POSTGRES_DB` | docker-compose, API | `order_processing` |
| `MONGO_ROOT_USER` | docker-compose, API | `mongo_user` |
| `MONGO_ROOT_PASSWORD` | docker-compose, API | `mongo_pass` |
| `REDIS_PASSWORD` | docker-compose, API | `redis_pass` |
| `VITE_API_BASE_URL` | React UI (Vite) | `http://localhost:5000/api/v1` |
| `ASPNETCORE_ENVIRONMENT` | API | `Development` |

Connection strings are in `src/OrderProcessing.API/appsettings.Development.json`.

---

## Design Decisions

### Why Clean Architecture?
Dependencies flow strictly inward: `Domain ← Application ← Infrastructure ← API`. The Domain has zero NuGet dependencies. Business rules are testable in isolation without spinning up a database.

### Why Result<T, E> instead of exceptions?
Exceptions for control flow are expensive and mask intent. `Result.Match()` forces callers to handle both success and failure paths explicitly. Only infrastructure failures (network, disk) surface as exceptions.

### Why separate MongoDB for auditing?
Audit events are append-only and schema-flexible — a document store is a better fit than adding audit columns to every PostgreSQL row. Writes are non-fatal so a MongoDB outage doesn't break order creation.

### Why Redis list cache with 60s TTL?
Order lists are read-heavy. The 60-second TTL with write-through invalidation reduces PostgreSQL load significantly while keeping data fresh enough for the UI. Redis failures degrade to direct DB reads.

### Why `PeriodicTimer` for the background job?
`PeriodicTimer` (introduced in .NET 6) avoids timer drift and integrates cleanly with `CancellationToken` for graceful shutdown — unlike `Task.Delay` loops or `System.Threading.Timer`.

### Why MassTransit abstraction (planned)?
Direct Kafka client code couples the application to a specific broker. MassTransit lets tests use an in-memory bus, staging use RabbitMQ, and production use Kafka — without changing application code.
