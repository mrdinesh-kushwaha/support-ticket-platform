import type { TicketStatus, TicketPriority, TicketCategory, AuditAction } from '../types';

export const formatDate = (iso: string) => {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

export const formatDateShort = (iso: string) => {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
};

export const timeAgo = (iso: string): string => {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return formatDateShort(iso);
};

export const statusConfig: Record<TicketStatus, { label: string; color: string; bg: string }> = {
  OPEN:        { label: 'Open',        color: 'text-blue-700',   bg: 'bg-blue-100' },
  IN_PROGRESS: { label: 'In Progress', color: 'text-yellow-700', bg: 'bg-yellow-100' },
  RESOLVED:    { label: 'Resolved',    color: 'text-green-700',  bg: 'bg-green-100' },
  CLOSED:      { label: 'Closed',      color: 'text-gray-600',   bg: 'bg-gray-100' },
};

export const priorityConfig: Record<TicketPriority, { label: string; color: string; bg: string; dot: string }> = {
  LOW:      { label: 'Low',      color: 'text-gray-600',  bg: 'bg-gray-100',   dot: 'bg-gray-400' },
  MEDIUM:   { label: 'Medium',   color: 'text-blue-700',  bg: 'bg-blue-100',   dot: 'bg-blue-500' },
  HIGH:     { label: 'High',     color: 'text-orange-700',bg: 'bg-orange-100', dot: 'bg-orange-500' },
  CRITICAL: { label: 'Critical', color: 'text-red-700',   bg: 'bg-red-100',    dot: 'bg-red-500' },
};

export const categoryLabels: Record<TicketCategory, string> = {
  BILLING:          'Billing',
  TECHNICAL_ISSUE:  'Technical Issue',
  ACCOUNT_ACCESS:   'Account Access',
  FEATURE_REQUEST:  'Feature Request',
  GENERAL_INQUIRY:  'General Inquiry',
};

export const auditActionLabels: Record<AuditAction, string> = {
  TICKET_CREATED:       'Ticket Created',
  STATUS_CHANGED:       'Status Changed',
  PRIORITY_CHANGED:     'Priority Changed',
  CATEGORY_CHANGED:     'Category Changed',
  ASSIGNED:             'Ticket Assigned',
  UNASSIGNED:           'Ticket Unassigned',
  COMMENT_ADDED:        'Comment Added',
  TICKET_RESOLVED:      'Ticket Resolved',
  TICKET_CLOSED:        'Ticket Closed',
  AI_TRIAGE_COMPLETED:  'AI Triage Completed',
};

export const getErrorMessage = (error: unknown): string => {
  if (!error) return 'An unknown error occurred';
  const err = error as { response?: { data?: { message?: string; error?: string } }; message?: string };
  return err.response?.data?.message
    || err.response?.data?.error
    || err.message
    || 'Something went wrong';
};
