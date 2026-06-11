import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Bot,
  CheckCircle2,
  Clock3,
  MessageSquare,
  RefreshCw,
  Send,
  Sparkles,
  Ticket,
  UserCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';

import AgentLayout from '../components/layout/AgentLayout';
import { ticketsApi } from '../api/tickets';
import { ErrorBanner, Spinner } from '../components/common';
import { getErrorMessage } from '../utils/helpers';
import { useAuthStore } from '../store/authStore';
import type { TicketStatus } from '../types';

const STATUS_OPTIONS: TicketStatus[] = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];

export default function TicketDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const isAgent = user?.role === 'AGENT';

  const [message, setMessage] = useState('');

  const { data: ticket, isLoading, error } = useQuery({
    queryKey: ['ticket', id],
    queryFn: () => ticketsApi.getTicketById(Number(id)),
    enabled: !!id,
  });

  const { data: commentsData, isLoading: commentsLoading } = useQuery({
  queryKey: ['ticket-comments', id],
  queryFn: () => ticketsApi.getComments(Number(id)),
  enabled: !!id,
});


function formatDateTime(date?: string) {
  if (!date) return '';

  return new Date(date).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const comments = commentsData?.content ?? [];

  const updateStatusMutation = useMutation({
    mutationFn: (status: TicketStatus) =>
      ticketsApi.updateTicket(Number(id), { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', id] });
      queryClient.invalidateQueries({ queryKey: ['agent-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      toast.success('Ticket status updated successfully');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const assignMutation = useMutation({
    mutationFn: () =>
      ticketsApi.updateTicket(Number(id), { assignedToId: user?.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', id] });
      queryClient.invalidateQueries({ queryKey: ['agent-tickets'] });
      toast.success('Ticket assigned successfully');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const sendMessageMutation = useMutation({
  mutationFn: () =>
    ticketsApi.addComment(Number(id), {
      content: message.trim(),
    }),
  onSuccess: () => {
    setMessage('');
    queryClient.invalidateQueries({ queryKey: ['ticket-comments', id] });
    toast.success('Message sent');
  },
  onError: (err) => toast.error(getErrorMessage(err)),
});

  const content = (
    <>
      <button
        onClick={() => navigate(isAgent ? '/agent/dashboard' : '/tickets')}
        className="mb-6 flex items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-blue-600"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to {isAgent ? 'agent dashboard' : 'my tickets'}
      </button>

      {isLoading && (
        <div className="flex justify-center py-24">
          <Spinner size="lg" />
        </div>
      )}

      {error && <ErrorBanner message={getErrorMessage(error)} />}

      {!isLoading && !error && ticket && (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_380px]">
          <div className="space-y-6">
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="mb-3 flex flex-wrap items-center gap-3">
                    <span className="rounded-xl bg-blue-50 px-3 py-1.5 text-sm font-extrabold text-blue-700">
                      #TK-{String(ticket.id).padStart(4, '0')}
                    </span>
                    <Badge value={ticket.status} />
                    <Badge value={ticket.priority} />
                  </div>

                  <h1 className="text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">
                    {ticket.title}
                  </h1>

                  <p className="mt-3 max-w-3xl text-slate-500">
                    Created by {ticket.createdBy?.fullName ?? ticket.createdBy?.email ?? 'Customer'} ·{' '}
                    {formatDate(ticket.createdAt)}
                  </p>
                </div>

                {isAgent && (
                  <button
                    onClick={() => assignMutation.mutate()}
                    disabled={assignMutation.isPending}
                    className="h-11 rounded-xl bg-blue-600 px-5 text-sm font-extrabold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700 disabled:opacity-60"
                  >
                    {assignMutation.isPending ? 'Assigning…' : 'Assign to Me'}
                  </button>
                )}
              </div>

              <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <InfoCard icon={Ticket} label="Category" value={formatValue(ticket.category)} />
                <InfoCard icon={Clock3} label="Priority" value={formatValue(ticket.priority)} />
                <InfoCard
                  icon={UserCircle}
                  label="Assignee"
                  value={ticket.assignedTo?.fullName ?? ticket.assignedTo?.email ?? 'Unassigned'}
                />
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-extrabold text-slate-950">Description</h2>
              <p className="whitespace-pre-wrap rounded-2xl bg-slate-50 p-5 leading-7 text-slate-700">
                {ticket.description}
              </p>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                    <Sparkles className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-lg font-extrabold text-slate-950">AI Suggested Response</h2>
                    <p className="text-sm text-slate-500">Draft response generated for faster support.</p>
                  </div>
                </div>
                <span className="rounded-lg bg-violet-100 px-2 py-1 text-xs font-extrabold text-violet-700">
                  AI
                </span>
              </div>

              <div className="rounded-2xl border border-violet-100 bg-violet-50 p-5 leading-7 text-slate-700">
                {ticket.aiSuggestedResponse ||
                  "Thank you for contacting support. We understand your issue and our team is reviewing it. We'll update you shortly with the next steps."}
              </div>

              {isAgent && (
                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                  <button
                  type="button"
                  onClick={() => {
                    setMessage(
                      ticket.aiSuggestedResponse ||
                        "Thank you for contacting support. We understand your issue and our team is reviewing it. We'll update you shortly with the next steps."
                    );

                    document
                      .getElementById('agent-customer-chat')
                      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  className="flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-extrabold text-white hover:bg-blue-700"
                >
                  <Send className="h-4 w-4" />
                  Use Response
                </button>
                </div>
              )}
            </section>
           
           <section
            id="agent-customer-chat"
            className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
          >
            <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
              <MessageSquare className="h-5 w-5 text-blue-600" />
              <div>
                <h2 className="text-base font-extrabold text-slate-950">
                  Agent-Customer Chat
                </h2>
                <p className="text-xs text-slate-500">
                  Conversation related to this ticket
                </p>
              </div>
            </div>

            <div className="max-h-[340px] space-y-2 overflow-y-auto bg-[#F7F8FA] px-3 py-3">
              {commentsLoading ? (
                <div className="flex justify-center py-10">
                  <Spinner size="md" />
                </div>
              ) : comments.length === 0 ? (
                <div className="py-10 text-center">
                  <MessageSquare className="mx-auto h-8 w-8 text-slate-400" />
                  <p className="mt-2 text-sm font-bold text-slate-700">No messages yet</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Start the conversation to understand the issue better.
                  </p>
                </div>
              ) : (
                comments.map((comment: any) => {
                  const senderName =
                    comment.author?.fullName ||
                    comment.author?.email ||
                    comment.createdBy?.fullName ||
                    comment.createdBy?.email ||
                    'User';

                  const senderRole =
                    comment.author?.role ||
                    comment.createdBy?.role ||
                    '';

                  const isMine =
                    comment.author?.id === user?.id ||
                    comment.createdBy?.id === user?.id;

                  return (
                    <div
                      key={comment.id}
                      className={`flex w-full ${isMine ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`inline-flex max-w-[78%] flex-col rounded-2xl px-3 py-1.5 text-sm shadow-sm ${
                          isMine
                            ? 'rounded-br-md bg-blue-600 text-white'
                            : 'rounded-bl-md border border-slate-200 bg-white text-slate-800'
                        }`}
                      >
                        <div className="mb-0.5 inline-flex items-center gap-1.5">
                          <span
                            className={`text-[11px] font-bold ${
                              isMine ? 'text-blue-100' : 'text-slate-700'
                            }`}
                          >
                            {senderName}
                          </span>

                          {senderRole && (
                            <span
                              className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${
                                isMine
                                  ? 'bg-white/15 text-white'
                                  : 'bg-slate-100 text-slate-500'
                              }`}
                            >
                              {senderRole}
                            </span>
                          )}
                        </div>

                        <p className="w-fit whitespace-pre-wrap break-words text-[13px] leading-[18px]">
                          {comment.content || comment.message || comment.text}
                        </p>

                        <p
                          className={`mt-0.5 self-end text-[10px] leading-none ${
                            isMine ? 'text-blue-100' : 'text-slate-400'
                          }`}
                        >
                          {formatDateTime(comment.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {ticket.status === 'CLOSED' && (
              <div className="border-t border-slate-100 bg-slate-50 px-4 py-2 text-center text-xs font-semibold text-slate-500">
                This ticket is closed. New messages are disabled.
              </div>
            )}

            <div className="flex gap-2 border-t border-slate-100 bg-white p-3">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={ticket.status === 'CLOSED'}
                rows={1}
                placeholder={
                  ticket.status === 'CLOSED'
                    ? 'Ticket closed'
                    : isAgent
                      ? 'Write a reply...'
                      : 'Write a message...'
                }
                className="min-h-[40px] flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
              />

              <button
                type="button"
                disabled={ticket.status === 'CLOSED' || !message.trim() || sendMessageMutation.isPending}
                onClick={() => sendMessageMutation.mutate()}
                className="h-[40px] rounded-xl bg-blue-600 px-4 text-sm font-extrabold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {sendMessageMutation.isPending ? 'Sending…' : 'Send'}
              </button>
            </div>
          </section>
            
          </div>

          <aside className="space-y-6">
            {isAgent && (
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="mb-4 text-lg font-extrabold text-slate-950">Update Status</h3>

                <div className="space-y-3">
                  {STATUS_OPTIONS.map((status) => (
                    <button
                      key={status}
                      onClick={() => updateStatusMutation.mutate(status)}
                      disabled={updateStatusMutation.isPending}
                      className={`flex h-12 w-full items-center justify-between rounded-xl border px-4 text-sm font-extrabold transition ${
                        ticket.status === status
                          ? 'border-blue-600 bg-blue-50 text-blue-700'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {formatValue(status)}
                      {ticket.status === status && <CheckCircle2 className="h-5 w-5" />}
                    </button>
                  ))}
                </div>
              </section>
            )}

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="mb-4 text-lg font-extrabold text-slate-950">Ticket Summary</h3>

              <div className="space-y-4">
                <SummaryRow label="Ticket ID" value={`#TK-${String(ticket.id).padStart(4, '0')}`} />
                <SummaryRow label="Status" value={formatValue(ticket.status)} />
                <SummaryRow label="Priority" value={formatValue(ticket.priority)} />
                <SummaryRow label="Category" value={formatValue(ticket.category)} />
                <SummaryRow label="Created At" value={formatDate(ticket.createdAt)} />
                <SummaryRow label="Updated At" value={formatDate(ticket.updatedAt)} />
              </div>
            </section>

            <section className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
              <div className="mb-3 flex items-center gap-3">
                <Bot className="h-6 w-6 text-blue-600" />
                <h3 className="font-extrabold text-blue-950">AI Triage Notes</h3>
              </div>

              <p className="text-sm leading-6 text-blue-800">
                This ticket was automatically analyzed for category, priority, and suggested response.
              </p>
            </section>
          </aside>
        </div>
      )}
    </>
  );

  if (isAgent) {
    return (
      <AgentLayout>
      {content}
    </AgentLayout>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
      {content}
    </div>
  );
}

function InfoCard({ icon: Icon, label, value }: any) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-blue-600">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</p>
          <p className="font-extrabold text-slate-900">{value}</p>
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3 text-sm last:border-b-0 last:pb-0">
      <span className="font-bold text-slate-500">{label}</span>
      <span className="text-right font-extrabold text-slate-900">{value || '-'}</span>
    </div>
  );
}

function Badge({ value }: { value: string }) {
  const normalized = value?.toUpperCase();

  const styles: Record<string, string> = {
    OPEN: 'bg-emerald-50 text-emerald-700',
    IN_PROGRESS: 'bg-blue-50 text-blue-700',
    RESOLVED: 'bg-slate-100 text-slate-700',
    CLOSED: 'bg-slate-100 text-slate-700',
    LOW: 'bg-emerald-50 text-emerald-700',
    MEDIUM: 'bg-amber-50 text-amber-700',
    HIGH: 'bg-orange-50 text-orange-700',
    CRITICAL: 'bg-red-50 text-red-700',
    DEFAULT: 'bg-violet-50 text-violet-700',
  };

  return (
    <span className={`inline-flex rounded-lg px-3 py-1.5 text-xs font-extrabold ${styles[normalized] ?? styles.DEFAULT}`}>
      {formatValue(value)}
    </span>
  );
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

function formatDateTime(date?: string) {
  if (!date) return '';

  return new Date(date).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}