'use client';

import React from 'react';
import { ComposedChart, Area, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Target, Award, ShieldCheck, Clock, UserX } from 'lucide-react';
import { ExportDropdown } from '@/components/DataMobility';

import api from '@/lib/axios';

export default function BusinessAnalyticsPage() {
  const [monthBusiness, setMonthBusiness] = React.useState<any[]>([]);
  const [dynamicInsights, setDynamicInsights] = React.useState([
    { label: 'Lead Conversion Rate', value: '0%', icon: Target },
    { label: 'Top Revenue Insurer', value: 'N/A', icon: Award },
    { label: 'Top Product', value: 'N/A', icon: ShieldCheck },
    { label: 'Pending Renewals', value: '0 Policies', icon: Clock },
    { label: 'Attrition (YTD)', value: '0 Leads', icon: UserX },
  ]);
  const [systemAlert, setSystemAlert] = React.useState<{ diff: number; topRenewalProduct: string } | null>(null);

  React.useEffect(() => {
    async function load() {
      try {
        const [polRes, leadsRes] = await Promise.all([
          api.get('/policies'),
          api.get('/leads')
        ]);

        const policies = polRes.data;
        const leads = leadsRes.data;

        const monthly: Record<string, any> = {};

        // For Insights
        let convertedLeadsCount = 0;
        let attritionYTD = 0;
        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth();
        // Track per-month conversion for MoM alert
        const monthlyConversion: Record<string, { converted: number; total: number }> = {};

        const insurerGWP: Record<string, number> = {};
        const productCount: Record<string, number> = {};
        let pendingRenewals = 0;

        // Process policies
        policies.forEach((p: any) => {
          const d = new Date(p.date);
          const mKey = d.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' }).replace(' ', ' ');
          if (!monthly[mKey]) monthly[mKey] = { month: mKey, policies: 0, gwp: 0, leads: 0 };
          monthly[mKey].policies += 1;
          monthly[mKey].gwp += Number(p.gwp);

          // Insight: Top Revenue Insurer
          const company = p.company || 'Unknown';
          insurerGWP[company] = (insurerGWP[company] || 0) + Number(p.gwp);

          // Insight: Top Product
          const prodType = p.type || 'General';
          productCount[prodType] = (productCount[prodType] || 0) + 1;

          // Insight: Pending Renewals
          // Since mock data endDate is hard to parse uniformly if absent, 
          // we use the backend date + 1 year logic if endDate not available, or just check p.endDate
          let endDate = p.endDate ? new Date(p.endDate) : new Date(d.getTime() + 31536000000);
          const daysLeft = (endDate.getTime() - new Date().getTime()) / (1000 * 3600 * 24);
          if (daysLeft >= 0 && daysLeft <= 60) {
            pendingRenewals++;
          }
        });

        // Process leads
        leads.forEach((l: any) => {
          if (l.status === 'Converted') convertedLeadsCount++;
          if (l.status === 'Lost' && new Date(l.date).getFullYear() === currentYear) attritionYTD++;

          const ld = new Date(l.date);
          const lKey = ld.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' }).replace(' ', ' ');
          if (!monthlyConversion[lKey]) monthlyConversion[lKey] = { converted: 0, total: 0 };
          monthlyConversion[lKey].total++;
          if (l.status === 'Converted') monthlyConversion[lKey].converted++;

          if (l.status !== 'Converted') return;
          const mKey = lKey;
          if (!monthly[mKey]) monthly[mKey] = { month: mKey, policies: 0, gwp: 0, leads: 0 };
          monthly[mKey].leads += 1;
        });

        // Compute MoM conversion change for system alert
        const convMonths = Object.keys(monthlyConversion).sort((a, b) => {
          const [m1, y1] = a.split(' ');
          const [m2, y2] = b.split(' ');
          return new Date(`${m1} 1, 20${y1}`).getTime() - new Date(`${m2} 1, 20${y2}`).getTime();
        });
        if (convMonths.length >= 2) {
          const thisM = monthlyConversion[convMonths[convMonths.length - 1]];
          const prevM = monthlyConversion[convMonths[convMonths.length - 2]];
          const thisRate = thisM.total > 0 ? (thisM.converted / thisM.total) * 100 : 0;
          const prevRate = prevM.total > 0 ? (prevM.converted / prevM.total) * 100 : 0;
          const diff = parseFloat((thisRate - prevRate).toFixed(1));
          // Top renewal product = product with highest pending renewals
          const topRenewalProduct = Object.keys(productCount).length > 0
            ? Object.keys(productCount).reduce((a, b) => productCount[a] > productCount[b] ? a : b)
            : 'General';
          setSystemAlert({ diff, topRenewalProduct });
        }

        // Calculate final insights
        const leadConversionRate = leads.length > 0 ? ((convertedLeadsCount / leads.length) * 100).toFixed(1) + '%' : '0%';
        const topInsurer = Object.keys(insurerGWP).length > 0 ? Object.keys(insurerGWP).reduce((a, b) => insurerGWP[a] > insurerGWP[b] ? a : b) : 'N/A';
        const topProduct = Object.keys(productCount).length > 0 ? Object.keys(productCount).reduce((a, b) => productCount[a] > productCount[b] ? a : b) : 'N/A';

        setDynamicInsights([
          { label: 'Lead Conversion Rate', value: leadConversionRate, icon: Target },
          { label: 'Top Revenue Insurer', value: topInsurer, icon: Award },
          { label: 'Top Product', value: topProduct, icon: ShieldCheck },
          { label: 'Pending Renewals', value: `${pendingRenewals} Policies`, icon: Clock },
          { label: 'Attrition (YTD)', value: `${attritionYTD} Leads`, icon: UserX },
        ]);

        // Sort by actual date
        const sorted = Object.values(monthly).sort((a,b) => {
          const [m1, y1] = a.month.split(' ');
          const [m2, y2] = b.month.split(' ');
          const d1 = new Date(`${m1} 1, 20${y1}`);
          const d2 = new Date(`${m2} 1, 20${y2}`);
          return d1.getTime() - d2.getTime();
        });

        setMonthBusiness(sorted);

      } catch (e) {
        console.error(e);
      }
    }
    load();
  }, []);

  return (
    <div className="container-fluid px-0">
      <div className="mb-4">
        <h1 className="fs-3 fw-bold text-white mb-2" style={{ fontFamily: 'Manrope, sans-serif' }}>Business Analytics</h1>
        <p className="text-muted-custom mb-0" style={{ fontSize: '0.875rem' }}>Macro-level executive summary of portfolio performance.</p>
      </div>

      <div className="row g-3 g-md-4">
        {/* Left — Charts + Table */}
        <div className="col-12 col-xl-8">
          {/* Composed Chart */}
          <div className="dash-card mb-4">
            <p className="fw-bold text-white mb-1" style={{ fontSize: '0.95rem', fontFamily: 'Manrope, sans-serif' }}>GWP vs Policy Volume</p>
            <p className="mb-4 text-muted-custom" style={{ fontSize: '0.75rem' }}>
              Cross-reference of gross written premium and policy count — last 7 months
            </p>
            <div className="chart-container-wrapper">
              <ResponsiveContainer width="100%" height={280} minWidth={0}>
                <ComposedChart data={monthBusiness} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gwpAreaBiz" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#c3c0ff" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(226, 226, 235, 0.05)" vertical={false} />
                  <XAxis dataKey="month" tick={{ fill: '#c7c4d8', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="left" tick={{ fill: '#c7c4d8', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v / 1000}k`} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fill: '#c7c4d8', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: '#282a30', border: 'none', borderRadius: 8, color: '#e2e2eb', fontSize: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}
                    cursor={{ fill: 'rgba(226,226,235,0.04)' }} />
                  <Area yAxisId="left" type="monotone" dataKey="gwp" stroke="#c3c0ff" strokeWidth={3} fill="url(#gwpAreaBiz)" name="Total GWP" />
                  <Bar yAxisId="right" dataKey="policies" barSize={16} fill="#10b981" radius={[4, 4, 0, 0]} name="Policies Written" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Data Table */}
          <div className="dash-card">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <p className="fw-bold text-white mb-0" style={{ fontSize: '0.95rem', fontFamily: 'Manrope, sans-serif' }}>Quarterly Aggregation</p>
              <ExportDropdown 
                data={monthBusiness} 
                filename="Business_Aggregation"
                columns={[
                  { header: 'Month', key: 'month' },
                  { header: 'Policies', key: 'policies' },
                  { header: 'Converted Leads', key: 'leads' },
                  { header: 'Gross Written Premium', key: 'gwp' }
                ]} 
              />
            </div>
            <div className="table-wrapper">
              <table className="table table-custom table-borderless w-100">
                <thead>
                  <tr>
                    {['Month', 'Policies', 'Converted Leads', 'Gross Written Premium'].map((h) => <th key={h}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {monthBusiness.map((row, i) => (
                    <tr key={i}>
                      <td className="fw-medium text-white">{row.month}</td>
                      <td className="font-monospace text-brand">{row.policies}</td>
                      <td className="font-monospace text-brand">{row.leads}</td>
                      <td className="fw-bold text-white">₹{row.gwp.toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right — Insights Panel */}
        <div className="col-12 col-xl-4">
          <div className="dash-card dash-card-elevated h-100">
            <p className="fw-bold text-white mb-1" style={{ fontSize: '0.95rem', fontFamily: 'Manrope, sans-serif' }}>Key Insights</p>
            <p className="mb-4 text-muted-custom" style={{ fontSize: '0.75rem' }}>
              Algorithmic CRM &amp; portfolio metrics
            </p>

            <div className="d-flex flex-column gap-3">
              {dynamicInsights.map(({ label, value, icon: Icon }) => (
                <div key={label} className="d-flex align-items-center gap-3 py-2"
                  style={{ borderBottom: '1px solid rgba(70, 69, 85, 0.15)' }}>
                  <div className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                    style={{ width: 40, height: 40, background: 'rgba(79, 70, 229, 0.1)' }}>
                    <Icon size={18} className="text-brand" />
                  </div>
                  <div className="min-w-0">
                    <p className="mb-0 text-muted-custom" style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600 }}>{label}</p>
                    <p className="fw-bold text-white mb-0" style={{ fontSize: '1rem', fontFamily: 'Manrope, sans-serif' }}>{value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* System alert — dynamic */}
            {systemAlert && (
              <div className="mt-4 p-3 rounded-3" style={{
                background: systemAlert.diff >= 0 ? 'rgba(16, 185, 129, 0.05)' : 'rgba(239, 68, 68, 0.05)',
                border: `1px solid ${systemAlert.diff >= 0 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.15)'}`
              }}>
                <div className="d-flex align-items-center gap-2 mb-2">
                  <span className="rounded-circle" style={{
                    width: 6, height: 6, display: 'inline-block',
                    background: systemAlert.diff >= 0 ? '#10b981' : '#ef4444',
                    animation: 'pulse 2s infinite'
                  }}></span>
                  <p className="mb-0 fw-bold" style={{
                    fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.1em',
                    color: systemAlert.diff >= 0 ? '#10b981' : '#ef4444'
                  }}>{systemAlert.diff >= 0 ? 'Positive Signal' : 'System Alert'}</p>
                </div>
                <p className="mb-0" style={{ fontSize: '0.8rem', color: '#e2e2eb', lineHeight: 1.6 }}>
                  Conversion ratio MoM:{' '}
                  <span className="fw-semibold" style={{ color: systemAlert.diff >= 0 ? '#10b981' : '#ef4444' }}>
                    {systemAlert.diff >= 0 ? `+${systemAlert.diff}%` : `${systemAlert.diff}%`}
                  </span>.
                  {systemAlert.diff < 0
                    ? ` Recommendation: initiate follow-up for pending ${systemAlert.topRenewalProduct} renewals.`
                    : ` Portfolio momentum is positive. Keep nurturing ${systemAlert.topRenewalProduct} leads.`
                  }
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
