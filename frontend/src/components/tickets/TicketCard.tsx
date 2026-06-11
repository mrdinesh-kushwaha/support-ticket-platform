import { Link } from 'react-router-dom';
import { MessageSquare, Clock, User } from 'lucide-react';
import type { Ticket } from '../../types';
import { StatusBadge, PriorityBadge } from '../common';
import { categoryLabels, timeAgo } from '../../utils/helpers';

interface Props {
  ticket: Ticket;
}

export default function TicketCard({ ticket }: Props) {
  return (
    <Link to={`/tickets/${ticket.id}`} className="block">
      <div className="card p-4 hover:shadow-md hover:border-blue-200 transition-all cursor-pointer">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-gray-400 font-mono">#{ticket.id}</span>
              <StatusBadge status={ticket.status} />
              <PriorityBadge priority={ticket.priority} />
            </div>
            <h3 className="text-sm font-semibold text-gray-900 truncate">{ticket.title}</h3>
            <p className="mt-1 text-xs text-gray-500 line-clamp-2">{ticket.description}</p>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-4 text-xs text-gray-400">
          <span className="inline-flex items-center gap-1">
            <span className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-600 text-xs">
              {categoryLabels[ticket.category]}
            </span>
          </span>
          <span className="inline-flex items-center gap-1">
            <User className="h-3 w-3" />
            {ticket.createdBy.fullName}
          </span>
          {ticket.assignedTo && (
            <span className="inline-flex items-center gap-1 text-green-600">
              → {ticket.assignedTo.fullName}
            </span>
          )}
          <span className="inline-flex items-center gap-1 ml-auto">
            <MessageSquare className="h-3 w-3" />
            {ticket.commentCount}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {timeAgo(ticket.createdAt)}
          </span>
        </div>
      </div>
    </Link>
  );
}
