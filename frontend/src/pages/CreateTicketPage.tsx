import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Bot,
  CheckCircle2,
  FileText,
  Inbox,
  LogOut,
  Menu,
  Plus,
  Search,
  Send,
  Sparkles,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { ticketsApi } from '../api/tickets';
import { getErrorMessage } from '../utils/helpers';
import { useAuthStore } from '../store/authStore';
import NotificationBell from '../components/layout/NotificationBell';

export default function CreateTicketPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, logout } = useAuthStore();

  const [form, setForm] = useState({ title: '', description: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const firstName = user?.fullName?.split(' ')[0] ?? 'Customer';

  const closeSidebar = () => setSidebarOpen(false);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const mutation = useMutation({
    mutationFn: ticketsApi.createTicket,
    onSuccess: (ticket) => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      toast.success('Ticket submitted! AI triage is running…');
      navigate(`/tickets/${ticket.id}`);
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const validate = () => {
    const e: Record<string, string> = {};
    if (form.title.trim().length < 5) e.title = 'Title must be at least 5 characters';
    if (form.description.trim().length < 10) e.description = 'Description must be at least 10 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validate()) {
      mutation.mutate({
        title: form.title.trim(),
        description: form.description.trim(),
      });
    }
  };

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
                onClick={() => {
                  navigate('/dashboard');
                  closeSidebar();
                }}
              />

              <SidebarItem
                icon={FileText}
                label="My Tickets"
                onClick={() => {
                  navigate('/tickets');
                  closeSidebar();
                }}
              />

              <SidebarItem
                icon={Plus}
                label="Create Ticket"
                active
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
            <div className="mx-auto max-w-4xl">
              <button
                onClick={() => navigate('/dashboard')}
                className="mb-6 flex items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-blue-600"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to dashboard
              </button>

              <div className="mb-7">
                <h1 className="text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">
                  Submit a Support Ticket
                </h1>
                <p className="mt-2 text-sm text-slate-500 sm:text-base">
                  Describe your issue clearly and our AI will automatically categorize and prioritize it.
                </p>
              </div>

              <div className="mb-6 rounded-2xl border border-blue-100 bg-blue-50 p-5">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600">
                    <Sparkles className="h-6 w-6" />
                  </div>

                  <div>
                    <p className="font-extrabold text-blue-950">AI-Powered Triage</p>
                    <p className="mt-1 text-sm leading-6 text-blue-800">
                      Once submitted, our AI will automatically assign a category, priority,
                      and draft a suggested response for our agents.
                    </p>
                  </div>
                </div>
              </div>

              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <form onSubmit={handleSubmit}>
                  <div className="space-y-6 p-5 sm:p-6">
                    <div>
                      <label className="mb-2 block text-sm font-extrabold text-slate-800">
                        Ticket Title <span className="text-red-500">*</span>
                      </label>

                      <input
                        type="text"
                        value={form.title}
                        onChange={(e) => {
                          setForm({ ...form, title: e.target.value });
                          if (errors.title) setErrors({ ...errors, title: '' });
                        }}
                        maxLength={255}
                        autoFocus
                        placeholder="Brief summary of your issue"
                        className={`h-12 w-full rounded-xl border bg-white px-4 text-sm text-slate-900 outline-none transition focus:ring-4 ${
                          errors.title
                            ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
                            : 'border-slate-200 focus:border-blue-500 focus:ring-blue-100'
                        }`}
                      />

                      <div className="mt-2 flex items-center justify-between">
                        {errors.title ? (
                          <p className="text-xs font-semibold text-red-600">{errors.title}</p>
                        ) : (
                          <span />
                        )}
                        <p className="text-xs text-slate-400">{form.title.length}/255</p>
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-extrabold text-slate-800">
                        Description <span className="text-red-500">*</span>
                      </label>

                      <textarea
                        value={form.description}
                        onChange={(e) => {
                          setForm({ ...form, description: e.target.value });
                          if (errors.description) setErrors({ ...errors, description: '' });
                        }}
                        rows={8}
                        placeholder="Please provide as much detail as possible..."
                        className={`w-full resize-none rounded-xl border bg-white px-4 py-4 text-sm text-slate-900 outline-none transition focus:ring-4 ${
                          errors.description
                            ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
                            : 'border-slate-200 focus:border-blue-500 focus:ring-blue-100'
                        }`}
                      />

                      {errors.description && (
                        <p className="mt-2 text-xs font-semibold text-red-600">
                          {errors.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 p-5 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      onClick={() => navigate('/dashboard')}
                      className="h-11 rounded-xl border border-slate-200 bg-white px-6 text-sm font-extrabold text-slate-700 transition hover:bg-slate-50"
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      disabled={mutation.isPending}
                      className="flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 text-sm font-extrabold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Send className="h-4 w-4" />
                      {mutation.isPending ? 'Submitting…' : 'Submit Ticket'}
                    </button>
                  </div>
                </form>
              </div>
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