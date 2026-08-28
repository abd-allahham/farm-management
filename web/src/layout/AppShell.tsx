import { Link, NavLink, Outlet } from 'react-router-dom';
import { LogOut, ScanBarcode } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { NotificationBanner } from '../features/notifications/NotificationBanner';
import { NotificationBell } from '../features/notifications/NotificationBell';
import { NotificationsProvider } from '../features/notifications/NotificationsContext';
import { NotificationPushToast } from '../features/notifications/NotificationPushToast';
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

          <div className="px-3">
            <Link
              to="/scan"
              className="mb-2 flex items-center justify-center gap-2 rounded-lg bg-green-700 px-3 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-green-800"
            >
              <ScanBarcode size={18} aria-hidden />
              Scan a cow
            </Link>
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
              <NotificationBell menuPlacement="up" />
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

          {/* Mobile bottom tab bar — "Scan a cow" gets a raised circular
              button in the middle instead of a regular tab, since it's the
              primary quick action, not just another section. */}
          <nav className="fixed inset-x-0 bottom-0 flex items-center border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] md:hidden">
            {navItems.slice(0, Math.ceil(navItems.length / 2)).map(({ to, label, icon: Icon }) => (
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

            <div className="flex flex-1 justify-center">
              <Link
                to="/scan"
                aria-label="Scan a cow"
                className="relative -top-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-700 text-white shadow-lg ring-4 ring-white transition hover:bg-green-800"
              >
                <ScanBarcode size={24} aria-hidden />
              </Link>
            </div>

            {navItems.slice(Math.ceil(navItems.length / 2)).map(({ to, label, icon: Icon }) => (
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

        <NotificationPushToast />
      </div>
    </NotificationsProvider>
  );
}
