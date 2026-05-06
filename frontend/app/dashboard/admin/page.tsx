'use client';

import React from 'react';
import Link from 'next/link';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Database,
  Download,
  FileText,
  Package,
  RefreshCcw,
  Server,
  Settings2,
  Shield,
  Users,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/axios';

type HealthState = {
  status?: string;
  db?: string;
  message?: string;
};

type PolicyRecord = {
  id: number;
  status?: string;
  endDate?: string;
  end_date?: string;
  gwp?: number | string;
  holder?: string;
  number?: string;
  date?: string;
  startDate?: string;
};

type LeadRecord = {
  id: number;
  status?: string;
  name?: string;
  product?: string;
  date?: string;
};

type ProductRecord = {
  id: number;
  name?: string;
  description?: string;
  created_at?: string;
};

type EventRecord = {
  id: string;
  title: string;
  detail: string;
  when: string;
  status: string;
};

type SummaryItem = {
  label: string;
  value: string;
  detail: string;
  icon: React.ElementType;
  tone: 'brand' | 'success' | 'warning' | 'danger';
};

type QuickAction = {
  title: string;
  description: string;
  href?: string;
  icon: React.ElementType;
  tone: 'brand' | 'success' | 'warning' | 'muted';
  onClick?: () => void;
};

const toneStyles = {
  brand: { background: 'rgba(79, 70, 229, 0.12)', color: '#c3c0ff' },
  success: { background: 'rgba(16, 185, 129, 0.12)', color: '#34d399' },
  warning: { background: 'rgba(245, 158, 11, 0.12)', color: '#fbbf24' },
  danger: { background: 'rgba(239, 68, 68, 0.12)', color: '#f87171' },
  muted: { background: 'rgba(226, 226, 235, 0.06)', color: '#e2e2eb' },
} as const;

const formatCurrency = (value: number) => `₹${value.toLocaleString('en-IN')}`;

const formatDateTime = (value: Date) =>
  value.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

export default function AdminPanelPage() {
  const { user } = useAuth();
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [hostName, setHostName] = React.useState('localhost');
  const [health, setHealth] = React.useState<HealthState>({});
  const [healthResponseMs, setHealthResponseMs] = React.useState<number | null>(null);
  const [lastSynced, setLastSynced] = React.useState<string>('');
  const [summary, setSummary] = React.useState({
    policies: 0,
    activePolicies: 0,
    leads: 0,
    openLeads: 0,
    convertedLeads: 0,
    products: 0,
    renewalsDue: 0,
    totalGwp: 0,
  });
  const [recentEvents, setRecentEvents] = React.useState<EventRecord[]>([]);

  const isAdmin = user?.role === 'admin';
  const isTunnelHost = hostName !== 'localhost' && hostName !== '127.0.0.1';

  const loadAdminData = React.useCallback(async () => {
    setRefreshing(true);
    try {
      const healthStart = performance.now();
      const healthResponse = await api.get('/health');
      setHealthResponseMs(Math.round(performance.now() - healthStart));

      const [policiesResponse, leadsResponse, productsResponse] = await Promise.all([
        api.get('/policies'),
        api.get('/leads'),
        api.get('/products'),
      ]);

      const policies = (policiesResponse.data || []) as PolicyRecord[];
      const leads = (leadsResponse.data || []) as LeadRecord[];
      const products = (productsResponse.data || []) as ProductRecord[];

      const activePolicies = policies.filter((policy) => String(policy.status || '').toLowerCase() === 'active').length;
      const openLeads = leads.filter((lead) => String(lead.status || '').toLowerCase() === 'open').length;
      const convertedLeads = leads.filter((lead) => String(lead.status || '').toLowerCase() === 'converted').length;
      const renewalsDue = policies.filter((policy) => {
        if (String(policy.status || '').toLowerCase() !== 'active') return false;
        const endDate = policy.endDate || policy.end_date;
        if (!endDate) return false;
        const parsedEndDate = new Date(endDate);
        if (Number.isNaN(parsedEndDate.getTime())) return false;
        const daysLeft = (parsedEndDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
        return daysLeft >= 0 && daysLeft <= 30;
      }).length;

      const totalGwp = policies.reduce((total: number, policy) => total + Number(policy.gwp || 0), 0);

      setHealth(healthResponse.data || {});
      setSummary({
        policies: policies.length,
        activePolicies,
        leads: leads.length,
        openLeads,
        convertedLeads,
        products: products.length,
        renewalsDue,
        totalGwp,
      });

      const mergedEvents = [
        ...policies.slice(0, 3).map((policy) => ({
          id: `policy-${policy.id}`,
          title: 'Policy updated',
          detail: `${policy.holder || 'Policy holder'} · ${policy.number || 'No policy number'}`,
          when: policy.date || policy.startDate || new Date().toISOString(),
          status: String(policy.status || 'Active'),
        })),
        ...leads.slice(0, 3).map((lead) => ({
          id: `lead-${lead.id}`,
          title: 'Lead activity',
          detail: `${lead.name || 'Lead'} · ${lead.product || 'General'}`,
          when: lead.date || new Date().toISOString(),
          status: String(lead.status || 'Open'),
        })),
      ]
        .sort((a, b) => new Date(String(b.when)).getTime() - new Date(String(a.when)).getTime())
        .slice(0, 6)
        .map((event) => ({
          ...event,
          when: formatDateTime(new Date(event.when)),
        }));

      setRecentEvents(mergedEvents);
      setLastSynced(formatDateTime(new Date()));
    } catch (error) {
      console.error('Failed to load admin data:', error);
      setHealth({ status: 'DOWN', db: 'unknown', message: 'Unable to load system health right now.' });
      setSummary({
        policies: 0,
        activePolicies: 0,
        leads: 0,
        openLeads: 0,
        convertedLeads: 0,
        products: 0,
        renewalsDue: 0,
        totalGwp: 0,
      });
      setRecentEvents([]);
      setLastSynced(formatDateTime(new Date()));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  React.useEffect(() => {
    setHostName(window.location.hostname || 'localhost');
  }, []);

  React.useEffect(() => {
    if (isAdmin) {
      loadAdminData();
    }
  }, [isAdmin, loadAdminData]);

  const downloadSnapshot = React.useCallback(() => {
    const snapshot = {
      generatedAt: new Date().toISOString(),
      host: hostName,
      tunnelActive: isTunnelHost,
      user: {
        name: user?.name ?? 'Unknown',
        email: user?.email ?? 'Unknown',
        role: user?.role ?? 'unknown',
      },
      health,
      summary,
      lastSynced,
    };

    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'insureflow-admin-snapshot.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [health, hostName, isTunnelHost, lastSynced, summary, user]);

  const summaryCards: SummaryItem[] = [
    {
      label: 'Policies managed',
      value: summary.policies.toString(),
      detail: `${summary.activePolicies} active records`,
      icon: FileText,
      tone: 'brand',
    },
    {
      label: 'Lead pipeline',
      value: summary.leads.toString(),
      detail: `${summary.convertedLeads} converted`,
      icon: Users,
      tone: 'success',
    },
    {
      label: 'Products catalog',
      value: summary.products.toString(),
      detail: 'Master product list',
      icon: Package,
      tone: 'warning',
    },
    {
      label: 'Renewals due',
      value: summary.renewalsDue.toString(),
      detail: 'Next 30 days',
      icon: Clock,
      tone: 'danger',
    },
    {
      label: 'Total premium',
      value: formatCurrency(summary.totalGwp),
      detail: 'Portfolio gross written premium',
      icon: Activity,
      tone: 'brand',
    },
    {
      label: 'Access mode',
      value: isTunnelHost ? 'Cloudflare tunnel' : 'Local network',
      detail: lastSynced ? `Synced ${lastSynced}` : 'Waiting for sync',
      icon: Shield,
      tone: 'success',
    },
  ];

  const quickActions: QuickAction[] = [
    {
      title: 'Open business intake',
      description: 'Create or review policy records.',
      href: '/dashboard/new-business',
      icon: FileText,
      tone: 'brand',
    },
    {
      title: 'Review lead pipeline',
      description: 'Track open, converted, and lost leads.',
      href: '/dashboard/leads',
      icon: Users,
      tone: 'success',
    },
    {
      title: 'Manage products',
      description: 'Keep insurance offerings current.',
      href: '/dashboard/products',
      icon: Package,
      tone: 'warning',
    },
    {
      title: 'Check health again',
      description: 'Refresh API and database status.',
      icon: RefreshCcw,
      tone: 'muted',
      onClick: loadAdminData,
    },
    {
      title: 'Export admin snapshot',
      description: 'Download the current operational summary.',
      icon: Download,
      tone: 'muted',
      onClick: downloadSnapshot,
    },
    {
      title: 'Manage users',
      description: 'Promote, deactivate, or review access.',
      href: '/dashboard/admin/users',
      icon: Users,
      tone: 'brand',
    },
    {
      title: 'Edit settings',
      description: 'Update operational and system defaults.',
      href: '/dashboard/admin/settings',
      icon: Settings2,
      tone: 'warning',
    },
    {
      title: 'View audit logs',
      description: 'Review tracked admin actions.',
      href: '/dashboard/admin/audit',
      icon: Clock,
      tone: 'success',
    },
  ];

  if (!isAdmin) {
    return (
      <div className="dash-card" style={{ maxWidth: 720, margin: '2rem auto' }}>
        <div className="d-flex align-items-center gap-3 mb-3">
          <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: 48, height: 48, background: 'rgba(239, 68, 68, 0.12)', color: '#f87171' }}>
            <AlertTriangle size={22} />
          </div>
          <div>
            <p className="fs-4 fw-bold text-white mb-0" style={{ fontFamily: 'Manrope, sans-serif' }}>Admin access required</p>
            <p className="text-muted-custom mb-0" style={{ fontSize: '0.85rem' }}>This panel is restricted to users with the admin role.</p>
          </div>
        </div>
        <Link href="/dashboard" className="btn btn-sm" style={{ background: '#4F46E5', color: '#fff', fontWeight: 600 }}>
          Back to dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="container-fluid px-0">
      <div
        className="dash-card mb-4"
        style={{
          background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.22), rgba(30, 31, 38, 0.96))',
          border: '1px solid rgba(195, 192, 255, 0.12)',
        }}
      >
        <div className="d-flex flex-column flex-xl-row justify-content-between gap-4 align-items-xl-center">
          <div>
            <div className="d-inline-flex align-items-center gap-2 px-3 py-2 rounded-pill mb-3" style={{ background: 'rgba(226, 226, 235, 0.08)' }}>
              <Settings2 size={14} className="text-brand" />
              <span style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#c7c4d8' }}>Administration</span>
            </div>
            <h1 className="fs-3 fw-bold text-white mb-2" style={{ fontFamily: 'Manrope, sans-serif' }}>Admin Panel</h1>
            <p className="text-muted-custom mb-0" style={{ fontSize: '0.9rem', maxWidth: 760 }}>
              Monitor website health, keep the operating summary current, and move quickly into the parts of the platform that need attention.
            </p>
          </div>
          <div className="d-flex flex-wrap gap-2">
            <button
              type="button"
              onClick={loadAdminData}
              className="btn btn-sm d-inline-flex align-items-center gap-2"
              style={{ background: '#4F46E5', color: '#fff', fontWeight: 600 }}
              disabled={refreshing}
            >
              <RefreshCcw size={14} className={refreshing ? 'spin-animate' : ''} />
              {refreshing ? 'Refreshing…' : 'Refresh data'}
            </button>
            <button
              type="button"
              onClick={downloadSnapshot}
              className="btn btn-sm d-inline-flex align-items-center gap-2"
              style={{ background: 'rgba(226, 226, 235, 0.08)', color: '#e2e2eb', border: '1px solid rgba(226, 226, 235, 0.08)', fontWeight: 600 }}
            >
              <Download size={14} />
              Export snapshot
            </button>
          </div>
        </div>
      </div>

      <div className="row g-3 g-md-4 mb-4">
        {summaryCards.map(({ label, value, detail, icon: Icon, tone }) => (
          <div key={label} className="col-12 col-sm-6 col-xl-4">
            <div className="dash-card h-100">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: 46, height: 46, ...toneStyles[tone] }}>
                  <Icon size={20} />
                </div>
                <span className="stat-badge" style={{ background: 'rgba(226, 226, 235, 0.06)', color: '#c7c4d8' }}>{label}</span>
              </div>
              <p className="fs-3 fw-bold text-white mb-1" style={{ fontFamily: 'Manrope, sans-serif' }}>{loading ? '—' : value}</p>
              <p className="mb-0 text-muted-custom" style={{ fontSize: '0.78rem' }}>{detail}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="row g-3 g-md-4 mb-4">
        <div className="col-12 col-xl-7">
          <div className="dash-card h-100">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <div>
                <p className="fw-bold text-white mb-1" style={{ fontSize: '0.95rem', fontFamily: 'Manrope, sans-serif' }}>Website Health</p>
                <p className="mb-0 text-muted-custom" style={{ fontSize: '0.75rem' }}>Live API and database status for the full system.</p>
              </div>
              <span className={`stat-badge ${health.status === 'UP' ? 'bg-success bg-opacity-10 text-success' : 'bg-danger bg-opacity-10 text-danger'}`}>
                {health.status === 'UP' ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}
                {health.status === 'UP' ? 'Operational' : 'Attention'}
              </span>
            </div>

            <div className="row g-3 mt-1">
              <div className="col-12 col-md-4">
                <div className="dash-card dash-card-elevated h-100">
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <Server size={16} className="text-brand" />
                    <span className="text-muted-custom" style={{ fontSize: '0.75rem', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 700 }}>API</span>
                  </div>
                  <p className="fw-bold text-white mb-1">{health.status || 'Unknown'}</p>
                  <p className="mb-0 text-muted-custom" style={{ fontSize: '0.75rem' }}>{health.message || 'Health check pending'}</p>
                </div>
              </div>
              <div className="col-12 col-md-4">
                <div className="dash-card dash-card-elevated h-100">
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <Database size={16} className="text-brand" />
                    <span className="text-muted-custom" style={{ fontSize: '0.75rem', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 700 }}>Database</span>
                  </div>
                  <p className="fw-bold text-white mb-1">{health.db || 'Unknown'}</p>
                  <p className="mb-0 text-muted-custom" style={{ fontSize: '0.75rem' }}>Backend data store connection</p>
                </div>
              </div>
              <div className="col-12 col-md-4">
                <div className="dash-card dash-card-elevated h-100">
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <Activity size={16} className="text-brand" />
                    <span className="text-muted-custom" style={{ fontSize: '0.75rem', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 700 }}>Latency</span>
                  </div>
                  <p className="fw-bold text-white mb-1">{healthResponseMs !== null ? `${healthResponseMs} ms` : '—'}</p>
                  <p className="mb-0 text-muted-custom" style={{ fontSize: '0.75rem' }}>Measured against the health endpoint</p>
                </div>
              </div>
            </div>

            <div className="row g-3 mt-1">
              <div className="col-12 col-md-6">
                <div className="dash-card dash-card-elevated h-100">
                  <p className="text-muted-custom mb-1" style={{ fontSize: '0.72rem', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 700 }}>Access mode</p>
                  <p className="fw-bold text-white mb-0">{isTunnelHost ? 'Cloudflare tunnel' : 'Local development'}</p>
                </div>
              </div>
              <div className="col-12 col-md-6">
                <div className="dash-card dash-card-elevated h-100">
                  <p className="text-muted-custom mb-1" style={{ fontSize: '0.72rem', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 700 }}>Checked at</p>
                  <p className="fw-bold text-white mb-0">{lastSynced || 'Waiting for refresh'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-xl-5">
          <div className="dash-card h-100">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <div>
                <p className="fw-bold text-white mb-1" style={{ fontSize: '0.95rem', fontFamily: 'Manrope, sans-serif' }}>Admin Functions</p>
                <p className="mb-0 text-muted-custom" style={{ fontSize: '0.75rem' }}>Common operator actions and fast navigation.</p>
              </div>
            </div>

            <div className="d-grid gap-2">
              {quickActions.map((action) => {
                const buttonStyle = {
                  background: toneStyles[action.tone].background,
                  color: toneStyles[action.tone].color,
                  border: '1px solid rgba(226, 226, 235, 0.08)',
                } as const;

                const content = (
                  <>
                    <div className="d-flex align-items-center gap-3">
                      <div className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: 40, height: 40, ...toneStyles[action.tone] }}>
                        <action.icon size={18} />
                      </div>
                      <div className="text-start">
                        <div className="fw-semibold text-white" style={{ fontSize: '0.9rem' }}>{action.title}</div>
                        <div className="text-muted-custom" style={{ fontSize: '0.75rem' }}>{action.description}</div>
                      </div>
                    </div>
                    <ArrowRight size={16} className="ms-auto flex-shrink-0" />
                  </>
                );

                if (action.href) {
                  return (
                    <Link key={action.title} href={action.href} className="d-flex align-items-center gap-3 rounded-3 p-3 text-decoration-none" style={buttonStyle}>
                      {content}
                    </Link>
                  );
                }

                return (
                  <button key={action.title} type="button" onClick={action.onClick} className="d-flex align-items-center gap-3 rounded-3 p-3 text-start" style={buttonStyle}>
                    {content}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="row g-3 g-md-4">
        <div className="col-12 col-xl-7">
          <div className="dash-card h-100">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <div>
                <p className="fw-bold text-white mb-1" style={{ fontSize: '0.95rem', fontFamily: 'Manrope, sans-serif' }}>Operational Summary</p>
                <p className="mb-0 text-muted-custom" style={{ fontSize: '0.75rem' }}>A quick read on what the system is doing right now.</p>
              </div>
            </div>

            <div className="row g-3">
              <div className="col-12 col-sm-6">
                <div className="dash-card dash-card-elevated h-100">
                  <p className="text-muted-custom mb-1" style={{ fontSize: '0.72rem', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 700 }}>Lead conversion rate</p>
                  <p className="fs-3 fw-bold text-white mb-1" style={{ fontFamily: 'Manrope, sans-serif' }}>
                    {summary.leads ? `${Math.round((summary.convertedLeads / summary.leads) * 100)}%` : '0%'}
                  </p>
                  <p className="mb-0 text-muted-custom" style={{ fontSize: '0.75rem' }}>Converted leads out of total lead volume</p>
                </div>
              </div>
              <div className="col-12 col-sm-6">
                <div className="dash-card dash-card-elevated h-100">
                  <p className="text-muted-custom mb-1" style={{ fontSize: '0.72rem', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 700 }}>Portfolio coverage</p>
                  <p className="fs-3 fw-bold text-white mb-1" style={{ fontFamily: 'Manrope, sans-serif' }}>{summary.activePolicies} active</p>
                  <p className="mb-0 text-muted-custom" style={{ fontSize: '0.75rem' }}>Policies currently written and active</p>
                </div>
              </div>
            </div>

            <div className="row g-3 mt-1">
              <div className="col-12 col-sm-6">
                <div className="dash-card dash-card-elevated h-100">
                  <p className="text-muted-custom mb-1" style={{ fontSize: '0.72rem', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 700 }}>System role</p>
                  <p className="fw-bold text-white mb-0">{user?.role ?? 'Unknown'}</p>
                </div>
              </div>
              <div className="col-12 col-sm-6">
                <div className="dash-card dash-card-elevated h-100">
                  <p className="text-muted-custom mb-1" style={{ fontSize: '0.72rem', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 700 }}>Signed in as</p>
                  <p className="fw-bold text-white mb-0 text-truncate">{user?.email ?? 'Unknown'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-xl-5">
          <div className="dash-card h-100">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <div>
                <p className="fw-bold text-white mb-1" style={{ fontSize: '0.95rem', fontFamily: 'Manrope, sans-serif' }}>Recent Activity</p>
                <p className="mb-0 text-muted-custom" style={{ fontSize: '0.75rem' }}>Latest policy and lead updates pulled from the backend.</p>
              </div>
            </div>

            <div className="d-grid gap-2">
              {recentEvents.length === 0 ? (
                <div className="dash-card dash-card-elevated text-center py-4">
                  <p className="fw-semibold text-white mb-1">No recent activity yet</p>
                  <p className="mb-0 text-muted-custom" style={{ fontSize: '0.75rem' }}>Refresh the data to pull the latest records.</p>
                </div>
              ) : (
                recentEvents.map((event) => (
                  <div key={event.id} className="dash-card dash-card-elevated d-flex align-items-start gap-3">
                    <div className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: 40, height: 40, background: 'rgba(79, 70, 229, 0.12)', color: '#c3c0ff' }}>
                      <Clock size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className="fw-semibold text-white mb-1">{event.title}</p>
                      <p className="mb-1 text-muted-custom text-truncate" style={{ fontSize: '0.75rem' }}>{event.detail}</p>
                      <div className="d-flex align-items-center gap-2">
                        <span className="stat-badge bg-brand bg-opacity-10 text-brand">{event.status}</span>
                        <span className="text-muted-custom" style={{ fontSize: '0.7rem' }}>{event.when}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
