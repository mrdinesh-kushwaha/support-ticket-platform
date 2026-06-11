import { Loader2 } from 'lucide-react';

// ─── Spinner ──────────────────────────────────────────────────────────────────
export function Spinner({ size = 'md', className = '' }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const s = size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-8 w-8' : 'h-6 w-6';
  return <Loader2 className={`animate-spin text-blue-600 ${s} ${className}`} />;
}

// ─── Full-page loader ─────────────────────────────────────────────────────────
export function PageLoader({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-gray-50">
      <Spinner size="lg" />
      <p className="text-sm text-gray-500">{message}</p>
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
export function EmptyState({ icon, title, description, action }: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {icon && <div className="mb-4 text-gray-300">{icon}</div>}
      <h3 className="text-lg font-semibold text-gray-700">{title}</h3>
      {description && <p className="mt-1 text-sm text-gray-500 max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// ─── Error banner ─────────────────────────────────────────────────────────────
export function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
      {message}
    </div>
  );
}

// ─── Pagination ───────────────────────────────────────────────────────────────
export function Pagination({
  page, totalPages, onPageChange, totalElements, size,
}: {
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
  totalElements: number;
  size: number;
}) {
  if (totalPages <= 1) return null;
  const from = page * size + 1;
  const to = Math.min((page + 1) * size, totalElements);

  return (
    <div className="flex items-center justify-between px-1 py-3">
      <p className="text-sm text-gray-500">
        Showing <span className="font-medium">{from}–{to}</span> of{' '}
        <span className="font-medium">{totalElements}</span> results
      </p>
      <div className="flex gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 0}
          className="btn-secondary px-3 py-1.5 text-xs disabled:opacity-40"
        >
          Previous
        </button>
        {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
          const p = totalPages <= 7 ? i : Math.max(0, Math.min(page - 3, totalPages - 7)) + i;
          return (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${
                p === page
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {p + 1}
            </button>
          );
        })}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages - 1}
          className="btn-secondary px-3 py-1.5 text-xs disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────────
import { statusConfig, priorityConfig } from '../../utils/helpers';
import type { TicketStatus, TicketPriority } from '../../types';

export function StatusBadge({ status }: { status: TicketStatus }) {
  const c = statusConfig[status];
  return (
    <span className={`badge ${c.bg} ${c.color}`}>{c.label}</span>
  );
}

export function PriorityBadge({ priority }: { priority: TicketPriority }) {
  const c = priorityConfig[priority];
  return (
    <span className={`badge ${c.bg} ${c.color}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}
