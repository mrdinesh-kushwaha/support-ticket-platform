-- V1__init_schema.sql

CREATE TABLE IF NOT EXISTS users (
    id         BIGSERIAL PRIMARY KEY,
    email      VARCHAR(100) NOT NULL UNIQUE,
    password   VARCHAR(255) NOT NULL,
    full_name  VARCHAR(100) NOT NULL,
    role       VARCHAR(20)  NOT NULL CHECK (role IN ('CUSTOMER','AGENT','ADMIN')),
    enabled    BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tickets (
    id                   BIGSERIAL PRIMARY KEY,
    title                VARCHAR(255) NOT NULL,
    description          TEXT         NOT NULL,
    status               VARCHAR(20)  NOT NULL DEFAULT 'OPEN'
        CHECK (status IN ('OPEN','IN_PROGRESS','RESOLVED','CLOSED')),
    priority             VARCHAR(20)  NOT NULL DEFAULT 'MEDIUM'
        CHECK (priority IN ('LOW','MEDIUM','HIGH','CRITICAL')),
    category             VARCHAR(30)  NOT NULL DEFAULT 'GENERAL_INQUIRY'
        CHECK (category IN ('BILLING','TECHNICAL_ISSUE','ACCOUNT_ACCESS','FEATURE_REQUEST','GENERAL_INQUIRY')),
    created_by_id        BIGINT       NOT NULL REFERENCES users(id),
    assigned_to_id       BIGINT       REFERENCES users(id),
    ai_suggested_response TEXT,
    ai_triaged           BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS comments (
    id         BIGSERIAL PRIMARY KEY,
    content    TEXT        NOT NULL,
    ticket_id  BIGINT      NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    author_id  BIGINT      NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id               BIGSERIAL PRIMARY KEY,
    ticket_id        BIGINT      NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    performed_by_id  BIGINT      REFERENCES users(id),
    action           VARCHAR(50) NOT NULL,
    old_value        TEXT,
    new_value        TEXT,
    description      TEXT,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tickets_status      ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_priority    ON tickets(priority);
CREATE INDEX IF NOT EXISTS idx_tickets_category    ON tickets(category);
CREATE INDEX IF NOT EXISTS idx_tickets_created_by  ON tickets(created_by_id);
CREATE INDEX IF NOT EXISTS idx_tickets_assigned_to ON tickets(assigned_to_id);
CREATE INDEX IF NOT EXISTS idx_comments_ticket     ON comments(ticket_id);
CREATE INDEX IF NOT EXISTS idx_audit_ticket        ON audit_logs(ticket_id);

CREATE TABLE IF NOT EXISTS notifications (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    ticket_id BIGINT,
    title VARCHAR(255),
    message VARCHAR(1000),
    read_status BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_ticket_id ON notifications(ticket_id);
