// ─── Enums ──────────────────────────────────────────────────────────────────
export type Role = 'CUSTOMER' | 'AGENT' | 'ADMIN';
export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type TicketCategory =
  | 'BILLING'
  | 'TECHNICAL_ISSUE'
  | 'ACCOUNT_ACCESS'
  | 'FEATURE_REQUEST'
  | 'GENERAL_INQUIRY';
export type AuditAction =
  | 'TICKET_CREATED'
  | 'STATUS_CHANGED'
  | 'PRIORITY_CHANGED'
  | 'CATEGORY_CHANGED'
  | 'ASSIGNED'
  | 'UNASSIGNED'
  | 'COMMENT_ADDED'
  | 'TICKET_RESOLVED'
  | 'TICKET_CLOSED'
  | 'AI_TRIAGE_COMPLETED';

// ─── Entities ────────────────────────────────────────────────────────────────
export interface User {
  id: number;
  email: string;
  fullName: string;
  role: Role;
  enabled: boolean;
  createdAt: string;
}

export interface Ticket {
  id: number;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: TicketCategory;
  createdBy: User;
  assignedTo?: User;
  aiSuggestedResponse?: string;
  aiTriaged: boolean;
  createdAt: string;
  updatedAt: string;
  commentCount: number;
}

export interface Comment {
  id: number;
  content: string;
  author: User;
  ticketId: number;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: number;
  action: AuditAction;
  oldValue?: string;
  newValue?: string;
  description?: string;
  performedBy?: User;
  createdAt: string;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
export interface AuthResponse {
  token: string;
  tokenType: string;
  userId: number;
  email: string;
  fullName: string;
  role: Role;
}

// ─── Requests ─────────────────────────────────────────────────────────────────
export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface CreateTicketRequest {
  title: string;
  description: string;
}

export interface UpdateTicketRequest {
  status?: TicketStatus;
  priority?: TicketPriority;
  category?: TicketCategory;
  assignedToId?: number;
}

export interface AddCommentRequest {
  content: string;
}

// ─── Paginated Response ───────────────────────────────────────────────────────
export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

// ─── Analytics ────────────────────────────────────────────────────────────────
export interface AnalyticsResponse {
  totalTickets: number;
  openTickets: number;
  inProgressTickets: number;
  resolvedTickets: number;
  closedTickets: number;
  ticketsByPriority: Record<string, number>;
  ticketsByCategory: Record<string, number>;
}

// ─── API Error ────────────────────────────────────────────────────────────────
export interface ApiError {
  status: number;
  error: string;
  message: string;
  path: string;
  fieldErrors?: { field: string; message: string }[];
}

// ─── Ticket filter params ─────────────────────────────────────────────────────
export interface TicketFilters {
  search?: string;
  status?: TicketStatus | '';
  priority?: TicketPriority | '';
  category?: TicketCategory | '';
  assigneeId?: number | '';
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}
