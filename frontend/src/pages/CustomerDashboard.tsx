
import { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Bell,
  Bot,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileText,
  Inbox,
  LogOut,
  Menu,
  Plus,
  Search,
  Ticket,
  X,
} from 'lucide-react';

import { ticketsApi } from '../api/tickets';
import { useAuthStore } from '../store/authStore';
import type { TicketFilters, TicketStatus } from '../types';
import { Spinner, ErrorBanner } from '../components/common';
import { getErrorMessage } from '../utils/helpers';
import NotificationBell from '../components/layout/NotificationBell';

const PAGE_SIZE = 5;

export default function CustomerDashboard() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const isMyTicketsPage = location.pathname === '/tickets';
  const isDashboardPage = location.pathname === '/dashboard';

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<TicketStatus | ''>('');
  const [filters, setFilters] = useState<TicketFilters>({
    page: 0,
    size: PAGE_SIZE,
    sortBy: 'createdAt',
    sortDir: 'desc',
  });

  const apiFilters: TicketFilters = useMemo(
    () => ({
      ...filters,
      search: search.trim() || undefined,
      status: status || undefined,
    }),
    [filters, search, status]
  );

  const closeSidebar = () => setSidebarOpen(false);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const { data, isLoading, error } = useQuery({
    queryKey: ['tickets', apiFilters],
    queryFn: () => ticketsApi.getTickets(apiFilters),
  });

  const tickets = data?.content ?? [];
  const currentPage = data?.page ?? filters.page ?? 0;
  const totalPages = Math.max(data?.totalPages ?? 1, 1);
  const paginationPages = getPaginationPages(currentPage, totalPages);

  const totalTickets = data?.totalElements ?? 0;
  const openTickets = tickets.filter((t: any) => t.status === 'OPEN').length;
  const progressTickets = tickets.filter((t: any) => t.status === 'IN_PROGRESS').length;
  const resolvedTickets = tickets.filter((t: any) => t.status === 'RESOLVED').length;
  const closedTickets = tickets.filter((t: any) => t.status === 'CLOSED').length;

  const firstName = user?.fullName?.split(' ')[0] ?? 'Customer';

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-950">
      <div className="flex min-h-screen">
        {sidebarOpen && (
          <div
            onClick={closeSidebar}
            className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          />
        )}

        <aside
          className={`fixed left-0 top-0 z-50 flex h-screen w-[270px] flex-col bg-[#0F172A] text-white transition-transform duration-300 lg:sticky lg:top-0 lg:z-30 lg:translate-x-0 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
        >
          <div className="flex h-[76px] items-center justify-between px-5">
            <button
              type="button"
              onClick={() => {
                navigate('/dashboard');
                closeSidebar();
              }}
              className="flex items-center gap-3"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 shadow-lg shadow-blue-900/40">
                <Bot className="h-5 w-5 text-white" />
              </div>

              <div className="text-left">
                <h1 className="text-lg font-extrabold leading-5">SupportPro</h1>
                <p className="text-xs text-slate-400">Customer Portal</p>
              </div>
            </button>

            <button
              type="button"
              onClick={closeSidebar}
              className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-white/10 lg:hidden"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="px-5 pt-5 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
            Customer
          </div>

          <nav className="mt-4 flex flex-1 flex-col px-3">
            <div className="space-y-2">
              <SidebarItem
                icon={Inbox}
                label="Dashboard"
                active={isDashboardPage}
                onClick={() => {
                  navigate('/dashboard');
                  closeSidebar();
                }}
              />

              <SidebarItem
                icon={FileText}
                label="My Tickets"
                active={isMyTicketsPage}
                onClick={() => {
                  navigate('/tickets');
                  closeSidebar();
                }}
              />

              <SidebarItem
                icon={Plus}
                label="Create Ticket"
                onClick={() => {
                  navigate('/tickets/new');
                  closeSidebar();
                }}
              />
            </div>

            <div className="mt-auto border-t border-white/10 pt-4 pb-4">
              <button
                type="button"
                onClick={handleLogout}
                className="flex h-12 w-full items-center gap-3 rounded-xl px-4 font-bold text-slate-300 transition hover:bg-white/10 hover:text-white"
              >
                <LogOut className="h-5 w-5" />
                Logout
              </button>
            </div>
          </nav>
        </aside>

        <main className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-xl">
            <div className="flex min-h-[76px] items-center gap-4 px-4 sm:px-6 lg:px-8">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-800 shadow-sm hover:bg-slate-50 lg:hidden"
              >
                <Menu className="h-6 w-6" />
              </button>

             <div className="hidden flex-1 md:block" />

              <div className="ml-auto flex items-center gap-3">
              <NotificationBell />
                <div className="hidden h-9 w-px bg-slate-200 sm:block" />

                <div className="flex items-center gap-3 rounded-xl px-2 py-1.5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-900 text-sm font-extrabold text-white">
                    {firstName.charAt(0)}
                  </div>

                  <div className="hidden text-left sm:block">
                    <p className="text-sm font-extrabold leading-5 text-slate-950">
                      {user?.fullName ?? 'Customer'}
                    </p>
                    <p className="text-xs text-slate-500">Customer</p>
                  </div>
                </div>
              </div>
            </div>
          </header>

          <section className="px-4 py-6 sm:px-6 lg:px-8">
            <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">
                  {isMyTicketsPage ? 'My Tickets' : 'Customer Dashboard'}
                </h2>

                <p className="mt-2 text-sm text-slate-500 sm:text-base">
                  {isMyTicketsPage
                    ? 'Only tickets created by you are shown here.'
                    : 'Overview of your support tickets.'}
                </p>
              </div>

              {!isMyTicketsPage && (
                <Link
                  to="/tickets/new"
                  className="flex h-12 items-center justify-center gap-3 rounded-xl bg-blue-600 px-6 text-sm font-extrabold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700"
                >
                  <Plus className="h-5 w-5" />
                  Create Ticket
                </Link>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-5 lg:gap-4">
              <StatCard icon={FileText} label="Total Tickets" value={totalTickets} />
              <StatCard icon={Ticket} label="Open" value={openTickets} />
              <StatCard icon={Ticket} label="In Progress" value={progressTickets} />
              <StatCard icon={CheckCircle2} label="Resolved" value={resolvedTickets} />
              <StatCard icon={Inbox} label="Closed" value={closedTickets} />
            </div>

            <div className="mt-7 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 p-4">
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_210px]">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <input
                      value={search}
                      onChange={(e) => {
                        setSearch(e.target.value);
                        setFilters((prev) => ({ ...prev, page: 0 }));
                      }}
                      placeholder="Search tickets..."
                      className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-12 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    />
                  </div>

                  <div className="relative">
                    <select
                      value={status}
                      onChange={(e) => {
                        setStatus(e.target.value as TicketStatus | '');
                        setFilters((prev) => ({ ...prev, page: 0 }));
                      }}
                      className="h-12 w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 pr-9 text-sm font-bold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    >
                      <option value="">All Status</option>
                      <option value="OPEN">Open</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="RESOLVED">Resolved</option>
                      <option value="CLOSED">Closed</option>
                    </select>

                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  </div>
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
                          <th className="px-5 py-4">Category</th>
                          <th className="px-5 py-4">Status</th>
                          <th className="px-5 py-4">Priority</th>
                          <th className="px-5 py-4">Created At</th>
                          <th className="px-5 py-4 text-center">Action</th>
                        </tr>
                      </thead>

                      <tbody>
                        {tickets.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="px-5 py-16 text-center">
                              <p className="text-lg font-extrabold text-slate-800">
                                No tickets found
                              </p>
                              <p className="mt-1 text-sm text-slate-500">
                                Try changing filters or search keyword.
                              </p>
                            </td>
                          </tr>
                        ) : (
                          tickets.map((ticket: any) => (
                            <tr
                              key={ticket.id}
                              className="border-b border-slate-100 transition hover:bg-blue-50/40"
                            >
                              <td className="px-5 py-4 text-sm font-extrabold text-slate-800">
                                #SP-{String(ticket.id).padStart(4, '0')}
                              </td>

                              <td className="max-w-[260px] px-5 py-4 text-sm font-bold text-slate-900">
                                {ticket.title}
                              </td>

                              <td className="px-5 py-4">
                                <Badge value={ticket.category ?? 'GENERAL_INQUIRY'} />
                              </td>

                              <td className="px-5 py-4">
                                <Badge value={ticket.status ?? 'OPEN'} />
                              </td>

                              <td className="px-5 py-4">
                                <Badge value={ticket.priority ?? 'LOW'} />
                              </td>

                              <td className="px-5 py-4 text-sm text-slate-500">
                                {formatDate(ticket.createdAt)}
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
                        onClick={() =>
                          setFilters((prev) => ({ ...prev, page: currentPage - 1 }))
                        }
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
                        onClick={() =>
                          setFilters((prev) => ({ ...prev, page: currentPage + 1 }))
                        }
                      >
                        <ChevronRight className="h-4 w-4" />
                      </PageButton>
                    </div>
                  </div>
                </>
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

function SidebarItem({
  icon: Icon,
  label,
  active = false,
  onClick,
}: {
  icon: any;
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-12 w-full items-center gap-3 rounded-xl px-4 text-sm font-bold transition ${
        active
          ? 'bg-blue-600 text-white shadow-lg shadow-blue-950/30'
          : 'text-slate-300 hover:bg-white/10 hover:text-white'
      }`}
    >
      <Icon className="h-5 w-5" />
      <span>{label}</span>
    </button>
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
    BILLING: 'bg-violet-50 text-violet-700',
    TECHNICAL_ISSUE: 'bg-blue-50 text-blue-700',
    ACCOUNT_ACCESS: 'bg-orange-50 text-orange-700',
    FEATURE_REQUEST: 'bg-emerald-50 text-emerald-700',
    GENERAL_INQUIRY: 'bg-slate-100 text-slate-700',
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