'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, FilePlus, RefreshCcw, Clock,
  Users, BarChart3, Menu, X, Shield, LogOut, Package, Settings2
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const navItems = [
  { href: '/dashboard',                   label: 'Dashboard',          icon: LayoutDashboard },
  { href: '/dashboard/new-business',      label: 'Business',           icon: FilePlus },
  { href: '/dashboard/renewal',           label: 'Renewals',           icon: RefreshCcw },
  { href: '/dashboard/upcoming-renewals', label: 'Upcoming Renewals',  icon: Clock },
  { href: '/dashboard/leads',             label: 'Leads',              icon: Users },
  { href: '/dashboard/business',          label: 'Business Analytics', icon: BarChart3 },
  { href: '/dashboard/products',          label: 'Products',           icon: Package },
  { href: '/dashboard/admin',             label: 'Admin Panel',        icon: Settings2, adminOnly: true },
  { href: '/dashboard/admin/users',       label: 'Admin Users',        icon: Users, adminOnly: true },
  { href: '/dashboard/admin/settings',    label: 'Admin Settings',     icon: Settings2, adminOnly: true },
  { href: '/dashboard/admin/audit',       label: 'Audit Logs',         icon: Clock, adminOnly: true },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading, logout } = useAuth();

  const agentNavItems = navItems.filter((item) => !item.adminOnly);
  const adminNavItems = navItems.filter((item) => item.adminOnly);
  const visibleNavItems = user?.role === 'admin' ? adminNavItems : agentNavItems;
  const activeNavItem = visibleNavItems
    .filter((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0];
  const pageTitle = activeNavItem?.label ?? 'Dashboard';

  // Auth guard – redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      const token = localStorage.getItem('insureflow_token');
      if (!token) {
        router.replace('/login');
      }
    }
  }, [isLoading, user, router]);

  useEffect(() => {
    if (!isLoading && user) {
      // Prevent agents from accessing admin pages
      if (pathname.startsWith('/dashboard/admin') && user.role !== 'admin') {
        router.replace('/dashboard');
        return;
      }
      // Prevent admins from accessing agent pages
      if (user.role === 'admin' && !pathname.startsWith('/dashboard/admin')) {
        router.replace('/dashboard/admin');
        return;
      }
    }
  }, [isLoading, pathname, router, user]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  // Derive initials and display name from user
  const displayName = user?.name ?? 'User';
  const initials = displayName
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  // Show loading spinner while auth rehydrates
  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#111319' }}>
        <div style={{ textAlign: 'center', color: '#c3c0ff' }}>
          <Shield size={36} />
          <p style={{ marginTop: '12px', fontSize: '0.85rem', color: '#c7c4d8' }}>Loading…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="layout-shell">

      {/* ── Mobile overlay ── */}
      {open && (
        <div
          className="sidebar-overlay visible"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Sidebar ── */}
      <aside className={`sidebar${open ? ' open' : ''}`}>

        {/* Logo row */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <Shield size={18} />
          </div>
          <div style={{ minWidth: 0 }}>
            <p className="mb-0 fw-bold text-white" style={{ fontSize: '0.875rem', lineHeight: 1.2 }}>InsureFlow</p>
            <p className="mb-0" style={{ fontSize: '0.6rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(240,242,255,0.35)' }}>
              Management Suite
            </p>
          </div>
          {/* Close button — mobile only */}
          <button
            className="btn p-1 ms-auto d-lg-none"
            style={{ color: 'rgba(240,242,255,0.5)', lineHeight: 1 }}
            onClick={() => setOpen(false)}
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          <p className="nav-section-label">Main Menu</p>
          {visibleNavItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`sidebar-link${pathname === href || pathname.startsWith(`${href}/`) ? ' active' : ''}`}
              onClick={() => setOpen(false)}
            >
              <Icon size={16} />
              {label}
            </Link>
          ))}
        </nav>

        {/* Sidebar footer — Logout */}
        <div style={{ padding: '0.75rem 0.6rem', borderTop: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
          <button
            id="sidebar-logout-btn"
            onClick={handleLogout}
            className="sidebar-link"
            style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', textAlign: 'left' }}
          >
            <LogOut size={16} />
            Logout
          </button>
          <p className="mb-0 mt-1" style={{ fontSize: '0.65rem', color: 'rgba(240,242,255,0.2)', paddingLeft: '0.75rem' }}>
            © 2025 InsureFlow · v1.0
          </p>
        </div>
      </aside>

      {/* ── Main area ── */}
      <div className="main-area">

        {/* Topbar */}
        <header className="topbar">
          {/* Hamburger — mobile only */}
          <button
            className="btn p-1 d-lg-none me-1"
            style={{ color: 'rgba(240,242,255,0.7)', lineHeight: 1 }}
            onClick={() => setOpen(true)}
            aria-label="Open sidebar"
          >
            <Menu size={22} />
          </button>

          <span className="fw-semibold text-white" style={{ fontSize: '0.9rem' }}>
            {pageTitle}
          </span>

          <div className="ms-auto d-flex align-items-center gap-3">
            <div style={{ textAlign: 'right' }} className="d-none d-sm-block">
              <p className="mb-0" style={{ fontSize: '0.78rem', color: 'rgba(240,242,255,0.7)', lineHeight: 1.2 }}>{displayName}</p>
              <p className="mb-0" style={{ fontSize: '0.67rem', color: 'rgba(240,242,255,0.35)', textTransform: 'capitalize' }}>{user?.role ?? ''}</p>
            </div>
            <div className="topbar-avatar" title={displayName}>{initials}</div>
          </div>
        </header>

        {/* Page content */}
        <main className="page-content">
          {children}
        </main>
      </div>
    </div>
  );
}
