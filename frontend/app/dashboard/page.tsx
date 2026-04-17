'use client';

import React from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import { TrendingUp, TrendingDown, FileText, DollarSign, Briefcase, Activity } from 'lucide-react';
import { ExportDropdown } from '@/components/DataMobility';

const gwpTrend = [
  { month: 'Oct', gwp: 420000 }, { month: 'Nov', gwp: 510000 }, { month: 'Dec', gwp: 480000 },
  { month: 'Jan', gwp: 620000 }, { month: 'Feb', gwp: 590000 }, { month: 'Mar', gwp: 710000 },
  { month: 'Apr', gwp: 780000 },
];
const productMix = [
  { name: 'Motor', value: 38, color: '#c3c0ff' }, // primary
  { name: 'Health', value: 29, color: '#4F46E5' }, // primary_container
  { name: 'Life', value: 21, color: '#413f82' }, // secondary_container
  { name: 'General', value: 12, color: '#ffb695' }, // tertiary
];
const recentActivity = [
  { id: 'POL-2025-1084', holder: 'Ramesh Patil', type: 'Motor', gwp: '₹18,500', status: 'Active' },
  { id: 'POL-2025-1083', holder: 'Sneha Desai', type: 'Health', gwp: '₹24,200', status: 'Active' },
  { id: 'POL-2025-1082', holder: 'Arjun Mehta', type: 'Life', gwp: '₹55,000', status: 'Active' },
  { id: 'POL-2025-1081', holder: 'Priya Sharma', type: 'Motor', gwp: '₹12,800', status: 'Pending' },
];

function MetricCard({ label, value, sub, icon: Icon, trend, trendVal }: any) {
  return (
    <div className="dash-card h-100 d-flex flex-column">
      <div className="d-flex justify-content-between align-items-start mb-3">
        <div className="rounded-circle d-flex align-items-center justify-content-center"
          style={{ background: '#191b22', width: 44, height: 44 }}>
          <Icon size={20} className="text-brand" />
        </div>
        {trend && (
          <span className={`stat-badge ${trend === 'up' ? 'bg-success bg-opacity-10 text-success' : 'bg-danger bg-opacity-10 text-danger'}`}>
            {trend === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {trendVal}
          </span>
        )}
      </div>
      <p className="fs-3 fw-bold text-white mb-1" style={{ fontFamily: 'Manrope, sans-serif' }}>{value}</p>
      <p className="mb-1 text-muted-custom" style={{ fontSize: '0.8rem', fontWeight: 500 }}>{label}</p>
      {sub && <p className="mb-0 mt-auto" style={{ fontSize: '0.7rem', color: '#464555' }}>{sub}</p>}
    </div>
  );
}

const RADIAN = Math.PI / 180;
const PieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  if (percent < 0.1) return null;
  const r = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + r * Math.cos(-midAngle * RADIAN);
  const y = cy + r * Math.sin(-midAngle * RADIAN);
  return <text x={x} y={y} fill="#e2e2eb" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>{`${(percent * 100).toFixed(0)}%`}</text>;
};

export default function DashboardHome() {
  return (
    <div className="container-fluid px-0">
      {/* Page header */}
      <div className="mb-4">
        <h1 className="fs-3 fw-bold text-white mb-2" style={{ fontFamily: 'Manrope, sans-serif' }}>Dashboard Overview</h1>
        <p className="text-muted-custom mb-0" style={{ fontSize: '0.875rem' }}>Welcome back! Here's your insurance portfolio at a glance.</p>
      </div>

      {/* KPI Cards */}
      <div className="row g-3 g-md-4 mb-4">
        <div className="col-12 col-sm-6 col-xl-3">
          <MetricCard label="New Business (This Month)" value="₹7.8L" sub="48 policies written" icon={Briefcase} trend="up" trendVal="+12%" />
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <MetricCard label="Total Business Till Date" value="₹51.2L" sub="Since Apr 2024" icon={Activity} trend="up" trendVal="+8.4%" />
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <MetricCard label="Policies Issued" value="1,284" sub="All time" icon={FileText} trend="up" trendVal="+24" />
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <MetricCard label="Total GWP" value="₹51.2L" sub="April 2024 – 2025" icon={DollarSign} trend="up" trendVal="+9.1%" />
        </div>
      </div>

      {/* Charts Row */}
      <div className="row g-3 g-md-4 mb-4 flex-wrap">
        {/* Area Chart */}
        <div className="col-12 col-lg-8">
          <div className="dash-card h-100">
            <p className="fw-bold text-white mb-1" style={{ fontSize: '0.95rem', fontFamily: 'Manrope, sans-serif' }}>GWP Trend</p>
            <p className="mb-4 text-muted-custom" style={{ fontSize: '0.75rem' }}>Monthly Gross Written Premium trajectory</p>
            <div className="chart-container-wrapper">
              <ResponsiveContainer width="100%" height={260} minWidth={0}>
                <AreaChart data={gwpTrend} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gwpGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#c3c0ff" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(226, 226, 235, 0.05)" vertical={false} />
                  <XAxis dataKey="month" tick={{ fill: '#c7c4d8', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#c7c4d8', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v / 1000}k`} />
                  <Tooltip contentStyle={{ background: '#282a30', border: 'none', borderRadius: 8, color: '#e2e2eb', fontSize: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}
                    formatter={(v: unknown) => [`₹${(v as number).toLocaleString('en-IN')}`, 'GWP']} />
                  <Area type="monotone" dataKey="gwp" stroke="#c3c0ff" strokeWidth={3} fill="url(#gwpGrad)"
                    dot={{ r: 0 }} activeDot={{ r: 6, fill: '#fff', stroke: '#4F46E5', strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="col-12 col-lg-4">
          <div className="dash-card h-100 d-flex flex-column">
            <p className="fw-bold text-white mb-1" style={{ fontSize: '0.95rem', fontFamily: 'Manrope, sans-serif' }}>Product Mix</p>
            <p className="mb-2 text-muted-custom" style={{ fontSize: '0.75rem' }}>Portfolio distribution</p>
            <div className="flex-grow-1 d-flex align-items-center justify-content-center chart-container-wrapper">
              <ResponsiveContainer width="100%" height={200} minWidth={0}>
                <PieChart>
                  <Pie data={productMix} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                    strokeWidth={4} stroke="#1e1f26" dataKey="value"
                    labelLine={false} label={<PieLabel />}>
                    {productMix.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#282a30', border: 'none', borderRadius: 8, color: '#e2e2eb', fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="row g-2 mt-2">
              {productMix.map((p) => (
                <div key={p.name} className="col-6">
                  <div className="d-flex align-items-center gap-2">
                    <span className="rounded-circle flex-shrink-0" style={{ width: 10, height: 10, background: p.color }} />
                    <span className="text-muted-custom text-truncate" style={{ fontSize: '0.75rem' }}>{p.name}</span>
                    <span className="ms-auto fw-bold text-white" style={{ fontSize: '0.75rem' }}>{p.value}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Policies Table */}
      <div className="dash-card">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <p className="fw-bold text-white mb-0" style={{ fontSize: '0.95rem', fontFamily: 'Manrope, sans-serif' }}>Recent Policies</p>
          <ExportDropdown 
            data={recentActivity} 
            filename="Overview_Recent_Policies"
            columns={[
              { header: 'Policy No.', key: 'id' },
              { header: 'Holder', key: 'holder' },
              { header: 'Product', key: 'type' },
              { header: 'GWP', key: 'gwp' },
              { header: 'Status', key: 'status' }
            ]} 
          />
        </div>
        <div className="table-wrapper">
          <table className="table table-custom table-borderless w-100">
            <thead>
              <tr>
                <th>Policy No.</th><th>Holder</th><th>Product</th><th>GWP</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentActivity.map((row, i) => (
                <tr key={i}>
                  <td><span className="text-brand fw-semibold">{row.id}</span></td>
                  <td className="fw-medium text-white">{row.holder}</td>
                  <td className="text-muted-custom">{row.type}</td>
                  <td className="fw-bold text-white">{row.gwp}</td>
                  <td>
                    <span className={`stat-badge ${row.status === 'Active' ? 'bg-success bg-opacity-10 text-success' : 'bg-warning bg-opacity-10 text-warning'}`}>
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
