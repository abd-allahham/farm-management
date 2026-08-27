import { NavLink, Outlet } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { NotificationBanner } from '../features/notifications/NotificationBanner';
import { NotificationBell } from '../features/notifications/NotificationBell';
import { NotificationsProvider } from '../features/notifications/NotificationsContext';
import { NotificationToast } from '../features/notifications/NotificationToast';
import { navItems } from './navItems';

const linkBase = 'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition';
const linkActive = 'bg-green-50 text-green-800';
const linkInactive = 'text-slate-600 hover:bg-slate-100 hover:text-slate-900';

export function AppShell() {
  const { user, signOut } = useAuth();

  return (
    <NotificationsProvider>
      <div className="flex min-h-svh bg-slate-50">
        {/* Desktop sidebar */}
        <aside className="hidden w-56 shrink-0 flex-col border-r border-slate-200 bg-white md:flex">
          <div className="flex items-center gap-2 px-4 py-4">
            <div className="h-8 w-8 rounded-lg bg-green-700" aria-hidden />
            <span className="text-sm font-semibold text-slate-900">Farm Management</span>
          </div>

          <nav className="flex-1 space-y-1 px-3">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}
              >
                <Icon size={18} aria-hidden />
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="border-t border-slate-200 px-4 py-3">
            <div className="flex items-center justify-between">
              <p className="truncate text-xs text-slate-500">{user?.displayName ?? user?.email}</p>
              <NotificationBell />
            </div>
            <button
              onClick={() => void signOut()}
              className="mt-2 flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-slate-700"
            >
              <LogOut size={14} aria-hidden />
              Sign out
            </button>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          {/* Mobile top bar */}
          <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 md:hidden">
            <span className="text-sm font-semibold text-slate-900">Farm Management</span>
            <div className="flex items-center gap-1">
              <NotificationBell />
              <button
                onClick={() => void signOut()}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Sign out
              </button>
            </div>
          </header>

          <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 pb-24 md:pb-8">
            <NotificationBanner />
            <NotificationToast />
            <Outlet />
          </main>

          {/* Mobile bottom tab bar */}
          <nav className="fixed inset-x-0 bottom-0 flex border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] md:hidden">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${
                    isActive ? 'text-green-800' : 'text-slate-500'
                  }`
                }
              >
                <Icon size={20} aria-hidden />
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>
    </NotificationsProvider>
  );
}
