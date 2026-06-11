import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { LogOut, Zap, LayoutDashboard, PlusCircle, ChevronDown } from 'lucide-react';
import { useState } from 'react';

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isAgent = user?.role === 'AGENT' || user?.role === 'ADMIN';

  const navLinks = isAgent
    ? [{ to: '/agent', icon: LayoutDashboard, label: 'Dashboard' }]
    : [
        { to: '/dashboard', icon: LayoutDashboard, label: 'My Tickets' },
        { to: '/tickets/new', icon: PlusCircle, label: 'New Ticket' },
      ];

  const initials = user?.fullName
    ? user.fullName.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  const roleLabel = user?.role === 'AGENT' ? 'Support Agent' : user?.role === 'ADMIN' ? 'Admin' : 'Customer';

  return (
    <nav className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">
          {/* Logo */}
          <Link
            to={isAgent ? '/agent' : '/dashboard'}
            className="flex items-center gap-2.5 flex-shrink-0"
          >
            <div className="h-7 w-7 bg-indigo-600 rounded-md flex items-center justify-center shadow shadow-indigo-900/60">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="text-white font-semibold text-sm tracking-tight">SupportDesk</span>
          </Link>

          {/* Nav links */}
          <div className="flex items-center gap-1">
            {navLinks.map(({ to, icon: Icon, label }) => {
              const active = location.pathname === to;
              return (
                <Link
                  key={to}
                  to={to}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                    active
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </Link>
              );
            })}
          </div>

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-800 transition-colors group"
            >
              <div className="h-7 w-7 bg-indigo-600 rounded-full flex items-center justify-center text-xs text-white font-bold flex-shrink-0">
                {initials}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-medium text-white leading-tight">{user?.fullName}</p>
                <p className="text-xs text-slate-400 leading-tight">{roleLabel}</p>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-slate-500 group-hover:text-slate-400 hidden sm:block" />
            </button>

            {userMenuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                <div className="absolute right-0 mt-1.5 w-52 bg-white rounded-xl border border-slate-200 shadow-lg z-20 overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                    <p className="text-sm font-semibold text-slate-900 truncate">{user?.fullName}</p>
                    <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                    <span className="inline-flex mt-1.5 items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700">
                      {roleLabel}
                    </span>
                  </div>
                  <div className="p-1">
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign out
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
