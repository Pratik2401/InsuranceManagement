'use client';

import React from 'react';
import { ComposedChart, Area, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Target, Award, ShieldCheck, Clock, UserX } from 'lucide-react';
import { ExportDropdown } from '@/components/DataMobility';

const monthBusiness = [
  { month: 'Oct 24', policies: 145, gwp: 1250000, leads: 40 },
  { month: 'Nov 24', policies: 160, gwp: 1420000, leads: 52 },
  { month: 'Dec 24', policies: 135, gwp: 1180000, leads: 45 },
  { month: 'Jan 25', policies: 180, gwp: 1650000, leads: 65 },
  { month: 'Feb 25', policies: 175, gwp: 1590000, leads: 60 },
  { month: 'Mar 25', policies: 210, gwp: 1950000, leads: 82 },
  { month: 'Apr 25', policies: 195, gwp: 1880000, leads: 75 },
];

const insights = [
  { label: 'Lead Conversion Rate', value: '38.5%', icon: Target },
  { label: 'Top Revenue Insurer', value: 'HDFC ERGO', icon: Award },
  { label: 'Top Product', value: 'Motor Comprehensive', icon: ShieldCheck },
  { label: 'Pending Renewals', value: '42 Policies', icon: Clock },
  { label: 'Attrition (YTD)', value: '156 Leads', icon: UserX },
];

export default function BusinessAnalyticsPage() {
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
              {insights.map(({ label, value, icon: Icon }) => (
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

            {/* System alert */}
            <div className="mt-4 p-3 rounded-3" style={{ background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.15)' }}>
              <div className="d-flex align-items-center gap-2 mb-2">
                <span className="rounded-circle bg-danger" style={{ width: 6, height: 6, display: 'inline-block', animation: 'pulse 2s infinite' }}></span>
                <p className="mb-0 fw-bold text-danger" style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>System Alert</p>
              </div>
              <p className="mb-0" style={{ fontSize: '0.8rem', color: '#e2e2eb', lineHeight: 1.6 }}>
                Conversion ratio variance detected: <span className="text-danger fw-semibold">−1.2% MoM</span>. Recommendation: initiate follow-up for pending motor renewals.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
