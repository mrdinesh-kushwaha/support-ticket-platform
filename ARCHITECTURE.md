# ARCHITECTURE.md — AI-Powered Support Ticket Platform

## System Design

### Overall Architecture

```
┌─────────────────────────────────────────────────────────┐
│                       Client (Browser)                   │
│              React 18 + TypeScript + Tailwind            │
└──────────────────────────┬──────────────────────────────┘
                           │ HTTPS / REST API (JSON)
                           ▼
┌─────────────────────────────────────────────────────────┐
│                  Spring Boot 3.2 (Java 21)               │
│  ┌──────────────┐  ┌───────────────┐  ┌──────────────┐  │
│  │ AuthController│  │TicketController│  │UserController│  │
│  └──────┬───────┘  └───────┬───────┘  └──────┬───────┘  │
│         └─────────────────┼──────────────────┘          │
│                           ▼                              │
│  ┌────────────────────────────────────────────────────┐  │
│  │            Service Layer (Business Logic)           │  │
│  │  AuthService │ TicketService │ AiTriageService      │  │
│  └────────────────────────────────────────────────────┘  │
│                           │                              │
│  ┌────────────────────────┼───────────────────────────┐  │
│  │     Spring Data JPA Repositories                    │  │
│  └────────────────────────┬───────────────────────────┘  │
└───────────────────────────┼─────────────────────────────┘
                            │                  │
                            ▼                  ▼
                    ┌──────────────┐   ┌──────────────────┐
                    │  PostgreSQL  │   │  Anthropic API   │
                    │  (prod) /    │   │  (AI Triage)     │
                    │  H2 (dev)    │   └──────────────────┘
                    └──────────────┘
```

### Frontend Architecture

- **Framework**: React 18 with TypeScript
- **Routing**: React Router v6 (client-side SPA routing)
- **State Management**: Zustand (auth/session state) + TanStack Query (server state, caching)
- **HTTP Client**: Axios with request/response interceptors (JWT injection, 401 redirect)
- **Styling**: Tailwind CSS with custom component classes
- **Build Tool**: Vite
- **Key Design Decisions**:
  - Role-based route guards (`RequireAuth` component)
  - Optimistic UI updates via `useQueryClient().invalidateQueries`
  - Centralized error extraction utility (`getErrorMessage`)
  - JWT stored in `localStorage` (trade-off: simpler, but consider `httpOnly` cookies for higher security)

### Backend Architecture

- **Framework**: Spring Boot 3.2 / Java 21
- **Pattern**: Layered architecture (Controller → Service → Repository → Entity)
- **Security**: Spring Security + JWT (stateless, `OncePerRequestFilter`)
- **Database Access**: Spring Data JPA / Hibernate ORM
- **Profiles**:
  - `dev` — H2 in-memory database, DDL auto-create, Flyway disabled, sample data seeded
  - `prod` — PostgreSQL, DDL validate, Flyway migrations, sample data disabled
- **Async AI Triage**: Called synchronously within the ticket creation transaction; falls back gracefully if AI is unavailable

---

## Database Design

### Entity Relationships

```
users (1) ──< tickets.created_by_id    [Customer creates tickets]
users (1) ──< tickets.assigned_to_id   [Agent is assigned tickets]
tickets (1) ──< comments.ticket_id     [Comments belong to ticket]
tickets (1) ──< audit_logs.ticket_id   [Audit trail per ticket]
users (1) ──< comments.author_id       [Comments have an author]
users (1) ──< audit_logs.performed_by_id
```

### Tables

| Table | Purpose |
|---|---|
| `users` | All users (customers, agents, admins) with role |
| `tickets` | Support tickets with AI triage fields |
| `comments` | Threaded comments per ticket |
| `audit_logs` | Immutable audit trail of all state changes |

### Design Decisions

1. **Single `users` table with `role` column** — simpler than separate tables; role-based access enforced at service layer
2. **Enum columns stored as strings** (not integers) — readable in DB queries, resilient to enum reordering
3. **`audit_logs` is append-only** — no UPDATE/DELETE; provides full immutable history
4. **`ai_suggested_response` stored on ticket** — avoids extra table join for the most common read path
5. **Indexes on filter columns** — `status`, `priority`, `category`, `created_by_id`, `assigned_to_id` for fast filtering
6. **H2 in dev, PostgreSQL in prod** — zero friction local development, production-grade storage

---

## Authentication Strategy

### Approach: JWT (JSON Web Tokens)

**Implementation:**
1. User logs in → Spring Security `AuthenticationManager` validates credentials
2. On success → `JwtService` generates a signed HS256 JWT (24h expiry)
3. Token returned in response body (not cookie)
4. Frontend stores token in `localStorage`, attaches as `Authorization: Bearer <token>` header
5. `JwtAuthenticationFilter` (extends `OncePerRequestFilter`) validates token on every request
6. Spring Security `SecurityContextHolder` stores the authenticated user

**Trade-offs:**

| Aspect | Decision | Reason |
|---|---|---|
| Storage | `localStorage` | Simplicity; `httpOnly` cookies would prevent XSS token theft |
| Expiry | 24 hours | Balances security vs UX; no refresh token implemented |
| Signing | HS256 | Simple symmetric; RS256 would allow public key verification |
| Stateless | Yes (no server-side session) | Scales horizontally; no session store needed |

**For Production Hardening:**
- Use `httpOnly` + `Secure` cookies to prevent XSS token theft
- Add refresh token rotation
- Implement token revocation list (Redis) for logout

---

## AI Integration

### Provider: Anthropic Claude

**Model:** `claude-haiku-4-5-20251001` (fast, cost-effective for triage)

**When it runs:** Synchronously on ticket creation (`POST /api/tickets`)

**Prompting Strategy:**
- Single-shot prompt asking for structured JSON output
- Provides enum values in prompt to constrain valid outputs
- Includes priority heuristics in the prompt (CRITICAL for outages, LOW for feature requests)
- Response parsed from JSON; safe fallback to `GENERAL_INQUIRY` / `MEDIUM` on parse errors

**Fallback Mechanism (when no API key or API fails):**

A rule-based keyword matcher runs as fallback:

| Category Detection | Keywords |
|---|---|
| BILLING | bill, invoice, payment, charge, refund |
| ACCOUNT_ACCESS | login, password, reset, locked, 2fa |
| TECHNICAL_ISSUE | bug, error, crash, broken, not working |
| FEATURE_REQUEST | feature, suggest, improve, add, wish |
| GENERAL_INQUIRY | (default) |

Priority escalation based on keywords: `urgent`, `critical`, `emergency`, `system down` → CRITICAL

This ensures the system works correctly even without an API key configured.

---

## Bonus Features Implemented

| Feature | Implementation |
|---|---|
| ✅ Audit Trail | `audit_logs` table tracks every status change, assignment, comment |
| ✅ Analytics Dashboard | `GET /api/tickets/analytics` — counts by status, priority, category |
| ✅ AI Triage | Anthropic API with rule-based fallback |

---

## Future Improvements

Given more time, the following would be high priority:

1. **Real-Time Updates (WebSockets)** — Use Spring WebSocket / STOMP so agents see new tickets and comments instantly without polling

2. **Email Notifications** — Send emails on ticket creation (to customer), assignment (to agent), and status changes using Spring Mail + async job

3. **Refresh Tokens** — Add sliding session tokens with `httpOnly` cookie storage for better security

4. **Rate Limiting** — Add `bucket4j` to prevent API abuse on auth endpoints

5. **File Attachments** — Allow customers to attach screenshots/logs (S3/MinIO storage)

6. **SLA Tracking** — Automatic escalation when tickets exceed priority-based SLA thresholds (e.g., CRITICAL > 2h unresolved)

7. **Full-Text Search** — Replace LIKE queries with PostgreSQL `tsvector` / Elasticsearch for better performance at scale

8. **Role: Admin** — Admin UI to manage users, view all audit logs, configure SLAs

9. **Unit + Integration Tests** — Controller tests with MockMvc, service layer tests with Mockito

10. **Observability** — Structured logging (JSON), distributed tracing (OpenTelemetry), metrics (Prometheus + Grafana)
