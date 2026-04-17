'use client';

import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { RefreshCcw, DollarSign, TrendingUp, Building2, Search, ChevronsUpDown, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { ExportDropdown } from '@/components/DataMobility';

const monthlyRenewal = { count: 87, gwp: 942000 };
const tillDate = { count: 634, gwp: 6850000 };

const monthTrend = [
  { month: 'Oct', count: 60 }, { month: 'Nov', count: 72 }, { month: 'Dec', count: 65 },
  { month: 'Jan', count: 80 }, { month: 'Feb', count: 76 }, { month: 'Mar', count: 91 },
  { month: 'Apr', count: 87 },
];

const renewalRows = [
  { id: 1, insurer: 'HDFC ERGO', holder: 'Ramesh Patil', policyNo: 'POL-2024-0512', date: '05 Apr 2025', gwp: 18500 },
  { id: 2, insurer: 'Star Health', holder: 'Maya Singh', policyNo: 'POL-2024-0498', date: '06 Apr 2025', gwp: 24200 },
  { id: 3, insurer: 'LIC', holder: 'Vijay Rao', policyNo: 'POL-2024-0487', date: '07 Apr 2025', gwp: 55000 },
  { id: 4, insurer: 'Bajaj Allianz', holder: 'Pooja Mehta', policyNo: 'POL-2024-0471', date: '08 Apr 2025', gwp: 12800 },
  { id: 5, insurer: 'ICICI Lombard', holder: 'Kiran Desai', policyNo: 'POL-2024-0460', date: '09 Apr 2025', gwp: 19800 },
  { id: 6, insurer: 'New India', holder: 'Suresh Patil', policyNo: 'POL-2024-0445', date: '10 Apr 2025', gwp: 38000 },
  { id: 7, insurer: 'Tata AIG', holder: 'Anjali Sharma', policyNo: 'POL-2024-0430', date: '11 Apr 2025', gwp: 14500 },
  { id: 8, insurer: 'Care Health', holder: 'Rajesh Kumar', policyNo: 'POL-2024-0415', date: '12 Apr 2025', gwp: 28000 },
  { id: 9, insurer: 'SBI Life', holder: 'Nina Gupta', policyNo: 'POL-2024-0402', date: '13 Apr 2025', gwp: 45000 },
  { id: 10, insurer: 'Go Digit', holder: 'Arun Iyer', policyNo: 'POL-2024-0390', date: '14 Apr 2025', gwp: 11200 },
];

const kpis = [
  { label: 'Renewals This Month', value: monthlyRenewal.count.toString(), sub: 'April 2025', icon: RefreshCcw, color: '#f59e0b' },
  { label: 'Retained GWP', value: `₹${monthlyRenewal.gwp.toLocaleString('en-IN')}`, sub: 'This month', icon: DollarSign, color: '#f59e0b' },
  { label: 'Total Renewed (YTD)', value: tillDate.count.toString(), sub: 'Since Apr 2024', icon: TrendingUp, color: '#10b981' },
  { label: 'Cumulative Premium', value: `₹${(tillDate.gwp / 100000).toFixed(1)}L`, sub: 'Since Apr 2024', icon: Building2, color: '#10b981' },
];

type SortKey = 'insurer' | 'holder' | 'policyNo' | 'date' | 'gwp';

export default function RenewalPage() {
  const [search, setSearch] = useState('');
  
  // Sorting State
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  const filteredAndSorted = useMemo(() => {
    let result = renewalRows.filter((p) => {
      return p.holder.toLowerCase().includes(search.toLowerCase()) ||
        p.policyNo.toLowerCase().includes(search.toLowerCase()) ||
        p.insurer.toLowerCase().includes(search.toLowerCase());
    });

    result.sort((a, b) => {
      let aVal = a[sortKey];
      let bVal = b[sortKey];

      if (sortKey === 'date') {
        aVal = new Date(a.date).getTime();
        bVal = new Date(b.date).getTime();
      }

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [search, sortKey, sortOrder]);

  const totalPages = Math.ceil(filteredAndSorted.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredAndSorted.slice(startIndex, startIndex + itemsPerPage);

  React.useEffect(() => { setCurrentPage(1); }, [search, itemsPerPage]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('desc');
    }
  };

  const SortIcon = ({ columnKey }: { columnKey: SortKey }) => {
    if (sortKey !== columnKey) return <ChevronsUpDown size={14} className="ms-1 opacity-25" />;
    return sortOrder === 'asc' ? <ChevronUp size={14} className="ms-1 text-brand" /> : <ChevronDown size={14} className="ms-1 text-brand" />;
  };

  return (
    <div className="container-fluid px-0">
      <div className="mb-4">
        <h1 className="fs-3 fw-bold text-white mb-2" style={{ fontFamily: 'Manrope, sans-serif' }}>Policy Renewals</h1>
        <p className="text-muted-custom mb-0" style={{ fontSize: '0.875rem' }}>Track monthly retention metrics and recurring premium income.</p>
      </div>

      {/* KPI Cards */}
      <div className="row g-3 mb-4">
        {kpis.map(({ label, value, sub, icon: Icon, color }) => (
          <div key={label} className="col-12 col-sm-6 col-xl-3">
            <div className="dash-card h-100 d-flex align-items-center gap-3">
              <div className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                style={{ background: `${color}1A`, width: 44, height: 44 }}>
                <Icon size={20} style={{ color }} />
              </div>
              <div className="min-w-0">
                <p className="fs-4 fw-bold text-white mb-1" style={{ fontFamily: 'Manrope, sans-serif' }}>{value}</p>
                <p className="mb-1 text-muted-custom" style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600 }}>{label}</p>
                <p className="mb-0" style={{ fontSize: '0.68rem', color: '#464555' }}>{sub}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bar Chart */}
      <div className="dash-card mb-4">
        <p className="fw-bold text-white mb-1" style={{ fontSize: '0.95rem', fontFamily: 'Manrope, sans-serif' }}>Monthly Renewal Volume</p>
        <p className="mb-4 text-muted-custom" style={{ fontSize: '0.75rem' }}>Historical count of policies successfully renewed each month</p>
        <div className="chart-container-wrapper">
          <ResponsiveContainer width="100%" height={260} minWidth={0}>
            <BarChart data={monthTrend} margin={{ top: 5, right: 0, left: -20, bottom: 0 }} barSize={36}>
              <defs>
                <linearGradient id="amberBar" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#b45309" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(226, 226, 235, 0.05)" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: '#c7c4d8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#c7c4d8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#282a30', border: 'none', borderRadius: 8, color: '#e2e2eb', fontSize: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}
                cursor={{ fill: 'rgba(226,226,235,0.04)' }} />
              <Bar dataKey="count" fill="url(#amberBar)" radius={[6, 6, 0, 0]} name="Renewals" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Renewals Table */}
      <div className="dash-card">
        <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3 mb-4">
          <p className="fw-bold text-white mb-0" style={{ fontSize: '0.95rem', fontFamily: 'Manrope, sans-serif' }}>Recent Renewals</p>
          <div className="d-flex gap-2">
            <ExportDropdown 
              data={filteredAndSorted} 
              filename="Renewals_Export"
              columns={[
                { header: 'Insurer', key: 'insurer' },
                { header: 'Policy Holder', key: 'holder' },
                { header: 'Policy No.', key: 'policyNo' },
                { header: 'Renewal Date', key: 'date' },
                { header: 'Premium', key: 'gwp' }
              ]} 
            />
            <div className="search-box" style={{ maxWidth: '250px' }}>
              <Search size={16} className="text-muted-custom" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search records..." />
            </div>
            <select value={itemsPerPage} onChange={(e) => setItemsPerPage(Number(e.target.value))}
              className="form-select custom-select" style={{ width: '80px' }}>
              <option value={5}>5</option>
              <option value={10}>10</option>
            </select>
          </div>
        </div>
        
        <div className="table-wrapper">
          <table className="table table-custom table-borderless w-100">
            <thead>
              <tr>
                <th className="sortable-th" onClick={() => handleSort('insurer')}>Insurer <SortIcon columnKey="insurer" /></th>
                <th className="sortable-th" onClick={() => handleSort('holder')}>Policy Holder <SortIcon columnKey="holder" /></th>
                <th className="sortable-th" onClick={() => handleSort('policyNo')}>Policy No. <SortIcon columnKey="policyNo" /></th>
                <th className="sortable-th" onClick={() => handleSort('date')}>Renewal Date <SortIcon columnKey="date" /></th>
                <th className="sortable-th text-end" onClick={() => handleSort('gwp')}>Premium <SortIcon columnKey="gwp" /></th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.length === 0
                ? <tr><td colSpan={5} className="text-center py-5 text-muted-custom">No matching records found.</td></tr>
                : paginatedData.map((row) => (
                <tr key={row.id}>
                  <td className="fw-medium text-white">{row.insurer}</td>
                  <td className="text-muted-custom">{row.holder}</td>
                  <td><span className="fw-semibold" style={{ color: '#f59e0b' }}>{row.policyNo}</span></td>
                  <td className="text-muted-custom">{row.date}</td>
                  <td className="fw-bold text-white text-end">₹{row.gwp.toLocaleString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {filteredAndSorted.length > 0 && (
          <div className="pagination-container">
            <div className="pagination-info">
              Showing <span className="text-white fw-medium">{startIndex + 1}</span> to <span className="text-white fw-medium">{Math.min(startIndex + itemsPerPage, filteredAndSorted.length)}</span> of <span className="text-white fw-medium">{filteredAndSorted.length}</span> entries
            </div>
            
            <div className="pagination-controls">
              <button 
                className="btn-page" 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: totalPages }).map((_, idx) => (
                <button
                  key={idx}
                  className={`btn-page ${currentPage === idx + 1 ? 'active' : ''}`}
                  onClick={() => setCurrentPage(idx + 1)}
                >
                  {idx + 1}
                </button>
              ))}
              <button 
                className="btn-page" 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
