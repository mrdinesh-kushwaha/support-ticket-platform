# SupportDesk — AI-Powered Support Ticket Platform

A production-ready full-stack support ticket platform with AI-powered triage, built with **Java 21 + Spring Boot 3.2** (backend) and **React 18 + TypeScript** (frontend).

---

## Features

| Feature | Details |
|---|---|
| 🔐 JWT Authentication | Register/login for customers and agents |
| 🎫 Ticket Management | Create, view, filter, search, paginate tickets |
| 🤖 AI Triage | Auto-categorize and prioritize via Anthropic Claude (rule-based fallback included) |
| 💬 Comments | Threaded comments with role indicators |
| 📋 Audit Trail | Full immutable history of all ticket changes |
| 📊 Analytics | Ticket counts by status, priority, category |
| 👥 Agent Tools | Assign tickets, update status, use AI suggested response |
| 📱 Responsive UI | Mobile-friendly Tailwind CSS design |

---

## Tech Stack

### Backend
- **Java 21** + **Spring Boot 3.2**
- Spring Security + JWT (JJWT 0.12)
- Spring Data JPA + Hibernate
- **Dev DB**: H2 (in-memory, zero setup)
- **Prod DB**: PostgreSQL 16
- Flyway migrations (prod only)
- Springdoc OpenAPI / Swagger UI
- WebClient (Reactor) for AI HTTP calls

### Frontend
- **React 18** + **TypeScript**
- React Router v6
- TanStack Query v5 (server state)
- Zustand (auth state)
- Axios (HTTP client)
- Tailwind CSS v3
- Vite

---

## Prerequisites

- Java 21+
- Maven 3.9+
- Node.js 20+
- npm 10+
- Docker + Docker Compose *(optional, for full stack)*

---

## Local Development (Quickstart — No Docker Required)

### 1. Clone the repository

```bash
git clone https://github.com/your-username/support-ticket-platform.git
cd support-ticket-platform
```

### 2. Start the Backend (Dev profile — H2 in-memory DB)

```bash
cd backend
mvn spring-boot:run
```

The backend starts on **http://localhost:8080**

- Swagger UI: http://localhost:8080/swagger-ui.html
- H2 Console: http://localhost:8080/h2-console
  - JDBC URL: `jdbc:h2:mem:supportdb`
  - Username: `sa` | Password: *(blank)*

**Sample users seeded automatically (password: `password123` for all):**

| Email | Role |
|---|---|
| admin@example.com | Admin |
| agent1@example.com | Agent |
| agent2@example.com | Agent |
| customer1@example.com | Customer |
| customer2@example.com | Customer |

### 3. Start the Frontend

```bash
cd ../frontend
npm install
npm run dev
```

Frontend starts on **http://localhost:5173** (proxies `/api` → `http://localhost:8080`)

---

## Environment Variables

### Backend

| Variable | Default | Description |
|---|---|---|
| `SPRING_PROFILES_ACTIVE` | `dev` | Use `prod` for production |
| `DATABASE_URL` | *(H2 in dev)* | `jdbc:postgresql://host:5432/dbname` |
| `DATABASE_USERNAME` | `sa` | PostgreSQL username |
| `DATABASE_PASSWORD` | *(blank)* | PostgreSQL password |
| `JWT_SECRET` | *(insecure default)* | **Change in production!** Min 32 chars |
| `ANTHROPIC_API_KEY` | *(blank)* | Optional. Falls back to rule-based triage |
| `CORS_ORIGINS` | `http://localhost:5173` | Comma-separated allowed origins |
| `PORT` | `8080` | Server port |

### Frontend

| Variable | Default | Description |
|---|---|---|
| `VITE_API_URL` | `/api` | Backend API base URL |

Create `frontend/.env.local` for local overrides:
```env
VITE_API_URL=http://localhost:8080/api
```

---

## Production Deployment

### Option A — Docker Compose (Recommended)

```bash
# Set your API key (optional)
export ANTHROPIC_API_KEY=sk-ant-...

# Start all services (postgres + backend + frontend)
docker-compose up -d

# View logs
docker-compose logs -f
```

App available at **http://localhost**

### Option B — Deploy to Render / Railway / Fly.io

#### Backend (Render Web Service)

1. Connect GitHub repo
2. **Build Command**: `cd backend && mvn clean package -DskipTests`
3. **Start Command**: `java -jar backend/target/support-ticket-platform-1.0.0.jar`
4. Set environment variables:
   ```
   SPRING_PROFILES_ACTIVE=prod
   DATABASE_URL=jdbc:postgresql://...
   DATABASE_USERNAME=...
   DATABASE_PASSWORD=...
   JWT_SECRET=<random-32+-char-string>
   ANTHROPIC_API_KEY=sk-ant-...
   CORS_ORIGINS=https://your-frontend-domain.com
   ```

#### Frontend (Vercel / Netlify)

1. Connect GitHub repo, set **root directory** to `frontend`
2. **Build Command**: `npm run build`
3. **Output Directory**: `dist`
4. Set environment variable:
   ```
   VITE_API_URL=https://your-backend-url.com/api
   ```

#### PostgreSQL Setup (prod)

```sql
CREATE DATABASE supportticketdb;
CREATE USER supportuser WITH PASSWORD 'your-password';
GRANT ALL PRIVILEGES ON DATABASE supportticketdb TO supportuser;
```

Flyway will automatically run migrations on first boot.

---

## API Documentation

Swagger UI available at: **http://localhost:8080/swagger-ui.html**

### Key Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Register customer or agent |
| POST | `/api/auth/login` | Public | Login, receive JWT |
| GET | `/api/auth/me` | Any | Get current user |
| POST | `/api/tickets` | Customer | Create ticket (AI triage runs) |
| GET | `/api/tickets` | Any | List tickets (filtered, paginated) |
| GET | `/api/tickets/:id` | Any | Get ticket details |
| PATCH | `/api/tickets/:id` | Agent | Update status/priority/category/assignment |
| POST | `/api/tickets/:id/comments` | Any | Add comment |
| GET | `/api/tickets/:id/comments` | Any | Get comments (paginated) |
| GET | `/api/tickets/:id/audit-logs` | Any | Get audit trail |
| GET | `/api/tickets/analytics` | Agent | Get analytics |
| GET | `/api/users/agents` | Agent | List agents (for assignment) |

### Query Parameters (GET /api/tickets)

| Param | Type | Description |
|---|---|---|
| `search` | string | Search in title and description |
| `status` | enum | `OPEN`, `IN_PROGRESS`, `RESOLVED`, `CLOSED` |
| `priority` | enum | `LOW`, `MEDIUM`, `HIGH`, `CRITICAL` |
| `category` | enum | `BILLING`, `TECHNICAL_ISSUE`, `ACCOUNT_ACCESS`, `FEATURE_REQUEST`, `GENERAL_INQUIRY` |
| `assigneeId` | long | Filter by assigned agent ID |
| `page` | int | Page number (0-based, default: 0) |
| `size` | int | Page size (default: 10, max: 100) |
| `sortBy` | string | Field to sort by (default: `createdAt`) |
| `sortDir` | string | `asc` or `desc` (default: `desc`) |

---

## Running Tests

```bash
cd backend
mvn test
```

---

## Assumptions Made

1. **Single registration endpoint** — role is set at registration (CUSTOMER or AGENT). In production, agent accounts would typically be created by an admin.

2. **AI triage is synchronous** — runs within the ticket creation request. A background queue (RabbitMQ/SQS) would be better at scale, but adds complexity.

3. **No email notifications** — noted as a future improvement. Would use Spring Mail + async processing.

4. **Customers can only see their own tickets** — agents/admins see all tickets.

5. **Comments on closed tickets are blocked** — prevents activity on resolved issues. This could be configurable.

6. **H2 in dev mode** — uses H2 compatible SQL. The `MODE=PostgreSQL` flag makes behavior close to production, but not identical.

7. **JWT in localStorage** — simpler for a demo/assignment. For production, `httpOnly` cookies would reduce XSS risk.

---

## Project Structure

```
support-ticket-platform/
├── backend/                         # Spring Boot application
│   ├── src/main/java/com/supportticket/
│   │   ├── config/                  # Security, CORS, OpenAPI, DataSeeder
│   │   ├── controller/              # REST controllers
│   │   ├── dto/                     # Request/Response DTOs
│   │   ├── entity/                  # JPA entities
│   │   ├── enums/                   # Role, Status, Priority, Category
│   │   ├── exception/               # Custom exceptions + GlobalExceptionHandler
│   │   ├── repository/              # Spring Data repositories
│   │   ├── security/                # JWT filter + UserDetailsService
│   │   ├── service/                 # Business logic interfaces + implementations
│   │   └── util/                    # Utility mappers
│   └── src/main/resources/
│       ├── application.yml          # Base config
│       ├── application-dev.yml      # Dev profile (H2)
│       ├── application-prod.yml     # Prod profile (PostgreSQL)
│       └── db/migration/            # Flyway SQL migrations
│
├── frontend/                        # React application
│   └── src/
│       ├── api/                     # Axios API calls (auth, tickets, users)
│       ├── components/              # Reusable UI components
│       │   ├── common/              # Spinner, Badge, Pagination, EmptyState
│       │   ├── layout/              # Navbar
│       │   └── tickets/             # TicketCard, TicketFiltersBar
│       ├── pages/                   # Route-level page components
│       ├── store/                   # Zustand auth store
│       ├── types/                   # TypeScript interfaces
│       └── utils/                   # helpers, formatters, config maps
│
├── docker-compose.yml               # Full stack (postgres + backend + frontend)
├── docker-compose.dev.yml           # Dev (postgres only)
├── ARCHITECTURE.md                  # Architecture documentation
└── README.md                        # This file
```

---

## License

MIT
