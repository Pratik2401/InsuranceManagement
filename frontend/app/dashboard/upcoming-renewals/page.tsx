'use client';

import React, { useState, useMemo } from 'react';
import { Search, Clock, AlertTriangle, CheckCircle2, ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { ExportDropdown } from '@/components/DataMobility';
import toast from 'react-hot-toast';

import api from '@/lib/axios';

function daysUntil(dateStr: string) {
  const TODAY = new Date();
  TODAY.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - TODAY.getTime()) / 86400000);
}

function getStatus(days: number) {
  if (days < 0) return { label: 'Overdue', badgeClass: 'bg-danger bg-opacity-10 text-danger', icon: AlertTriangle };
  if (days <= 7) return { label: `Due in ${days}d`, badgeClass: 'bg-warning bg-opacity-10 text-warning', icon: Clock };
  return { label: 'Upcoming', badgeClass: 'bg-success bg-opacity-10 text-success', icon: CheckCircle2 };
}

const filterOptions = ['All', 'Overdue', 'Due This Week', 'Future'];
type SortKey = 'policyName' | 'holder' | 'company' | 'policyNo' | 'dueDate' | 'premium';

const getPolicyStatus = (row: any) => {
  const normalizedStatus = String(row.status || '').toLowerCase();
  if (normalizedStatus === 'pending' || normalizedStatus === 'pending_renewal') {
    return { label: 'Pending Renewal', badgeClass: 'bg-warning bg-opacity-10 text-warning', icon: Clock };
  }

  const days = daysUntil(row.dueDate);
  return getStatus(days);
};

const calculateRenewalEndDate = (startDate: string, renewalPeriod: string) => {
  const date = new Date(startDate);
  if (renewalPeriod === 'Monthly') {
    date.setMonth(date.getMonth() + 1);
  } else {
    date.setFullYear(date.getFullYear() + 1);
  }
  return date.toISOString().split('T')[0];
};

export default function UpcomingRenewalsPage() {
  const [upcomingData, setUpcomingData] = useState<any[]>([]);
  const [selectedPolicy, setSelectedPolicy] = useState<any>(null);
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [renewForm, setRenewForm] = useState({
    amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'bank_transfer',
    transaction_id: '',
  });

  React.useEffect(() => {
    async function load() {
      try {
        const res = await api.get('/policies');
        console.log('Raw API response:', res.data);
        
        const formatted = res.data.map((p: any) => {
          const dueDate = p.endDate || p.end_date || p.date;
          const item = {
            id: p.id, 
            policyName: p.policyType || p.type, 
            holder: p.holder, 
            company: p.company, 
            policyNo: p.number, 
            startDate: p.date || p.startDate, 
            dueDate: dueDate, 
            premium: Number(p.gwp),
            status: p.status || 'Active',
            renewalPeriod: p.renewalPeriod || 'Yearly',
          };
          console.log(`Policy ${p.number}: dueDate=${dueDate}, startDate=${p.date}, endDate=${p.endDate}`);
          return item;
        });
        
        console.log('Formatted upcoming data:', formatted);
        setUpcomingData(formatted);
      } catch (e) {
        console.error('Error loading policies:', e);
      }
    }
    load();
  }, []);

  const openRenewModal = async (row: any) => {
    try {
      await api.post(`/policies/${row.id}/mark-pending-renewal`);
      setSelectedPolicy(row);
      setRenewForm({
        amount: String(row.premium || 0),
        payment_date: new Date().toISOString().split('T')[0],
        payment_method: 'bank_transfer',
        transaction_id: '',
      });
      setShowRenewModal(true);
      await api.get('/policies');
      setUpcomingData((prev) => prev.map((item) => item.id === row.id ? { ...item, status: 'pending' } : item));
      toast.success('Policy marked pending renewal.');
    } catch (error: any) {
      console.error(error);
      toast.error(error?.response?.data?.message || 'Unable to mark policy pending renewal.');
    }
  };

  const closeRenewModal = () => {
    setShowRenewModal(false);
    setSelectedPolicy(null);
  };

  const confirmRenewalPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPolicy) return;

    try {
      await api.post('/payments/renewal', {
        policy_id: selectedPolicy.id,
        amount: renewForm.amount,
        payment_date: renewForm.payment_date,
        payment_method: renewForm.payment_method,
        transaction_id: renewForm.transaction_id,
      });
      toast.success('Renewal payment confirmed and policy renewed.');
      closeRenewModal();
      const res = await api.get('/policies');
      setUpcomingData(res.data.map((p: any) => ({
        id: p.id,
        policyName: p.policyType || p.type,
        holder: p.holder,
        company: p.company,
        policyNo: p.number,
        startDate: p.date || p.startDate,
        dueDate: p.endDate || p.end_date || p.date,
        premium: Number(p.gwp),
        status: p.status || 'Active',
        renewalPeriod: p.renewalPeriod || 'Yearly',
      })));
    } catch (error: any) {
      console.error(error);
      toast.error(error?.response?.data?.message || 'Unable to confirm renewal payment.');
    }
  };

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');

  // Sorting State
  const [sortKey, setSortKey] = useState<SortKey>('dueDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  const filteredAndSorted = useMemo(() => {
    console.log('Filtering data:', { totalItems: upcomingData.length, search, filter });
    
        let result = upcomingData.filter((p) => {
      const days = daysUntil(p.dueDate);
      console.log(`Filter check - Policy ${p.policyNo}: dueDate=${p.dueDate}, days=${days}`);
      
      const matchSearch =
        p.holder.toLowerCase().includes(search.toLowerCase()) ||
        p.policyNo.toLowerCase().includes(search.toLowerCase()) ||
        p.company.toLowerCase().includes(search.toLowerCase());
      const matchFilter =
        filter === 'All' ||
        (filter === 'Overdue' && days < 0) ||
        (filter === 'Due This Week' && days >= 0 && days <= 7) ||
        (filter === 'Future' && days > 7);
      
      console.log(`  → matchSearch=${matchSearch}, matchFilter=${matchFilter}, included=${matchSearch && matchFilter}`);
      return matchSearch && matchFilter;
    });

    console.log(`After filtering: ${result.length} items`);

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
  }, [search, filter, sortKey, sortOrder, upcomingData]);

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
                <th className="text-end">Action</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.length === 0
                ? <tr><td colSpan={8} className="text-center py-5 text-muted-custom">No matching renewals found.</td></tr>
                : paginatedData.map((row) => {
                  const days = daysUntil(row.dueDate);
                  const status = getPolicyStatus(row);
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
                      <td className="text-end">
                        <button className="btn btn-sm btn-outline-warning" onClick={() => openRenewModal(row)}>
                          Renew Now
                        </button>
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

      {showRenewModal && selectedPolicy && (
        <div className="modal-backdrop bg-black bg-opacity-50 d-flex align-items-center justify-content-center" style={{ position: 'fixed', top: 0, left: 0, zIndex: 1050, width: '100vw', height: '100vh' }}>
          <div className="dash-card w-100" style={{ maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto', border: '1px solid rgba(70, 69, 85, 0.4)' }}>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h5 className="text-white mb-0 fw-bold">Confirm Renewal Payment</h5>
              <button className="btn text-muted-custom p-0" onClick={closeRenewModal}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={confirmRenewalPayment}>
              <div className="mb-3">
                <label className="form-label text-muted-custom" style={{ fontSize: '0.8rem' }}>Policy</label>
                <input className="form-control custom-select" value={`${selectedPolicy.policyNo} - ${selectedPolicy.holder}`} readOnly />
              </div>
              <div className="mb-3">
                <label className="form-label text-muted-custom" style={{ fontSize: '0.8rem' }}>Amount</label>
                <input type="number" className="form-control custom-select" value={renewForm.amount} onChange={(e) => setRenewForm({ ...renewForm, amount: e.target.value })} required />
              </div>
              <div className="mb-3">
                <label className="form-label text-muted-custom" style={{ fontSize: '0.8rem' }}>Payment Date</label>
                <input type="date" className="form-control custom-select" value={renewForm.payment_date} onChange={(e) => setRenewForm({ ...renewForm, payment_date: e.target.value })} required />
              </div>
              <div className="mb-3">
                <label className="form-label text-muted-custom" style={{ fontSize: '0.8rem' }}>Payment Method</label>
                <select className="form-select custom-select" value={renewForm.payment_method} onChange={(e) => setRenewForm({ ...renewForm, payment_method: e.target.value })}>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="credit_card">Credit Card</option>
                  <option value="cash">Cash</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="form-label text-muted-custom" style={{ fontSize: '0.8rem' }}>Transaction ID</label>
                <input className="form-control custom-select" value={renewForm.transaction_id} onChange={(e) => setRenewForm({ ...renewForm, transaction_id: e.target.value })} placeholder="Optional" />
              </div>
              <div className="d-flex justify-content-end gap-2">
                <button type="button" className="btn btn-sm" style={{ background: 'transparent', color: '#e2e2eb', border: '1px solid rgba(226,226,235,0.2)' }} onClick={closeRenewModal}>Cancel</button>
                <button type="submit" className="btn btn-sm" style={{ background: '#f59e0b', color: '#111827', border: 'none' }}>Confirm Payment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
