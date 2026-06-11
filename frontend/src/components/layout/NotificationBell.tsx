import { useState } from 'react';
import { Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { notificationsApi } from '../../api/notifications';
import { useNotifications } from '../../hooks/useNotifications';

export default function NotificationBell() {
  const navigate = useNavigate();
  const { notifications, unreadCount } = useNotifications();
  const [open, setOpen] = useState(false);

  const handleOpen = async () => {
    setOpen((prev) => !prev);
    if (!open && unreadCount > 0) {
      await notificationsApi.markAllRead();
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleOpen}
        className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm hover:bg-slate-50"
      >
        <Bell className="h-5 w-5 text-slate-800" />

        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[11px] font-extrabold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-3 w-[330px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
          <div className="border-b border-slate-100 px-4 py-3">
            <p className="font-extrabold text-slate-950">Notifications</p>
            <p className="text-xs text-slate-500">Latest ticket updates</p>
          </div>

          <div className="max-h-[360px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-slate-500">
                No notifications yet
              </div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    navigate(`/tickets/${n.ticketId}`);
                  }}
                  className="block w-full border-b border-slate-100 px-4 py-3 text-left hover:bg-slate-50"
                >
                  <p className="text-sm font-extrabold text-slate-950">
                    {n.title}
                  </p>
                  <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                    {n.message}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}