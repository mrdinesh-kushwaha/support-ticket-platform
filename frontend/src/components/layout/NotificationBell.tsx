import { useState } from 'react';
import { Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { notificationsApi } from '../../api/notifications';
import { useNotifications } from '../../hooks/useNotifications';

export default function NotificationBell() {
  const navigate = useNavigate();
  const { notifications, unreadCount } = useNotifications();
  const [open, setOpen] = useState(false);

  const latestNotifications = notifications.slice(0, 3);

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
       <div
            className="
              fixed left-4 right-4 top-20 z-50
              max-h-[360px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl
              sm:absolute sm:left-auto sm:right-0 sm:top-auto sm:mt-3 sm:w-[330px]
            "
          >
          <div className="border-b border-slate-100 px-4 py-3">
            <p className="font-extrabold text-slate-950">Notifications</p>
            <p className="text-xs text-slate-500">Latest 3 ticket updates</p>
          </div>

          <div className="max-h-[280px] overflow-y-auto">
            {latestNotifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-slate-500">
                No notifications yet
              </div>
            ) : (
              latestNotifications.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    navigate(`/tickets/${n.ticketId}`);
                  }}
                  className="block w-full border-b border-slate-100 px-4 py-3 text-left hover:bg-slate-50"
                >
                  <p className="truncate text-sm font-extrabold text-slate-950">
                    {n.title}
                  </p>
                  <p className="mt-1 line-clamp-2 break-words text-xs leading-5 text-slate-500">
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