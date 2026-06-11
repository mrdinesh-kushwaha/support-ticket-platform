import { Search, X } from 'lucide-react';
import type { TicketFilters, TicketStatus, TicketPriority, TicketCategory, User } from '../../types';

interface Props {
  filters: TicketFilters;
  onChange: (f: Partial<TicketFilters>) => void;
  showAssigneeFilter?: boolean;
  agents?: User[];
}

export default function TicketFiltersBar({ filters, onChange, showAssigneeFilter = false, agents = [] }: Props) {
  const hasActiveFilters = !!(filters.search || filters.status || filters.priority || filters.category || filters.assigneeId);

  return (
    <div className="card p-4">
      <div className="flex flex-wrap gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            className="input pl-9"
            placeholder="Search title or description…"
            value={filters.search ?? ''}
            onChange={(e) => onChange({ search: e.target.value, page: 0 })}
          />
        </div>

        {/* Status */}
        <select
          className="select w-auto min-w-36"
          value={filters.status ?? ''}
          onChange={(e) => onChange({ status: e.target.value as TicketStatus | '', page: 0 })}
        >
          <option value="">All Statuses</option>
          <option value="OPEN">Open</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="RESOLVED">Resolved</option>
          <option value="CLOSED">Closed</option>
        </select>

        {/* Priority */}
        <select
          className="select w-auto min-w-36"
          value={filters.priority ?? ''}
          onChange={(e) => onChange({ priority: e.target.value as TicketPriority | '', page: 0 })}
        >
          <option value="">All Priorities</option>
          <option value="CRITICAL">Critical</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>

        {/* Category */}
        <select
          className="select w-auto min-w-40"
          value={filters.category ?? ''}
          onChange={(e) => onChange({ category: e.target.value as TicketCategory | '', page: 0 })}
        >
          <option value="">All Categories</option>
          <option value="BILLING">Billing</option>
          <option value="TECHNICAL_ISSUE">Technical Issue</option>
          <option value="ACCOUNT_ACCESS">Account Access</option>
          <option value="FEATURE_REQUEST">Feature Request</option>
          <option value="GENERAL_INQUIRY">General Inquiry</option>
        </select>

        {/* Assignee — agents only */}
        {showAssigneeFilter && (
          <select
            className="select w-auto min-w-40"
            value={filters.assigneeId ?? ''}
            onChange={(e) => onChange({ assigneeId: e.target.value ? Number(e.target.value) : '', page: 0 })}
          >
            <option value="">All Assignees</option>
            <option value="">Unassigned</option>
            {agents.map((a) => (
              <option key={a.id} value={a.id}>{a.fullName}</option>
            ))}
          </select>
        )}

        {/* Clear */}
        {hasActiveFilters && (
          <button
            onClick={() => onChange({ search: '', status: '', priority: '', category: '', assigneeId: '', page: 0 })}
            className="btn-secondary text-xs gap-1"
          >
            <X className="h-3.5 w-3.5" />
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
