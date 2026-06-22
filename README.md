# E-Commerce Order Processing System

Full-stack order management system built with **.NET 8 Clean Architecture** and **React 18**. Demonstrates polyglot persistence (PostgreSQL + MongoDB + Redis), CQRS with MediatR, domain-driven design, real-time inventory management, and a rich Amazon-style UI.

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
│  + RabbitMQ (MassTransit) + Background Jobs          │
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
| **PostgreSQL 16** | Orders, order items, products, inventory reservations | ACID transactions, relational integrity |
| **MongoDB 7** | Audit event log | Append-only, schema-flexible, non-fatal writes |
| **Redis 7** | Order list cache (60s TTL) | Reduce PostgreSQL read load on list queries |
| **RabbitMQ 3** | Event bus | Decoupled side-effects (audit writes, cache invalidation) via MassTransit consumers |

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
│   │   │   ├── Order.cs                     # Aggregate root; status transitions, cancel, refund
│   │   │   ├── OrderItem.cs                 # Line item with Subtotal computed property
│   │   │   ├── Product.cs                   # Inventory entity; Reserve/Release/ConfirmSale/RestoreStock
│   │   │   └── InventoryReservation.cs      # 15-min checkout hold; Active/Converted/Released/Expired
│   │   ├── Enums/
│   │   │   ├── OrderStatus.cs               # Pending, Processing, Shipped, Delivered, Cancelled,
│   │   │   │                                #   RefundRequested, RefundApproved, RefundRejected
│   │   │   └── ReservationStatus.cs         # Active, Converted, Released, Expired
│   │   ├── Errors/
│   │   │   └── DomainErrors.cs              # Static error catalog (Order, OrderItem, User, Inventory)
│   │   └── Events/
│   │       ├── OrderCreatedEvent.cs
│   │       ├── OrderStatusChangedEvent.cs
│   │       └── OrderCancelledEvent.cs
│   │
│   ├── OrderProcessing.Application/         # Use-cases, orchestration — no infra deps
│   │   ├── Orders/
│   │   │   ├── Commands/
│   │   │   │   ├── CreateOrder/             # Converts reservations → permanent stock deduction
│   │   │   │   ├── UpdateOrderStatus/
│   │   │   │   ├── CancelOrder/             # Restores stock for every cancelled item
│   │   │   │   ├── RequestRefund/           # Customer: Delivered → RefundRequested
│   │   │   │   └── ProcessRefund/           # Admin: approve (restores stock) or reject
│   │   │   └── Queries/
│   │   │       ├── GetOrderById/
│   │   │       ├── ListOrders/
│   │   │       └── GetOrderAudit/
│   │   ├── Products/
│   │   │   └── Queries/
│   │   │       └── GetProducts/             # Returns all products with live stock counts
│   │   ├── Inventory/
│   │   │   └── Commands/
│   │   │       ├── ReserveStock/            # Increments reserved_quantity, creates reservation rows
│   │   │       └── ReleaseReservation/      # Decrements reserved_quantity, marks reservations Released
│   │   ├── DTOs/
│   │   │   ├── OrderDto.cs
│   │   │   ├── OrderItemDto.cs
│   │   │   ├── AuditEventDto.cs
│   │   │   ├── ProductDto.cs                # Includes stock_quantity, reserved_quantity, available_quantity
│   │   │   ├── ReservationDto.cs            # Returned to UI: reservationId + expiresAt
│   │   │   └── OrderMappings.cs
│   │   ├── Interfaces/
│   │   │   ├── IOrderRepository.cs
│   │   │   ├── IOrderAuditRepository.cs
│   │   │   ├── IOrderCacheService.cs
│   │   │   ├── IProductRepository.cs        # GetByExternalId(s), UpdateRange
│   │   │   └── IInventoryReservationRepository.cs  # GetByIds, GetExpiredActive
│   │   └── Common/
│   │       ├── Behaviors/
│   │       │   ├── ValidationBehavior.cs
│   │       │   └── LoggingBehavior.cs
│   │       └── DependencyInjection/
│   │           └── ApplicationServiceExtensions.cs
│   │
│   ├── OrderProcessing.Infrastructure/      # Implements Application interfaces
│   │   ├── Persistence/
│   │   │   ├── PostgreSQL/
│   │   │   │   ├── AppDbContext.cs          # DbSets: Orders, OrderItems, Users, Products,
│   │   │   │   │                            #         InventoryReservations
│   │   │   │   ├── AppDbContextFactory.cs   # IDesignTimeDbContextFactory for EF migrations
│   │   │   │   ├── ProductSeeder.cs         # Seeds 24 products on first startup (idempotent)
│   │   │   │   ├── Migrations/              # EF Core code-first migrations
│   │   │   │   └── Configurations/
│   │   │   │       ├── OrderConfiguration.cs
│   │   │   │       ├── OrderItemConfiguration.cs
│   │   │   │       ├── UserConfiguration.cs
│   │   │   │       ├── ProductConfiguration.cs           # external_id unique index
│   │   │   │       └── InventoryReservationConfiguration.cs  # status + expires_at indexes
│   │   │   ├── MongoDB/
│   │   │   │   ├── OrderAuditDocument.cs
│   │   │   │   └── OrderAuditRepository.cs
│   │   │   └── Redis/
│   │   │       └── OrderCacheService.cs
│   │   ├── Repositories/
│   │   │   ├── OrderRepository.cs
│   │   │   ├── UserRepository.cs
│   │   │   ├── ProductRepository.cs         # GetByExternalIds, UpdateRange
│   │   │   └── InventoryReservationRepository.cs  # GetExpiredActive for expiry job
│   │   ├── BackgroundJobs/
│   │   │   ├── OrderProcessingJob.cs        # Pending→Processing every 5 min
│   │   │   └── ReservationExpiryJob.cs      # Releases stale reservations every 1 min
│   │   └── DependencyInjection/
│   │       └── InfrastructureServiceExtensions.cs
│   │
│   ├── OrderProcessing.API/                 # HTTP surface — no business logic
│   │   ├── Controllers/
│   │   │   ├── OrdersController.cs          # Orders CRUD + refund/request + refund/process
│   │   │   ├── ProductsController.cs        # GET /products, POST /reserve, POST /release
│   │   │   └── AuthController.cs
│   │   ├── Middleware/
│   │   │   ├── ExceptionMiddleware.cs
│   │   │   └── MongoDbHealthCheck.cs
│   │   ├── appsettings.json
│   │   ├── appsettings.Development.json
│   │   └── Program.cs                       # Auto-migrates + seeds products on startup (dev)
│   │
│   └── OrderProcessing.UI/                  # React 18 frontend
│       ├── src/
│       │   ├── api/
│       │   │   ├── client.ts                # Axios instance, correlation ID, envelope unwrap
│       │   │   ├── orders.api.ts            # Order CRUD
│       │   │   ├── products.api.ts          # getAll, reserveStock, releaseReservations,
│       │   │   │                            #   requestRefund, processRefund
│       │   │   └── types.ts                 # OrderStatus (incl. refund states), ProductDto,
│       │   │                                #   ReservationDto, CreateOrderRequest
│       │   ├── components/
│       │   │   ├── layout/
│       │   │   │   ├── Header.tsx
│       │   │   │   └── Footer.tsx
│       │   │   ├── order/
│       │   │   │   └── OrderStatusBadge.tsx # Handles all 8 statuses incl. refund states
│       │   │   └── product/
│       │   │       └── ProductCard.tsx      # Live stock badge; "X left", "Out of Stock" overlay
│       │   ├── hooks/
│       │   │   ├── useOrders.ts             # TanStack Query wrappers for order API
│       │   │   └── useProducts.ts           # useProducts, useProductStock, useReserveStock,
│       │   │                                #   useReleaseReservations, useRequestRefund,
│       │   │                                #   useProcessRefund
│       │   ├── lib/
│       │   │   ├── constants.ts             # ORDER_STATUS_CONFIG (all 8 statuses), DELIVERY_OPTIONS
│       │   │   └── utils.ts
│       │   ├── mocks/
│       │   │   ├── products.mock.ts         # Static metadata (name, images, price, etc.)
│       │   │   │                            # Stock counts come from /api/v1/products at runtime
│       │   │   ├── payment.mock.ts
│       │   │   └── user.mock.ts
│       │   ├── pages/
│       │   │   ├── Home/
│       │   │   ├── Products/
│       │   │   ├── Cart/
│       │   │   ├── Checkout/                # Reserves stock on payment→review transition;
│       │   │   │                            #   passes reservationIds with order; shows expiry time
│       │   │   ├── Orders/
│       │   │   │   ├── index.tsx            # Refund button (Delivered), status badges for all states
│       │   │   │   └── detail.tsx
│       │   │   ├── OrderTracking/
│       │   │   ├── OrderAudit/
│       │   │   └── Admin/
│       │   │       └── index.tsx            # Orders tab + Refund Requests tab (search by
│       │   │                                #   Order ID or Customer ID; Approve/Reject buttons)
│       │   ├── router/
│       │   ├── stores/
│       │   │   ├── auth.store.ts            # Persists user (incl. customerId); clears activity on logout
│       │   │   ├── cart.store.ts
│       │   │   ├── checkout.store.ts
│       │   │   └── activity.store.ts        # Recently viewed product IDs
│       │   └── main.tsx
│       └── vite.config.ts
│
├── tests/
│   ├── OrderProcessing.UnitTests/           # Domain + Application handlers (Moq)
│   └── OrderProcessing.IntegrationTests/   # Full HTTP round-trips (Testcontainers)
│
├── docker-compose.yml                       # PostgreSQL 16, MongoDB 7, Redis 7-alpine, RabbitMQ
├── .env.example
├── CLAUDE.md
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
| MassTransit + RabbitMQ | 8.3.6 | Event-driven messaging |
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
| Zustand | latest | Client state (cart, checkout, auth, activity) |
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
| **Create Order** | POST with multiple line items; reduces inventory stock; publishes `OrderCreatedMessage` |
| **Get Order** | Fetch by GUID with customer ownership check (returns 404 for both not-found and unauthorized) |
| **List Orders** | Paginated; filterable by status and customerId; Redis-cached for 60s |
| **Update Status** | PATCH with target status; enforces valid transitions only |
| **Cancel Order** | Only allowed on `Pending` orders; automatically restores stock for all items |
| **Order Audit Log** | GET `/orders/{id}/audit` — event timeline sourced from MongoDB |

### Inventory Management
| Feature | Details |
|---------|---------|
| **Live Stock Counts** | `GET /api/v1/products` returns all 24 products with `stockQuantity`, `reservedQuantity`, `availableQuantity`, `inStock` |
| **Checkout Reservation** | When the user proceeds from Payment → Review, stock is reserved for 15 minutes. The UI shows the hold expiry time. Items unavailable at reservation time block checkout with an error. |
| **Order Confirmation** | On "Place Order", reservation IDs travel with the create-order request. The backend converts each reservation: `stockQuantity--`, `reservedQuantity--` in a single DB save. |
| **Abandoned Checkout** | `ReservationExpiryJob` runs every 1 minute, finds expired `Active` reservations, releases reserved quantity back to available, and marks them `Expired`. |
| **Cancellation Rollback** | Cancelling an order (Pending only) triggers `RestoreStock` for every line item — `stockQuantity++`. |
| **Product Seeder** | All 24 mock products are seeded into PostgreSQL on first API startup (idempotent — skips if products already exist). |

### Inventory State Machine (per reservation)
```
Active ──▶ Converted  (order placed)
   │
   ├──▶ Released   (user abandoned checkout — manual API call)
   │
   └──▶ Expired    (15-min TTL, background job)
```

### Status State Machine (per order)
```
Pending ──▶ Processing ──▶ Shipped ──▶ Delivered ──▶ RefundRequested
   │                                                       │
   └──▶ Cancelled  (Pending only; stock restored)    ┌─────┴─────┐
                                                     ▼           ▼
                                              RefundApproved  RefundRejected
                                            (stock restored)
```
Invalid transitions are rejected with `422 Unprocessable Entity`.

### Refund Management
| Actor | Action | Result |
|-------|--------|--------|
| Customer | Clicks "Refund" on a `Delivered` order | Status → `RefundRequested` |
| Admin | Approves refund in admin portal | Status → `RefundApproved`; stock restored for all items |
| Admin | Rejects refund in admin portal | Status → `RefundRejected`; stock unchanged |

Admin can filter refund requests by **Order ID** or **Customer ID** using the search box on the Refund Requests tab.

### Event-Driven Architecture (RabbitMQ + MassTransit)
Every mutating operation publishes a message to RabbitMQ. Three consumers handle side-effects asynchronously:

| Message | Consumer | Side-effect |
|---------|----------|-------------|
| `OrderCreatedMessage` | `OrderCreatedConsumer` | Append audit event to MongoDB |
| `OrderStatusChangedMessage` | `OrderStatusChangedConsumer` | Append audit event + invalidate Redis list cache |
| `OrderCancelledMessage` | `OrderCancelledConsumer` | Append audit event + invalidate Redis list cache |

Broker unavailability is **non-fatal** — a warning is logged and the HTTP response still succeeds.

### Background Jobs
| Job | Interval | What it does |
|-----|----------|-------------|
| `OrderProcessingJob` | Every 5 min | Auto-transitions `Pending` orders older than 5 min → `Processing` |
| `ReservationExpiryJob` | Every 1 min | Finds expired `Active` reservations, releases reserved quantity back to available stock |

### Resilience & Observability
- **Polly**: 3 retries with exponential backoff on PostgreSQL transient errors
- **MongoDB/Redis**: non-fatal — failures logged as Warning, system continues
- **RabbitMQ**: non-fatal — broker unavailability logs a warning; HTTP response is unaffected
- **Serilog**: structured logs with `OrderId`, `CustomerId`, `CorrelationId` enrichment
- **Health checks**: `/health` endpoint (PostgreSQL + Redis + MongoDB)
- **Correlation ID**: every HTTP request gets `X-Correlation-Id` tracked end-to-end

---

## API Endpoints

Base URL: `http://localhost:5000/api/v1`

### Orders

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/orders` | Create order (accepts optional `reservationIds` to convert held stock) |
| `GET` | `/orders/{id}` | Get order by ID (ownership-checked via `customerId` query param) |
| `GET` | `/orders` | List orders — `?status=&customerId=&page=1&pageSize=10` |
| `PATCH` | `/orders/{id}/status` | Update status (admin) |
| `POST` | `/orders/{id}/cancel` | Cancel order — restores stock |
| `POST` | `/orders/{id}/refund/request` | Customer requests refund (`Delivered` only) |
| `POST` | `/orders/{id}/refund/process` | Admin approves or rejects a refund |
| `GET` | `/orders/{id}/audit` | Fetch audit event log from MongoDB |

### Products & Inventory

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/products` | List all products with live stock counts |
| `POST` | `/products/reserve` | Reserve stock for checkout (15-min hold) — returns reservation IDs |
| `POST` | `/products/release` | Release reservations (user abandoned checkout) |

### Other

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Infrastructure health check |
| `GET` | `/swagger` | Interactive API docs (dev only) |

### Example: Create Order with Reservation
```json
POST /api/v1/orders
{
  "customerId": "cust-550e8400-e29b-41d4-a716-446655440000",
  "items": [
    { "productId": "prod-001", "productName": "UltraBook Pro 15\"", "unitPrice": 1299.00, "quantity": 1 }
  ],
  "reservationIds": ["3fa85f64-5717-4562-b3fc-2c963f66afa6"]
}
```

### Example: Reserve Stock
```json
POST /api/v1/products/reserve
{
  "customerId": "cust-550e8400-e29b-41d4-a716-446655440000",
  "items": [
    { "externalProductId": "prod-001", "quantity": 1 }
  ]
}
```
Response includes `reservationId` and `expiresAt` (15 min from now).

### Example: Process Refund (Admin)
```json
POST /api/v1/orders/{id}/refund/process
{ "approve": true }
```

### List Orders Query Parameters
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `status` | string | — | Filter by status (Pending, RefundRequested, etc.) |
| `customerId` | string | — | Scope to a specific customer |
| `page` | int | 1 | Page number |
| `pageSize` | int | 10 | Items per page (max 50) |

---

## UI Pages

| Route | Page | What it does |
|-------|------|-------------|
| `/` | Home | Hero, categories, featured products, personalised recommendations |
| `/products` | Product List | Grid with live stock badges; "X left", "Only X left — order soon!", "Out of Stock" overlay |
| `/products/:id` | Product Detail | Image gallery, add to cart, related products |
| `/cart` | Cart | Line items, qty controls, promo codes, order summary |
| `/checkout` | Checkout | 4 steps: Address → Delivery → Payment → Review. Stock is reserved when the user proceeds from Payment to Review. Review shows hold expiry time. |
| `/checkout/success` | Confirmation | Confetti, order ID, estimated delivery |
| `/orders` | Order History | Status tabs, paginated cards; Refund button (Delivered orders); status badges for all 8 statuses |
| `/orders/:id` | Order Detail | Full breakdown, status timeline |
| `/orders/:id/track` | Tracking | Visual progress bar, delivery event timeline |
| `/orders/:id/audit` | Audit Log | MongoDB-sourced event timeline |
| `/admin` | Admin Dashboard | **Orders tab**: stats cards, full order table, inline transitions, cancel. **Refund Requests tab**: pending refunds with search (Order ID / Customer ID), Approve / Reject buttons. |

### Stock Display Rules
| Condition | Display |
|-----------|---------|
| `availableQuantity > 10` | No stock indicator (plenty available) |
| `3 < availableQuantity ≤ 10` | Amber text: "X left in stock" |
| `availableQuantity ≤ 3` | Red text: "Only X left — order soon!" |
| `availableQuantity = 0` | Dark overlay on image: "Out of Stock"; Add to Cart disabled |

---

## Running Locally

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- [Node.js 20+](https://nodejs.org/)

### Step 1 — Start Infrastructure
```bash
docker-compose up -d
# Starts PostgreSQL:5432, MongoDB:27017, Redis:6379, RabbitMQ:5672
# RabbitMQ management UI: http://localhost:15672
```

### Step 2 — Run the API
```bash
cd src/OrderProcessing.API
dotnet run
# API:     http://localhost:5000
# Swagger: http://localhost:5000/swagger
```

On first startup in `Development`, the API automatically:
1. Runs all pending EF Core migrations (creates `orders`, `products`, `inventory_reservations`, etc.)
2. Seeds the `admin` user (username: `admin`, password: `admin`)
3. Seeds all 24 products with their initial stock quantities

### Step 3 — Run the UI
```bash
cd src/OrderProcessing.UI
npm install
npm run dev
# UI: http://localhost:5173
```

### Step 4 — Verify Health
```bash
curl http://localhost:5000/health
# Expected: {"status":"Healthy","results":{"postgresql":{"status":"Healthy"},...}}
```

### Default Accounts
| Username | Password | Role |
|----------|----------|------|
| `admin` | `admin` | Admin — sees all orders; manages refunds |
| Any registered user | (chosen at registration) | Customer — sees own orders; can request refunds |

---

## Database & Migrations

### Schema

| Table | Description |
|-------|-------------|
| `orders` | Order header (customerId, status, totalAmount, timestamps) |
| `order_items` | Line items belonging to an order |
| `users` | Registered users (hashed passwords, customerId) |
| `products` | Product catalogue with `stock_quantity` and `reserved_quantity` |
| `inventory_reservations` | 15-min checkout holds; tracks status per reservation |

### EF Core Commands
```bash
# Add a new migration
dotnet ef migrations add <MigrationName> \
  --project src/OrderProcessing.Infrastructure \
  --startup-project src/OrderProcessing.API

# Apply migrations manually (or just start the API — it auto-migrates in dev)
dotnet ef database update \
  --project src/OrderProcessing.Infrastructure \
  --startup-project src/OrderProcessing.API

# Rollback one migration
dotnet ef database update <PreviousMigrationName> \
  --project src/OrderProcessing.Infrastructure \
  --startup-project src/OrderProcessing.API
```

> **Note:** The `dotnet ef` tools require Docker to be running (they need to reach PostgreSQL). The `IDesignTimeDbContextFactory` in the Infrastructure project provides a standalone DbContext for migration generation even when Redis/RabbitMQ are unavailable.

### MongoDB
No schema migrations — audit collection is append-only. Index created on startup:
```
db.order_audit_events.createIndex({ orderId: 1, occurredAt: -1 })
```

### Redis
No setup required — keys are created on first cache write, expire after 60 seconds.

---

## Testing

### Unit Tests
```bash
dotnet test tests/OrderProcessing.UnitTests
```
Covers: domain entity business rules, status transition validation, Result pattern, command handlers (CreateOrder, CancelOrder) with mocked `IProductRepository` and `IInventoryReservationRepository`.

### Integration Tests
```bash
dotnet test tests/OrderProcessing.IntegrationTests
```
Spins up real PostgreSQL via **Testcontainers**. MongoDB, Redis, and MassTransit are replaced with no-op mocks so tests run without Docker dependencies for those services.

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

Copy `.env.example` to `.env` and update for your environment.

| Variable | Used By | Default |
|----------|---------|---------|
| `POSTGRES_USER` | docker-compose, API | `order_user` |
| `POSTGRES_PASSWORD` | docker-compose, API | `order_pass` |
| `POSTGRES_DB` | docker-compose, API | `order_processing` |
| `MONGO_ROOT_USER` | docker-compose, API | `mongo_user` |
| `MONGO_ROOT_PASSWORD` | docker-compose, API | `mongo_pass` |
| `REDIS_PASSWORD` | docker-compose, API | `redis_pass` |
| `VITE_API_BASE_URL` | React UI | `http://localhost:5000/api/v1` |
| `ASPNETCORE_ENVIRONMENT` | API | `Development` |

Connection strings are in `src/OrderProcessing.API/appsettings.Development.json`.

---

## Design Decisions

### Why Clean Architecture?
Dependencies flow strictly inward: `Domain ← Application ← Infrastructure ← API`. The Domain has zero NuGet dependencies. Business rules are testable in isolation without spinning up a database.

### Why Result<T, E> instead of exceptions?
Exceptions for control flow are expensive and mask intent. `Result.Match()` forces callers to handle both success and failure paths explicitly. Only infrastructure failures (network, disk) surface as exceptions.

### Why inventory reservations instead of optimistic locking?
Optimistic locking (row versions) resolves conflicts after the fact — the last writer loses. For e-commerce checkout, we need to hold stock proactively: the moment a user enters the payment step, no one else should be able to buy the last unit. A 15-minute reservation row achieves this without blocking. The `ReservationExpiryJob` reclaims abandoned holds within 60 seconds of their expiry.

### Why `AvailableQuantity = StockQuantity - ReservedQuantity`?
Separating reserved from confirmed-sold lets us compute availability in a single read without joining to reservation rows. Both columns live on the `products` table. Reservations are the accounting ledger; the product row is the running balance.

### Why restore stock on both cancel and refund-approved?
Cancel happens on `Pending` orders — the stock was deducted when the order was placed, so it must be restored. Refund-approved happens on `Delivered` orders — the customer is returning the goods, so stock is restored to reflect that inventory is physically back. Refund-rejected leaves stock unchanged.

### Why separate MongoDB for auditing?
Audit events are append-only and schema-flexible — a document store is a better fit than adding audit columns to every PostgreSQL row. Writes are non-fatal so a MongoDB outage doesn't break order creation.

### Why Redis list cache with 60s TTL?
Order lists are read-heavy. The 60-second TTL with write-through invalidation reduces PostgreSQL load while keeping data fresh enough for the UI. Redis failures degrade gracefully to direct DB reads.

### Why `PeriodicTimer` for background jobs?
`PeriodicTimer` (introduced in .NET 6) avoids timer drift and integrates cleanly with `CancellationToken` for graceful shutdown — unlike `Task.Delay` loops or `System.Threading.Timer`.

### Why MassTransit + RabbitMQ?
Direct coupling (writing audit + invalidating cache inside HTTP handlers) creates hidden failure modes. With MassTransit, each consumer is independently retriable and observable. The `IEventBus` abstraction keeps the Application layer clean — swapping RabbitMQ for Kafka requires only an Infrastructure change.

### Why version-based Redis cache invalidation?
`server.Keys(pattern)` performs a blocking O(N) SCAN. Instead, `InvalidateListAsync` increments an atomic version counter (`orders:cache:v`). Cache keys embed the version, so incrementing it instantly makes all prior entries unreachable. Old keys expire naturally via their 60s TTL.
