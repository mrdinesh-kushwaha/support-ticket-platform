import apiClient from './client';
import type {
  Ticket, Comment, AuditLog,
  CreateTicketRequest, UpdateTicketRequest, AddCommentRequest,
  PageResponse, AnalyticsResponse, TicketFilters,
} from '../types';

export const ticketsApi = {
  getTickets: async (filters: TicketFilters = {}): Promise<PageResponse<Ticket>> => {
    const params: Record<string, unknown> = {};
    if (filters.search)    params.search    = filters.search;
    if (filters.status)    params.status    = filters.status;
    if (filters.priority)  params.priority  = filters.priority;
    if (filters.category)  params.category  = filters.category;
    if (filters.assigneeId) params.assigneeId = filters.assigneeId;
    params.page    = filters.page    ?? 0;
    params.size    = filters.size    ?? 10;
    params.sortBy  = filters.sortBy  ?? 'createdAt';
    params.sortDir = filters.sortDir ?? 'desc';

    const res = await apiClient.get<PageResponse<Ticket>>('/tickets', { params });
    return res.data;
  },

  getTicketById: async (id: number): Promise<Ticket> => {
    const res = await apiClient.get<Ticket>(`/tickets/${id}`);
    return res.data;
  },

  createTicket: async (data: CreateTicketRequest): Promise<Ticket> => {
    const res = await apiClient.post<Ticket>('/tickets', data);
    return res.data;
  },

  updateTicket: async (id: number, data: UpdateTicketRequest): Promise<Ticket> => {
    const res = await apiClient.patch<Ticket>(`/tickets/${id}`, data);
    return res.data;
  },

  getComments: async (ticketId: number, page = 0, size = 50): Promise<PageResponse<Comment>> => {
    const res = await apiClient.get<PageResponse<Comment>>(
      `/tickets/${ticketId}/comments`, { params: { page, size } }
    );
    return res.data;
  },

  addComment: async (ticketId: number, data: AddCommentRequest): Promise<Comment> => {
    const res = await apiClient.post<Comment>(`/tickets/${ticketId}/comments`, data);
    return res.data;
  },

  getAuditLogs: async (ticketId: number): Promise<AuditLog[]> => {
    const res = await apiClient.get<AuditLog[]>(`/tickets/${ticketId}/audit-logs`);
    return res.data;
  },

  getAnalytics: async (): Promise<AnalyticsResponse> => {
    const res = await apiClient.get<AnalyticsResponse>('/tickets/analytics');
    return res.data;
  },
};
