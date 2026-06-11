import { ReactNode, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCircle2,
  Clock3,
  Inbox,
  LogOut,
  Menu,
  Search,
  Ticket,
  UserCircle,
  X,
} from 'lucide-react';

import { useAuthStore } from '../../store/authStore';
import NotificationBell from './NotificationBell';

type AgentLayoutProps = {
  children: ReactNode;
};

export default function AgentLayout({ children }: AgentLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const agentName = user?.fullName ?? 'Agent';

  const navItems = [
    { label: 'All Tickets', icon: Ticket, path: '/agent/tickets' },
    { label: 'My Assigned', icon: UserCircle, path: '/agent/my-assigned' },
    { label: 'Open Tickets', icon: Inbox, path: '/agent/open' },
    { label: 'In Progress', icon: Clock3, path: '/agent/in-progress' },
    { label: 'Resolved Tickets', icon: CheckCircle2, path: '/agent/resolved' },
    { label: 'Closed Tickets', icon: CheckCircle2, path: '/agent/closed' },
  ];

  const closeSidebar = () => setSidebarOpen(false);

  const handleNavigate = (path: string) => {
    navigate(path);
    closeSidebar();
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
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
              onClick={() => handleNavigate('/agent/tickets')}
              className="flex items-center gap-3"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 shadow-lg shadow-blue-900/40">
                <Ticket className="h-5 w-5 text-white" />
              </div>

              <div className="text-left">
                <h1 className="text-lg font-extrabold leading-5">
                  AI Support Desk
                </h1>
                <p className="text-xs text-slate-400">Agent Panel</p>
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
            Tickets
          </div>

          <nav className="mt-4 flex flex-1 flex-col px-3">
            <div className="space-y-2">
              {navItems.map((item) => (
                <button
                  key={item.path}
                  type="button"
                  onClick={() => handleNavigate(item.path)}
                  className={`flex h-12 w-full items-center gap-3 rounded-xl px-4 text-sm font-bold transition ${
                    location.pathname === item.path
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-950/30'
                      : 'text-slate-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </button>
              ))}
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
                  <div className="relative">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-900 text-sm font-extrabold text-white">
                      {agentName.charAt(0)}
                    </div>
                    <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
                  </div>

                  <div className="hidden text-left sm:block">
                    <p className="text-sm font-extrabold leading-5 text-slate-950">
                      {agentName}
                    </p>
                    <p className="text-xs text-slate-500">Support Agent</p>
                  </div>
                </div>
              </div>
            </div>
          </header>

          <section className="px-4 py-6 sm:px-6 lg:px-8">
            {children}
          </section>
        </main>
      </div>
    </div>
  );
}