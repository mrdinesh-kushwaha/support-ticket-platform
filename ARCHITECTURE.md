# ARCHITECTURE.md — SupportDesk AI Platform

> **TL;DR** — A production-grade, full-stack support ticket system with AI-powered triage, real-time WebSocket notifications, immutable audit trail, and role-based access control. Built with Java 21 + Spring Boot 3.2 (backend) and React 18 + TypeScript (frontend), deployable via Docker Compose in one command.

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Request Lifecycle](#2-request-lifecycle)
3. [Frontend Architecture](#3-frontend-architecture)
4. [Backend Architecture](#4-backend-architecture)
5. [Database Design](#5-database-design)
6. [Authentication & Security](#6-authentication--security)
7. [AI Triage Engine](#7-ai-triage-engine)
8. [Real-Time Notifications (WebSocket)](#8-real-time-notifications-websocket)
9. [Key Design Decisions & Trade-offs](#9-key-design-decisions--trade-offs)
10. [Future Roadmap](#10-future-roadmap)

---

## 1. System Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│                         CLIENT (Browser)                             │
│          React 18 + TypeScript + Tailwind + Zustand + TanStack       │
│                                                                      │
│   ┌──────────────┐   ┌──────────────┐   ┌────────────────────────┐  │
│   │  Auth Pages  │   │  Ticket UI   │   │  Agent Dashboard /     │  │
│   │  Login/Reg   │   │  CRUD, Filter│   │  Analytics / Assign    │  │
│   └──────────────┘   └──────────────┘   └────────────────────────┘  │
│           │                  │                        │              │
│   ┌───────▼──────────────────▼────────────────────────▼───────────┐ │
│   │         Axios HTTP Client  +  STOMP/SockJS WebSocket           │ │
│   │         (JWT injected via interceptor on every request)        │ │
│   └───────────────────────────┬───────────────────────────────────┘ │
└───────────────────────────────│──────────────────────────────────────┘
                                │ HTTPS REST + WS
                                ▼
┌──────────────────────────────────────────────────────────────────────┐
│                   SPRING BOOT 3.2  (Java 21)                         │
│                                                                      │
│  ┌─────────────┐  ┌────────────────┐  ┌──────────────────────────┐  │
│  │AuthController│  │TicketController│  │NotificationController    │  │
│  └──────┬──────┘  └───────┬────────┘  └────────────┬─────────────┘  │
│         └─────────────────┼─────────────────────────┘               │
│                           ▼                                          │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │                    SERVICE LAYER                                │  │
│  │  AuthService │ TicketService │ AiTriageService │ NotifService   │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                           │                                          │
│  ┌────────────────────────▼───────────────────────────────────────┐  │
│  │              Spring Data JPA Repositories                       │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                           │                         │                │
└───────────────────────────┼─────────────────────────┼────────────────┘
                            │                         │
                            ▼                         ▼
                  ┌──────────────────┐     ┌──────────────────────┐
                  │   PostgreSQL 16  │         │
                  │ (prod) / H2 (dev)│     │   API (AI Triage)    │
                  └──────────────────┘     └──────────────────────┘
```

### Tech Stack Summary

| Layer | Technology | Why |
|---|---|---|
| Frontend Framework | React 18 + TypeScript | Type safety, component reuse, ecosystem |
| Frontend State | Zustand (auth) + TanStack Query (server) | Separation of local vs server state |
| HTTP Client | Axios + interceptors | Centralized JWT injection & 401 handling |
| Styling | Tailwind CSS v3 | Utility-first, no CSS file sprawl |
| Build Tool | Vite | Sub-second HMR in dev |
| Backend Framework | Spring Boot 3.2 / Java 21 | Virtual threads, mature ecosystem |
| Security | Spring Security + JWT (HS256) | Stateless, horizontally scalable |
| ORM | Spring Data JPA / Hibernate | Reduced boilerplate, type-safe queries |
| Real-Time | STOMP over SockJS | WebSocket with HTTP fallback |
| Dev DB | H2 in-memory | Zero-setup local development |
| Prod DB | PostgreSQL 16 | ACID, indexing, Flyway migrations |
| AI Provider | Anthropic Claude Haiku | Fast, cost-effective for triage workloads |
| Containerization | Docker + Docker Compose | One-command full-stack deployment |

---

## 2. Request Lifecycle

### Ticket Creation (Happy Path with AI Triage)

```
Customer Browser
     │
     │  POST /api/tickets  { title, description }
     │  Authorization: Bearer <jwt>
     ▼
JwtAuthenticationFilter
     │  validates token, loads UserDetails into SecurityContext
     ▼
TicketController.createTicket()
     │
     ▼
TicketServiceImpl.createTicket()
     ├─ 1. Persist new Ticket (status=OPEN, priority=MEDIUM initially)
     ├─ 2. Save TICKET_CREATED audit log entry
     ├─ 3. Call AiTriageService.triageTicket(title, description)
     │        ├─ [IF api key present] → POST https://api.anthropic.com/v1/messages
     │        │       ↳ Returns { category, priority, suggestedResponse }
     │        └─ [IF no api key / failure] → Rule-based keyword fallback
     ├─ 4. Update ticket: category, priority, aiSuggestedResponse, aiTriaged=true
     ├─ 5. Save AI_TRIAGE_COMPLETED audit log entry
     ├─ 6. Notify all agents via NotificationService → WebSocket /topic/user/{agentId}
     └─ 7. Return TicketResponse (200 OK)
```

### Real-Time Notification Flow

```
NotificationServiceImpl.notifyUser(userId, ticketId, title, message)
     │
     ├─ Persist Notification entity to DB (for inbox history)
     └─ SimpMessagingTemplate.convertAndSend("/topic/user/{userId}", payload)
              │
              ▼ WebSocket STOMP frame pushed to subscribed client
         React: useNotifications() hook updates unread badge instantly
```

---

## 3. Frontend Architecture

### Directory Structure

```
src/
├── api/              # Axios calls — auth.ts, tickets.ts, users.ts, notifications.ts
├── components/
│   ├── common/       # Spinner, Badge, Pagination, EmptyState (reusable atoms)
│   ├── layout/       # Navbar, AgentLayout, NotificationBell
│   └── tickets/      # TicketCard, TicketFiltersBar
├── hooks/            # useNotifications (WebSocket + polling hybrid)
├── pages/            # LoginPage, RegisterPage, CustomerDashboard,
│                     # AgentDashboard, TicketDetailPage, CreateTicketPage
├── store/            # authStore.ts (Zustand — token + user session)
├── types/            # Shared TypeScript interfaces (Ticket, User, Comment…)
└── utils/            # helpers.ts — getErrorMessage, formatters, config maps
```

### State Management Strategy

```
┌─────────────────────────────────────────────────────┐
│                  State Ownership                    │
├──────────────────────────┬──────────────────────────┤
│  Zustand (authStore)     │  TanStack Query           │
│  ─────────────────────   │  ────────────────────     │
│  • JWT token             │  • Ticket lists / detail  │
│  • Logged-in user        │  • Comments               │
│  • Login / logout        │  • Agent list             │
│  • Persisted to          │  • Analytics data         │
│    localStorage          │  • Notifications          │
│                          │  • Auto-cache + refetch   │
└──────────────────────────┴──────────────────────────┘
```

**Why two state systems?**
Auth state is synchronous client-local state that rarely changes — Zustand is perfect. Server data (tickets, comments) has caching, background refetch, and invalidation needs — TanStack Query handles this better than any manual approach.

### Key Patterns

**JWT Injection (Axios interceptor)**
```typescript
// Every outgoing request automatically gets the token:
axiosInstance.interceptors.request.use(config => {
  const token = authStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// 401 responses auto-redirect to login:
axiosInstance.interceptors.response.use(null, error => {
  if (error.response?.status === 401) authStore.getState().logout();
  return Promise.reject(error);
});
```

**Role-Based Route Guards**
```typescript
// RequireAuth wraps protected routes
// Checks token presence + role before rendering
<Route element={<RequireAuth roles={['AGENT']} />}>
  <Route path="/agent" element={<AgentDashboard />} />
</Route>
```

**Optimistic UI with Cache Invalidation**
After any mutation (status update, comment), `useQueryClient().invalidateQueries` refetches affected queries — keeping the UI in sync without a full page reload.

---

## 4. Backend Architecture

### Package Structure

```
com.supportticket/
├── config/         SecurityConfig, WebSocketConfig, WebClientConfig, DataSeeder, AppProperties
├── controller/     AuthController, TicketController, UserController, NotificationController
├── dto/
│   ├── request/    CreateTicketRequest, UpdateTicketRequest, AddCommentRequest, LoginRequest…
│   └── response/   TicketResponse, PageResponse<T>, AnalyticsResponse, NotificationResponse…
├── entity/         Ticket, User, Comment, AuditLog, Notification  (JPA @Entity)
├── enums/          Role, TicketStatus, TicketPriority, TicketCategory, AuditAction
├── exception/      ResourceNotFoundException, AccessDeniedException, BadRequestException,
│                   GlobalExceptionHandler (@RestControllerAdvice)
├── repository/     Spring Data JPA interfaces with custom JPQL queries
├── security/       JwtAuthenticationFilter, JwtService, UserDetailsServiceImpl
├── service/        Interfaces + impl/ (AuthServiceImpl, TicketServiceImpl,
│                   AiTriageService, NotificationServiceImpl, UserServiceImpl)
└── util/           UserMapper (Entity → DTO conversion)
```

### Layered Architecture

```
HTTP Request
    │
    ▼
Controller         — Validates input, delegates to service, returns HTTP status
    │
    ▼
Service Interface  — Business logic contract (testable interface)
    │
    ▼
Service Impl       — Concrete business logic, @Transactional boundaries
    │
    ▼
Repository         — Spring Data JPA (auto-implemented + custom JPQL)
    │
    ▼
Entity / DB        — JPA entities mapped to PostgreSQL tables
```

**Why interfaces for services?**
Allows mock injection in unit tests (Mockito), enables swapping implementations (e.g., caching layer), and documents the service contract explicitly.

### Error Handling

All exceptions flow through `GlobalExceptionHandler`:

| Exception | HTTP Status | When |
|---|---|---|
| `ResourceNotFoundException` | 404 | Entity not found by ID |
| `AccessDeniedException` | 403 | Role-based access violation |
| `BadRequestException` | 400 | Invalid business operation |
| `MethodArgumentNotValidException` | 400 | Bean Validation failure |
| Unhandled `Exception` | 500 | Unexpected server error |

Response shape is always `ApiErrorResponse { timestamp, status, error, message, path }` — consistent JSON for the frontend.

### Spring Profiles

| Profile | Database | DDL | Flyway | Sample Data |
|---|---|---|---|---|
| `dev` (default) | H2 in-memory | `create-drop` | Disabled | ✅ Auto-seeded via `DataSeeder` |
| `prod` | PostgreSQL 16 | `validate` | Enabled | ❌ Disabled |

Switch with env var: `SPRING_PROFILES_ACTIVE=prod`

---

## 5. Database Design

### Entity Relationship Diagram

```
┌────────────────┐          ┌──────────────────────────────────────────┐
│     users      │          │                 tickets                   │
├────────────────┤          ├──────────────────────────────────────────┤
│ id (PK)        │◄─────────┤ created_by_id  (FK → users)              │
│ email (UNIQUE) │◄─────────┤ assigned_to_id (FK → users, nullable)    │
│ password       │          │ id (PK)                                  │
│ full_name      │          │ title                                    │
│ role           │          │ description                              │
│ enabled        │          │ status    (OPEN|IN_PROGRESS|RESOLVED|CLOSED)|
│ created_at     │          │ priority  (LOW|MEDIUM|HIGH|CRITICAL)     │
│ updated_at     │          │ category  (BILLING|TECHNICAL_ISSUE|...)  │
└────────────────┘          │ ai_suggested_response                    │
                            │ ai_triaged (boolean)                     │
                            │ created_at / updated_at                  │
                            └──────────────┬───────────────────────────┘
                                           │ 1
                                      ┌────┴────┐
                                      │         │
                                     N│         │N
                            ┌─────────▼──┐  ┌───▼──────────┐
                            │  comments  │  │  audit_logs  │
                            ├────────────┤  ├──────────────┤
                            │ id (PK)    │  │ id (PK)      │
                            │ content    │  │ action       │
                            │ ticket_id  │  │ old_value    │
                            │ author_id  │  │ new_value    │
                            │ created_at │  │ description  │
                            └────────────┘  │ ticket_id    │
                                            │ performed_by │
                                            │ created_at   │
                                            └──────────────┘
                                            (append-only, no UPDATE/DELETE)
```

### Indexes

```sql
-- Optimised for the most common query patterns:
CREATE INDEX idx_tickets_status      ON tickets(status);
CREATE INDEX idx_tickets_priority    ON tickets(priority);
CREATE INDEX idx_tickets_category    ON tickets(category);
CREATE INDEX idx_tickets_created_by  ON tickets(created_by_id);
CREATE INDEX idx_tickets_assigned_to ON tickets(assigned_to_id);
CREATE INDEX idx_comments_ticket     ON comments(ticket_id);
CREATE INDEX idx_audit_ticket        ON audit_logs(ticket_id);
```

### Design Decisions

| Decision | Rationale |
|---|---|
| Single `users` table with `role` enum | Simpler joins; RBAC enforced at service layer, not schema |
| Enums stored as VARCHAR strings | Human-readable in DB; safe against enum reordering bugs |
| `audit_logs` is append-only (no UPDATE/DELETE) | Immutable history; cannot accidentally corrupt audit trail |
| `ai_suggested_response` stored on `tickets` | Avoids extra JOIN on the most common read path |
| H2 `MODE=PostgreSQL` in dev | Behavior parity reduces "works on my machine" bugs |
| Flyway only in prod | Dev uses DDL auto-create; keeps iteration fast locally |

---

## 6. Authentication & Security

### JWT Flow

```
Client                              Server
  │                                   │
  │─── POST /api/auth/login ─────────►│
  │    { email, password }            │
  │                                   │  AuthenticationManager.authenticate()
  │                                   │  BCrypt password verification
  │                                   │  JwtService.generateToken(user)
  │◄── 200 OK ────────────────────────│
  │    { token, user }                │
  │                                   │
  │    [Store token in localStorage]  │
  │                                   │
  │─── GET /api/tickets ─────────────►│
  │    Authorization: Bearer <token>  │
  │                                   │  JwtAuthenticationFilter
  │                                   │  → extract + validate token
  │                                   │  → load UserDetails
  │                                   │  → set SecurityContextHolder
  │◄── 200 OK ────────────────────────│
  │    { tickets: [...] }             │
```

### Security Configuration

| Concern | Approach |
|---|---|
| Password storage | `BCryptPasswordEncoder` (strength 10) |
| Token signing | HMAC-SHA256 (HS256) symmetric key |
| Token expiry | 24 hours |
| Session | Stateless (`STATELESS` policy) — no server-side session |
| CSRF | Disabled (JWT + stateless = CSRF not applicable) |
| CORS | Configurable via `app.cors.allowed-origins` env var |
| WebSocket | Permitted without auth (STOMP subscription authorization is a future improvement) |

### Acknowledged Security Trade-offs

| Current Approach | Production Hardening |
|---|---|
| JWT in `localStorage` (XSS-vulnerable) | `httpOnly` + `Secure` cookies |
| No refresh token | Refresh token rotation with sliding expiry |
| No token revocation | Redis-backed revocation list for logout |
| HS256 symmetric signing | RS256 asymmetric — public key verification |
| No rate limiting on auth endpoints | `bucket4j` per-IP rate limiting |

These trade-offs are intentional for MVP simplicity. The above hardening steps are documented and prioritized in the [roadmap](#10-future-roadmap).

---

## 7. AI Triage Engine

### Decision Flow

```
POST /api/tickets (ticket creation)
         │
         ▼
  AiTriageService.triageTicket(title, description)
         │
         ├─── API Key present? ───► YES ──► callAnthropicApi()
         │                                       │
         │                              Structured JSON prompt:
         │                              "Respond with ONLY:
         │                               { category, priority,
         │                                 suggestedResponse }"
         │                                       │
         │                              Parse response JSON
         │                              (strip ```json fences)
         │                                       │
         │                              safeCategory() / safePriority()
         │                              (fallback on parse error)
         │
         └─── API Key absent / Failure ──► fallbackTriage()
                                               │
                                         Regex keyword matching:
                                         bill|invoice → BILLING
                                         login|password → ACCOUNT_ACCESS
                                         bug|error|crash → TECHNICAL_ISSUE
                                         feature|suggest → FEATURE_REQUEST
                                               │
                                         Priority escalation:
                                         urgent|critical|outage → CRITICAL
                                         billing|account_access → HIGH (default)
                                         technical_issue → MEDIUM
                                         feature_request → LOW
```

### Why This Design?

- **Synchronous call** — Simple for MVP. The ticket creation request waits for triage (typically < 1s for Haiku). At scale, this would move to an async queue.
- **Graceful degradation** — System works 100% without an API key. The fallback rule engine was carefully tuned with regex patterns covering real support ticket vocabulary.
- **Constrained prompt** — Enum values are explicitly listed in the prompt to prevent hallucinated categories. `safeCategory()` and `safePriority()` handle unexpected responses without crashing.
- **Model choice** — `claude-haiku-4-5-20251001`: fastest Anthropic model, lowest cost per token, sufficient quality for classification tasks. No need for Opus/Sonnet-level reasoning here.

### Fallback Category Matrix

| Category | Trigger Keywords |
|---|---|
| `BILLING` | bill, invoice, payment, charge, refund, subscription, fee |
| `ACCOUNT_ACCESS` | login, password, reset, locked, 2fa, sign-in, authenticate |
| `TECHNICAL_ISSUE` | bug, error, crash, broken, not working, exception, 404, 500 |
| `FEATURE_REQUEST` | feature, request, suggest, improve, enhancement, wish |
| `GENERAL_INQUIRY` | (default — no keyword match) |

---

## 8. Real-Time Notifications (WebSocket)

### Architecture

```
Spring Boot (STOMP Message Broker)
  │
  │  WebSocketConfig:
  │  ├── Endpoint: /ws-notifications (SockJS fallback enabled)
  │  ├── Message broker: /topic
  │  └── App prefix: /app
  │
  │  NotificationServiceImpl.notifyUser(userId, ticketId, title, message):
  │  ├── 1. Save Notification entity → PostgreSQL (inbox history)
  │  └── 2. simpMessagingTemplate.convertAndSend(
  │              "/topic/user/{userId}",
  │              NotificationResponse payload
  │         )
  │
  └──────────────► WebSocket frame pushed to all subscribed clients
```

### When Notifications Are Sent

| Event | Who is Notified |
|---|---|
| New ticket created | All agents |
| Ticket updated (status/priority/assignment) | Ticket creator |
| New comment from customer | Assigned agent (or all agents if unassigned) |
| New comment from agent | Ticket creator |

### Frontend Subscription (useNotifications hook)

```typescript
// Connects via SockJS + STOMP
// Subscribes to /topic/user/{userId}
// On message: increments unread count, stores in local state
// Fallback: polling /api/notifications every 30s when WS unavailable
```

---

## 9. Key Design Decisions & Trade-offs

These are the questions an interviewer will likely ask. Here's honest analysis of each:

### 1. Synchronous vs Async AI Triage

| | Synchronous (current) | Async Queue (e.g., RabbitMQ) |
|---|---|---|
| Complexity | Low | High |
| Latency | Added to ticket creation (~300-800ms) | Ticket created instantly, triage follows |
| Failure handling | Inline try/catch + fallback | Dead letter queue, retry policies |
| Good for | MVP, low traffic | Production at scale |

**Decision:** Synchronous with graceful fallback is correct for this stage. The system never blocks or fails due to AI being down.

### 2. localStorage vs httpOnly Cookies for JWT

| | localStorage (current) | httpOnly Cookies |
|---|---|---|
| XSS risk | Token stealable via XSS | Token not accessible to JS |
| CSRF risk | Immune (no auto-send) | Requires CSRF token |
| Implementation | Simpler | Requires cookie config |
| Good for | Demo / internal tools | Customer-facing production |

**Decision:** localStorage chosen for simplicity. Documented as a known trade-off with the fix path clear.

### 3. Single `users` Table vs Separate Tables Per Role

Single table is correct here because:
- All user types share identical fields (email, password, full_name)
- Role is just a permission level, not a fundamentally different entity
- Avoids complex joins for authentication (which happens on every request)
- RBAC is enforced at the service layer where it belongs

### 4. AI Suggested Response Stored on Ticket

Alternative: store in a separate `ai_results` table.

Storing on the ticket is correct because:
- It's a 1:1 relationship (one ticket, one AI result)
- It's read on virtually every ticket fetch — no extra JOIN needed
- Nullable field means no storage waste for non-triaged tickets

### 5. Audit Log Design (Append-Only)

`audit_logs` has no UPDATE or DELETE operations — by design. This means:
- Complete, tamper-evident history of every ticket state change
- Useful for compliance, debugging, and customer disputes
- Safe against accidental data corruption
- At scale: partition by `ticket_id` for query performance

---

## 10. Future Roadmap

Prioritised by business impact vs implementation effort:

| Priority | Feature | Why | Approach |
|---|---|---|---|
| 🔴 High | **Async AI Triage** | Remove latency from ticket creation | Spring `@Async` or RabbitMQ queue |
| 🔴 High | **Refresh Tokens** | UX + security: no re-login after 24h | Sliding expiry, `httpOnly` cookie |
| 🔴 High | **Email Notifications** | Agents miss tickets without email | Spring Mail + async job |
| 🟡 Medium | **Rate Limiting** | Prevent auth endpoint abuse | `bucket4j` per-IP on `/api/auth/**` |
| 🟡 Medium | **File Attachments** | Customers need to attach screenshots | S3 / MinIO, presigned URLs |
| 🟡 Medium | **SLA Tracking** | Escalation for unresolved CRITICAL tickets | Scheduled job + `@Scheduled` |
| 🟡 Medium | **Unit + Integration Tests** | Confidence in refactoring | MockMvc + Mockito + Testcontainers |
| 🟢 Low | **Full-Text Search** | LIKE queries won't scale past ~100k tickets | PostgreSQL `tsvector` / Elasticsearch |
| 🟢 Low | **Admin Role** | User management, SLA config | New role + admin UI |
| 🟢 Low | **Observability** | Prod debugging, alerting | OpenTelemetry + Prometheus + Grafana |
| 🟢 Low | **Token Revocation** | Proper logout in production | Redis-backed blocklist |

---

## Appendix: Environment Variables

### Backend

| Variable | Required | Default | Description |
|---|---|---|---|
| `SPRING_PROFILES_ACTIVE` | No | `dev` | Set to `prod` for production |
| `DATABASE_URL` | Prod only | H2 in dev | `jdbc:postgresql://host:5432/db` |
| `DATABASE_USERNAME` | Prod only | `sa` | PostgreSQL user |
| `DATABASE_PASSWORD` | Prod only | _(blank)_ | PostgreSQL password |
| `JWT_SECRET` | **Yes** | Insecure default | Min 32-char random string |
| `ANTHROPIC_API_KEY` | No | _(blank)_ | Falls back to rule-based triage |
| `CORS_ORIGINS` | No | `http://localhost:5173` | Comma-separated allowed origins |
| `PORT` | No | `8080` | Server port |

### Frontend

| Variable | Default | Description |
|---|---|---|
| `VITE_API_URL` | `/api` | Backend API base URL |

---

*Architecture document maintained alongside source code. Last updated: June 2026.*
