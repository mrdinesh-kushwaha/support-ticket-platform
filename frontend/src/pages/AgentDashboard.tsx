import { useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  Inbox,
  Search,
  Ticket,
} from 'lucide-react';

import AgentLayout from '../components/layout/AgentLayout';
import { ticketsApi } from '../api/tickets';
import { ErrorBanner, Spinner } from '../components/common';
import { getErrorMessage } from '../utils/helpers';
import { useAuthStore } from '../store/authStore';
import type {
  Ticket as TicketType,
  TicketCategory,
  TicketFilters,
  TicketPriority,
  TicketStatus,
} from '../types';

const PAGE_SIZE = 10;

export default function AgentDashboard() {
  const location = useLocation();
  const { user } = useAuthStore();

  const routeStatus = getRouteStatus(location.pathname);

  const [filters, setFilters] = useState<TicketFilters>({
    page: 0,
    size: PAGE_SIZE,
    sortBy: 'createdAt',
    sortDir: 'desc',
    status: routeStatus,
    assigneeId: location.pathname.includes('/my-assigned') ? user?.id : '',
  });

  const [search, setSearch] = useState('');
  const [priority, setPriority] = useState<TicketPriority | ''>('');
  const [category, setCategory] = useState<TicketCategory | ''>('');

  const apiFilters: TicketFilters = useMemo(
    () => ({
      ...filters,
      search: search.trim() || undefined,
      priority,
      category,
      status: routeStatus,
      assigneeId: location.pathname.includes('/my-assigned') ? user?.id : '',
    }),
    [filters, search, priority, category, routeStatus, location.pathname, user?.id]
  );

  const { data, isLoading, error } = useQuery({
    queryKey: ['agent-tickets', apiFilters],
    queryFn: () => ticketsApi.getTickets(apiFilters),
  });

  const { data: analytics } = useQuery({
    queryKey: ['ticket-analytics'],
    queryFn: ticketsApi.getAnalytics,
  });

  const tickets = data?.content ?? [];
  const totalPages = Math.max(data?.totalPages ?? 1, 1);
  const currentPage = data?.page ?? filters.page ?? 0;

  const title = getPageTitle(location.pathname);

  const paginationPages = getPaginationPages(currentPage, totalPages);

  return (
    <AgentLayout>
      <div className="mb-7">
        <h2 className="text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">
          {title}
        </h2>
        <p className="mt-2 text-sm text-slate-500 sm:text-base">
          Manage real support tickets with clean filters, pagination and actions.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5 lg:gap-4">
        <StatCard icon={Ticket} label="Total" value={analytics?.totalTickets ?? 0} />
        <StatCard icon={Inbox} label="Open" value={analytics?.openTickets ?? 0} />
        <StatCard icon={Ticket} label="In Progress" value={analytics?.inProgressTickets ?? 0} />
        <StatCard icon={CheckCircle2} label="Resolved" value={analytics?.resolvedTickets ?? 0} />
        <StatCard icon={CheckCircle2} label="Closed" value={analytics?.closedTickets ?? 0} />
      </div>

      <div className="mt-7 rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-4">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_160px_180px]">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setFilters((prev) => ({ ...prev, page: 0 }));
                }}
                placeholder="Search by title or description..."
                className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-12 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <SelectBox
              value={priority}
              onChange={(value) => {
                setPriority(value as TicketPriority | '');
                setFilters((prev) => ({ ...prev, page: 0 }));
              }}
            >
              <option value="">All Priority</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </SelectBox>

            <SelectBox
              value={category}
              onChange={(value) => {
                setCategory(value as TicketCategory | '');
                setFilters((prev) => ({ ...prev, page: 0 }));
              }}
            >
              <option value="">All Category</option>
              <option value="BILLING">Billing</option>
              <option value="TECHNICAL_ISSUE">Technical Issue</option>
              <option value="ACCOUNT_ACCESS">Account Access</option>
              <option value="FEATURE_REQUEST">Feature Request</option>
              <option value="GENERAL_INQUIRY">General Inquiry</option>
            </SelectBox>
          </div>
        </div>

        {isLoading && (
          <div className="flex justify-center py-20">
            <Spinner size="lg" />
          </div>
        )}

        {error && (
          <div className="p-6">
            <ErrorBanner message={getErrorMessage(error)} />
          </div>
        )}

        {!isLoading && !error && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                    <th className="px-5 py-4">Ticket ID</th>
                    <th className="px-5 py-4">Title</th>
                    <th className="px-5 py-4">Customer</th>
                    <th className="px-5 py-4">Priority</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4">Assignee</th>
                    <th className="px-5 py-4">Updated At</th>
                    <th className="px-5 py-4 text-center">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {tickets.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-5 py-16 text-center">
                        <p className="text-lg font-extrabold text-slate-800">No tickets found</p>
                        <p className="mt-1 text-sm text-slate-500">
                          Try changing filters or search keyword.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    tickets.map((ticket) => (
                      <tr
                        key={ticket.id}
                        className="border-b border-slate-100 transition hover:bg-blue-50/40"
                      >
                        <td className="px-5 py-4 text-sm font-extrabold text-slate-800">
                          #TK-{String(ticket.id).padStart(4, '0')}
                        </td>

                        <td className="max-w-[260px] px-5 py-4 text-sm font-bold text-slate-900">
                          {ticket.title}
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-600">
                          {ticket.createdBy?.fullName ?? ticket.createdBy?.email ?? 'Customer'}
                        </td>

                        <td className="px-5 py-4">
                          <Badge value={ticket.priority} />
                        </td>

                        <td className="px-5 py-4">
                          <Badge value={ticket.status} />
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-600">
                          {ticket.assignedTo?.fullName ?? ticket.assignedTo?.email ?? 'Unassigned'}
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-500">
                          {formatDate(ticket.updatedAt)}
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex justify-center">
                            <Link
                              to={`/tickets/${ticket.id}`}
                              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:border-blue-500 hover:text-blue-600"
                            >
                              <Eye className="h-4 w-4" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col items-center justify-between gap-4 px-5 py-4 sm:flex-row">
              <p className="text-sm text-slate-500">
                Showing {tickets.length === 0 ? 0 : currentPage * PAGE_SIZE + 1} to{' '}
                {Math.min((currentPage + 1) * PAGE_SIZE, data?.totalElements ?? 0)} of{' '}
                {data?.totalElements ?? 0} tickets
              </p>

              <div className="flex items-center gap-2">
                <PageButton
                  disabled={currentPage === 0}
                  onClick={() => setFilters((prev) => ({ ...prev, page: currentPage - 1 }))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </PageButton>

                {paginationPages.map((page) => (
                  <PageButton
                    key={page}
                    active={page === currentPage}
                    onClick={() => setFilters((prev) => ({ ...prev, page }))}
                  >
                    {page + 1}
                  </PageButton>
                ))}

                <PageButton
                  disabled={currentPage + 1 >= totalPages}
                  onClick={() => setFilters((prev) => ({ ...prev, page: currentPage + 1 }))}
                >
                  <ChevronRight className="h-4 w-4" />
                </PageButton>
              </div>
            </div>
          </>
        )}
      </div>
    </AgentLayout>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: any; label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <Icon className="h-5 w-5" />
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
          <p className="text-2xl font-extrabold text-slate-950">{value}</p>
        </div>
      </div>
    </div>
  );
}

function SelectBox({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-12 w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 pr-9 text-sm font-bold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
      >
        {children}
      </select>

      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
    </div>
  );
}

function Badge({ value }: { value: string }) {
  const styles: Record<string, string> = {
    OPEN: 'bg-emerald-50 text-emerald-700',
    IN_PROGRESS: 'bg-blue-50 text-blue-700',
    RESOLVED: 'bg-slate-100 text-slate-700',
    CLOSED: 'bg-slate-100 text-slate-700',
    LOW: 'bg-emerald-50 text-emerald-700',
    MEDIUM: 'bg-amber-50 text-amber-700',
    HIGH: 'bg-orange-50 text-orange-700',
    CRITICAL: 'bg-red-50 text-red-700',
  };

  return (
    <span
      className={`inline-flex rounded-lg px-3 py-1.5 text-xs font-extrabold ${
        styles[value] ?? 'bg-slate-100 text-slate-700'
      }`}
    >
      {formatValue(value)}
    </span>
  );
}

function PageButton({
  children,
  active,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`flex h-10 min-w-10 items-center justify-center rounded-xl border px-3 text-sm font-extrabold transition disabled:cursor-not-allowed disabled:opacity-40 ${
        active
          ? 'border-blue-600 bg-blue-600 text-white'
          : 'border-slate-200 bg-white text-slate-700 hover:border-blue-500 hover:text-blue-600'
      }`}
    >
      {children}
    </button>
  );
}

function getPaginationPages(currentPage: number, totalPages: number) {
  if (totalPages <= 1) return [0];

  const pages = new Set<number>();

  pages.add(0);
  pages.add(currentPage);

  if (currentPage > 0) pages.add(currentPage - 1);
  if (currentPage + 1 < totalPages) pages.add(currentPage + 1);

  if (totalPages > 1) pages.add(totalPages - 1);

  return Array.from(pages).sort((a, b) => a - b);
}

function getRouteStatus(path: string): TicketStatus | '' {
  if (path.includes('/open')) return 'OPEN';
  if (path.includes('/in-progress')) return 'IN_PROGRESS';
  if (path.includes('/resolved')) return 'RESOLVED';
  if (path.includes('/closed')) return 'CLOSED';
  return '';
}

function getPageTitle(path: string) {
  if (path.includes('/my-assigned')) return 'My Assigned Tickets';
  if (path.includes('/open')) return 'Open Tickets';
  if (path.includes('/in-progress')) return 'In Progress Tickets';
  if (path.includes('/resolved')) return 'Resolved Tickets';
  if (path.includes('/closed')) return 'Closed Tickets';
  return 'All Tickets';
}

function formatValue(value?: string) {
  if (!value) return '-';
  return value.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDate(date?: string) {
  if (!date) return '-';

  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}