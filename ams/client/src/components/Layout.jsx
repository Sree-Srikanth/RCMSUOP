import { useEffect, useState } from 'react';
import { NavLink, Outlet, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, UserCircle, Briefcase, FileText, Bell, LogOut, Menu, X, ListChecks, Share2, CalendarClock, BarChart3,
  Users, Settings, ScrollText, Database, Mail, BadgeCheck, KeyRound, FolderOpen,
} from 'lucide-react';
import { useAuth } from '../lib/auth';
import { label } from '../lib/format';
import { get } from '../lib/api';
import { cx } from './ui';

const NAV = {
  APPLICANT: [
    { to: '/applicant', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/applicant/vacancies', label: 'Vacancies', icon: Briefcase },
    { to: '/applicant/applications', label: 'My Applications', icon: FileText },
    { to: '/applicant/profile', label: 'My Profile', icon: UserCircle },
    { to: '/notifications', label: 'Notifications', icon: Bell, badge: true },
  ],
  REGISTRAR: [
    { to: '/registrar', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/registrar/applications', label: 'Applications', icon: FileText },
    { to: '/registrar/shortlist', label: 'Shortlist', icon: ListChecks },
    { to: '/registrar/interviews', label: 'Interviews', icon: CalendarClock },
    { to: '/registrar/appointments', label: 'Appointments', icon: BadgeCheck },
    { to: '/registrar/reports', label: 'Reports & Schedule', icon: BarChart3 },
    { to: '/vacancies-admin', label: 'Vacancies', icon: Briefcase },
    { to: '/notifications', label: 'Notifications', icon: Bell, badge: true },
  ],
  HOD: [
    { to: '/shared', label: 'Shared Applications', icon: Share2, end: true },
    { to: '/notifications', label: 'Notifications', icon: Bell, badge: true },
  ],
  DEAN: [
    { to: '/shared', label: 'Shared Applications', icon: Share2, end: true },
    { to: '/notifications', label: 'Notifications', icon: Bell, badge: true },
  ],
  ADMIN: [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/vacancies-admin', label: 'Vacancies', icon: Briefcase },
    { to: '/registrar/applications', label: 'Applications', icon: FolderOpen },
    { to: '/admin/users', label: 'Users & Roles', icon: Users },
    { to: '/admin/master-data', label: 'Master Data', icon: Database },
    { to: '/admin/settings', label: 'System Settings', icon: Settings },
    { to: '/admin/audit', label: 'Audit Log', icon: ScrollText },
    { to: '/admin/outbox', label: 'Email Outbox', icon: Mail },
  ],
};

export function Brand({ compact }) {
  return (
    <Link to="/" className="flex items-center gap-3">
      <img src="/logo.png" alt="University of Peradeniya logo" className={compact ? 'h-9 w-9' : 'h-11 w-11'} />
      <div className="leading-tight">
        <p className="text-sm font-bold uppercase tracking-wide text-white">University of Peradeniya</p>
        <p className="text-xs text-gold-300">Application Management System</p>
      </div>
    </Link>
  );
}

export default function Layout() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const location = useLocation();

  useEffect(() => setOpen(false), [location.pathname]);
  useEffect(() => {
    get('/me/notifications')
      .then((r) => setUnread(r.unread))
      .catch(() => {});
  }, [location.pathname]);

  const items = NAV[user.role] || [];
  const unitName = user.department_name || user.faculty_name;

  const sidebar = (
    <nav className="flex h-full flex-col" aria-label="Main navigation">
      <div className="border-b border-uop-800 px-4 py-4">
        <Brand compact />
      </div>
      <ul className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {items.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cx(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition',
                  isActive ? 'bg-white/15 text-white shadow-inner' : 'text-uop-100 hover:bg-white/10 hover:text-white',
                )
              }
            >
              <item.icon className="h-4 w-4 flex-none" aria-hidden />
              <span className="flex-1">{item.label}</span>
              {item.badge && unread > 0 && <span className="rounded-full bg-gold-500 px-1.5 text-xs font-bold text-uop-900">{unread}</span>}
            </NavLink>
          </li>
        ))}
      </ul>
      <div className="border-t border-uop-800 px-4 py-3 text-xs text-uop-200">
        <p>{label(user.role)}</p>
        {unitName && <p className="truncate text-uop-300">{unitName}</p>}
      </div>
    </nav>
  );

  return (
    <div className="flex min-h-screen">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-white focus:px-3 focus:py-2">
        Skip to content
      </a>
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 bg-uop-700 lg:block">{sidebar}</aside>
      {/* Mobile sidebar */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setOpen(false)} aria-hidden />
          <aside className="absolute inset-y-0 left-0 w-64 bg-uop-700 shadow-xl">
            <button type="button" onClick={() => setOpen(false)} className="absolute right-2 top-2 rounded p-1 text-white hover:bg-white/10" aria-label="Close menu">
              <X className="h-5 w-5" />
            </button>
            {sidebar}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6">
          <div className="flex items-center gap-3">
            <button type="button" className="rounded p-1.5 text-slate-600 hover:bg-slate-100 lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
              <Menu className="h-5 w-5" />
            </button>
            <p className="hidden text-sm font-semibold text-uop-700 sm:block">Recruitment &amp; Selection</p>
          </div>
          <div className="flex items-center gap-2">
            <Link to={user.role === 'APPLICANT' ? '/applicant/profile' : '/change-password'} className="flex items-center gap-2 rounded-md px-2 py-1 text-sm hover:bg-slate-100" title="Profile">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-uop-100 text-sm font-semibold text-uop-700" aria-hidden>
                {user.full_name?.replace(/^(Dr|Mr|Mrs|Miss|Ms|Prof|Rev)\.\s*/, '').charAt(0) || '?'}
              </span>
              <span className="hidden text-left leading-tight sm:block">
                <span className="block font-medium text-slate-800">{user.full_name}</span>
                <span className="block text-xs text-slate-500">{label(user.role)}</span>
              </span>
            </Link>
            {user.role !== 'APPLICANT' && (
              <Link to="/change-password" className="rounded-md p-2 text-slate-500 hover:bg-slate-100" title="Change password" aria-label="Change password">
                <KeyRound className="h-4 w-4" />
              </Link>
            )}
            <button type="button" onClick={logout} className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
              <LogOut className="h-4 w-4" aria-hidden /> Logout
            </button>
          </div>
        </header>
        <main id="main" className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
        <footer className="border-t border-slate-200 px-6 py-3 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} University of Peradeniya · Academic Establishments Division
        </footer>
      </div>
    </div>
  );
}
