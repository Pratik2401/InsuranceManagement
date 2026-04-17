'use client';

import React, { useState, useMemo } from 'react';
import { Search, Clock, AlertTriangle, CheckCircle2, ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { ExportDropdown } from '@/components/DataMobility';

const TODAY = new Date('2025-04-15');

function daysUntil(dateStr: string) {
  return Math.ceil((new Date(dateStr).getTime() - TODAY.getTime()) / 86400000);
}

const upcomingData = [
  { id: 1, policyName: 'Motor Comprehensive', holder: 'Ramesh Patil', company: 'HDFC ERGO', policyNo: 'POL-2024-0512', startDate: '18 Apr 2024', dueDate: '2025-04-18', premium: 18500 },
  { id: 2, policyName: 'Family Floater Health', holder: 'Maya Singh', company: 'Star Health', policyNo: 'POL-2024-0498', startDate: '20 Apr 2024', dueDate: '2025-04-20', premium: 24200 },
  { id: 3, policyName: 'Term Life Plan', holder: 'Vijay Rao', company: 'LIC', policyNo: 'POL-2024-0487', startDate: '25 Apr 2024', dueDate: '2025-04-25', premium: 55000 },
  { id: 4, policyName: 'Individual Health', holder: 'Kiran Desai', company: 'ICICI Lombard', policyNo: 'POL-2024-0460', startDate: '05 May 2024', dueDate: '2025-05-05', premium: 19800 },
  { id: 5, policyName: 'Term Life Plan', holder: 'Deepa Nair', company: 'SBI Life', policyNo: 'POL-2024-0412', startDate: '01 Jun 2024', dueDate: '2025-06-01', premium: 72000 },
  { id: 6, policyName: 'Motor Third Party', holder: 'Nikhil Shah', company: 'Oriental', policyNo: 'POL-2024-0401', startDate: '10 Apr 2024', dueDate: '2025-04-10', premium: 9500 },
  { id: 7, policyName: 'Fire & Burglary', holder: 'Kavita Joshi', company: 'New India', policyNo: 'POL-2024-0370', startDate: '12 Apr 2024', dueDate: '2025-04-12', premium: 48000 },
  { id: 8, policyName: 'Motor Comprehensive', holder: 'Anil Rane', company: 'Reliance General', policyNo: 'POL-2024-0355', startDate: '15 Apr 2024', dueDate: '2025-04-15', premium: 16500 },
  { id: 9, policyName: 'Health Individual', holder: 'Suresh Kumar', company: 'Care Health', policyNo: 'POL-2024-0340', startDate: '22 Apr 2024', dueDate: '2025-04-22', premium: 18000 },
  { id: 10, policyName: 'Term Life Plan', holder: 'Priya Sharma', company: 'HDFC Life', policyNo: 'POL-2024-0320', startDate: '30 Apr 2024', dueDate: '2025-04-30', premium: 62000 },
];

function getStatus(days: number) {
  if (days < 0) return { label: 'Overdue', badgeClass: 'bg-danger bg-opacity-10 text-danger', icon: AlertTriangle };
  if (days <= 7) return { label: `Due in ${days}d`, badgeClass: 'bg-warning bg-opacity-10 text-warning', icon: Clock };
  return { label: 'Upcoming', badgeClass: 'bg-success bg-opacity-10 text-success', icon: CheckCircle2 };
}

const filterOptions = ['All', 'Overdue', 'Due This Week', 'Future'];
type SortKey = 'policyName' | 'holder' | 'company' | 'policyNo' | 'dueDate' | 'premium';

export default function UpcomingRenewalsPage() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');

  // Sorting State
  const [sortKey, setSortKey] = useState<SortKey>('dueDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  const filteredAndSorted = useMemo(() => {
    let result = upcomingData.filter((p) => {
      const days = daysUntil(p.dueDate);
      const matchSearch =
        p.holder.toLowerCase().includes(search.toLowerCase()) ||
        p.policyNo.toLowerCase().includes(search.toLowerCase()) ||
        p.company.toLowerCase().includes(search.toLowerCase());
      const matchFilter =
        filter === 'All' ||
        (filter === 'Overdue' && days < 0) ||
        (filter === 'Due This Week' && days >= 0 && days <= 7) ||
        (filter === 'Future' && days > 7);
      return matchSearch && matchFilter;
    });

    result.sort((a, b) => {
      let aVal = a[sortKey];
      let bVal = b[sortKey];

      if (sortKey === 'dueDate') {
        aVal = new Date(a.dueDate).getTime();
        bVal = new Date(b.dueDate).getTime();
      }

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [search, filter, sortKey, sortOrder]);

  const totalPages = Math.ceil(filteredAndSorted.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredAndSorted.slice(startIndex, startIndex + itemsPerPage);

  React.useEffect(() => { setCurrentPage(1); }, [search, filter, itemsPerPage]);

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

  const overdueCount = upcomingData.filter((p) => daysUntil(p.dueDate) < 0).length;
  const thisWeekCount = upcomingData.filter((p) => { const d = daysUntil(p.dueDate); return d >= 0 && d <= 7; }).length;
  const upcomingCount = upcomingData.filter((p) => daysUntil(p.dueDate) > 7).length;

  return (
    <div className="container-fluid px-0">
      <div className="mb-4">
        <h1 className="fs-3 fw-bold text-white mb-2" style={{ fontFamily: 'Manrope, sans-serif' }}>Upcoming Renewals</h1>
        <p className="text-muted-custom mb-0" style={{ fontSize: '0.875rem' }}>Policies requiring attention — review and action overdue items first.</p>
      </div>

      {/* Status summary cards */}
      <div className="row g-3 mb-4">
        {[
          { label: 'Overdue / Critical', count: overdueCount, icon: AlertTriangle, color: '#ef4444' },
          { label: 'Due This Week', count: thisWeekCount, icon: Clock, color: '#f59e0b' },
          { label: 'Upcoming (7+ days)', count: upcomingCount, icon: CheckCircle2, color: '#10b981' },
        ].map(({ label, count, icon: Icon, color }) => (
          <div key={label} className="col-12 col-sm-4">
            <div className="dash-card d-flex align-items-center gap-3">
              <div className="rounded-circle flex-shrink-0 d-flex align-items-center justify-content-center" style={{ width: 44, height: 44, background: `${color}1A` }}>
                <Icon size={20} style={{ color }} />
              </div>
              <div className="min-w-0">
                <p className="fs-3 fw-bold text-white mb-0" style={{ fontFamily: 'Manrope, sans-serif' }}>{count}</p>
                <p className="mb-0 text-muted-custom text-truncate" style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600 }}>{label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Table card */}
      <div className="dash-card">
        {/* Controls */}
        <div className="d-flex flex-column flex-lg-row gap-3 mb-4">
          <div className="search-box flex-grow-1">
            <Search size={16} className="text-muted-custom" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search holder, policy, insurer..." />
          </div>
          <div className="d-flex gap-2 flex-wrap align-items-center">
            <ExportDropdown 
              data={filteredAndSorted} 
              filename="Upcoming_Renewals_Export"
              columns={[
                { header: 'Policy Name', key: 'policyName' },
                { header: 'Holder', key: 'holder' },
                { header: 'Insurer', key: 'company' },
                { header: 'Policy No.', key: 'policyNo' },
                { header: 'Due Date', key: 'dueDate' },
                { header: 'Premium', key: 'premium' }
              ]} 
            />
            {filterOptions.map((opt) => (
              <button key={opt} onClick={() => setFilter(opt)}
                className={`btn btn-sm ${filter === opt ? 'btn-primary bg-brand border-0' : 'btn-outline-secondary border-0'}`}
                style={{
                  fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.04em',
                  background: filter === opt ? '' : 'rgba(255,255,255,0.05)',
                  color: filter === opt ? '#fff' : '#c7c4d8'
                }}>
                {opt}
              </button>
            ))}
            <select value={itemsPerPage} onChange={(e) => setItemsPerPage(Number(e.target.value))}
              className="form-select custom-select ms-lg-2" style={{ width: '80px' }}>
              <option value={5}>5</option>
              <option value={10}>10</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="table-wrapper">
          <table className="table table-custom table-borderless w-100">
            <thead>
              <tr>
                <th className="sortable-th" onClick={() => handleSort('policyName')}>Policy Name <SortIcon columnKey="policyName" /></th>
                <th className="sortable-th" onClick={() => handleSort('holder')}>Holder <SortIcon columnKey="holder" /></th>
                <th className="sortable-th" onClick={() => handleSort('company')}>Insurer <SortIcon columnKey="company" /></th>
                <th className="sortable-th" onClick={() => handleSort('policyNo')}>Policy No. <SortIcon columnKey="policyNo" /></th>
                <th className="sortable-th" onClick={() => handleSort('dueDate')}>Due Date <SortIcon columnKey="dueDate" /></th>
                <th className="sortable-th text-end" onClick={() => handleSort('premium')}>Premium <SortIcon columnKey="premium" /></th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.length === 0
                ? <tr><td colSpan={7} className="text-center py-5 text-muted-custom">No matching renewals found.</td></tr>
                : paginatedData.map((row) => {
                  const days = daysUntil(row.dueDate);
                  const status = getStatus(days);
                  const StatusIcon = status.icon;
                  const isOverdue = days < 0;

                  return (
                    <tr key={row.id} style={isOverdue ? { background: 'rgba(239,68,68,0.05)' } : {}}>
                      <td className="fw-medium text-white">{row.policyName}</td>
                      <td className="text-muted-custom">{row.holder}</td>
                      <td className="text-muted-custom">{row.company}</td>
                      <td><span className="text-brand fw-semibold">{row.policyNo}</span></td>
                      <td className={`fw-medium ${isOverdue ? 'text-danger' : 'text-white'}`}>
                        {new Date(row.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="fw-bold text-white text-end">₹{row.premium.toLocaleString('en-IN')}</td>
                      <td>
                        <span className={`stat-badge ${status.badgeClass}`}>
                          <StatusIcon size={12} className="me-1" />
                          {status.label}
                        </span>
                      </td>
                    </tr>
                  );
                })
              }
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
