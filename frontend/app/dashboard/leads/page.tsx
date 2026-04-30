'use client';

import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Users, UserPlus, UserCheck, UserX, Search, ChevronsUpDown, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Plus, Edit2, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { ExportDropdown, ImportExcelButton } from '@/components/DataMobility';

import api from '@/lib/axios';

const statusBadge: Record<string, string> = {
  Converted: 'bg-success bg-opacity-10 text-success',
  Open: 'bg-brand bg-opacity-10 text-brand',
  Lost: 'bg-danger bg-opacity-10 text-danger',
};

const normalizeLeadStatus = (status: string) => {
  const value = String(status || 'Open').trim();
  if (value.toLowerCase() === 'active') return 'Open';
  if (value.toLowerCase() === 'converted') return 'Converted';
  if (value.toLowerCase() === 'lost') return 'Lost';
  return 'Open';
};

type SortKey = 'name' | 'phone' | 'product' | 'date' | 'status';

export default function LeadsPage() {
  const [dataList, setDataList] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalLead, setModalLead] = useState<any>(null);

  const openModal = (lead: any = { status: 'Open' }) => {
    setModalLead({ ...lead, status: normalizeLeadStatus(lead.status) });
    setIsModalOpen(true);
  };

  // Sorting State
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  React.useEffect(() => {
    async function load() {
      try {
        const [resLeads, resProducts] = await Promise.all([
          api.get('/leads'),
          api.get('/products')
        ]);
        const formatted = resLeads.data.map((r: any) => ({
          ...r,
          status: normalizeLeadStatus(r.status),
          date: new Date(r.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
        }));
        setDataList(formatted);
        setProducts(resProducts.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const monthLeads = useMemo(() => {
    const raw = [...dataList];
    raw.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const byMonth: Record<string, any> = {};
    raw.forEach(lead => {
      const parts = lead.date.split(' ');
      const m = parts[1]; // short month
      if (!byMonth[m]) {
        byMonth[m] = { month: m, Generated: 0, Converted: 0, Lost: 0 };
      }
      byMonth[m].Generated += 1;
      if (lead.status === 'Converted') byMonth[m].Converted += 1;
      else if (lead.status === 'Lost') byMonth[m].Lost += 1;
    });

    // Return sorted keys or just array
    return Object.values(byMonth);
  }, [dataList]);

  // Handle empty state gracefully for derived metrics
  const current = monthLeads.length > 0 ? monthLeads[monthLeads.length - 1] : { Generated: 0, Converted: 0, Lost: 0 };
  const active = current.Generated - current.Converted - current.Lost;

  const filteredAndSorted = useMemo(() => {
    let result = dataList.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.phone.includes(search) ||
        p.product.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'All' || p.status === statusFilter;
      return matchSearch && matchStatus;
    });

    result.sort((a, b) => {
      let aVal: string | number = a[sortKey];
      let bVal: string | number = b[sortKey];

      if (sortKey === 'date') {
        aVal = new Date(a.date).getTime();
        bVal = new Date(b.date).getTime();
      }

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [dataList, search, statusFilter, sortKey, sortOrder]);

  const totalPages = Math.ceil(filteredAndSorted.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredAndSorted.slice(startIndex, startIndex + itemsPerPage);

  React.useEffect(() => { setCurrentPage(1); }, [search, statusFilter, itemsPerPage]);

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

  const handleImport = async (importedRows: any[]) => {
    try {
      await api.post('/leads/bulk', importedRows);
      const res = await api.get('/leads');
      const formatted = res.data.map((r: any) => ({
        ...r,
        status: normalizeLeadStatus(r.status),
        date: new Date(r.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
      }));
      setDataList(formatted);
      toast.success('Leads imported successfully!');
    } catch (e) {
      toast.error('Bulk import failed.');
      console.error('Bulk import error:', e);
    }
  };

  const handleSaveLead = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (modalLead.id) {
        await api.put(`/leads/${modalLead.id}`, { ...modalLead, status: normalizeLeadStatus(modalLead.status) });
        setDataList(prev => prev.map(l => l.id === modalLead.id ? { ...modalLead, date: new Date(modalLead.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) } : l));
        toast.success('Lead updated successfully!');
      } else {
        const payload = { ...modalLead, status: normalizeLeadStatus(modalLead.status), date: new Date().toISOString().split('T')[0] };
        const res = await api.post('/leads', payload);
        const newRecord = { ...payload, id: res.data.id, date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) };
        setDataList(prev => [newRecord, ...prev]);
        toast.success('Lead added successfully!');
      }
      setIsModalOpen(false);
    } catch (err: any) {
      toast.error('An error occurred while saving the lead.');
      console.error(err);
    }
  };

  const handleDeleteLead = async (id: number) => {
    if (!confirm('Are you sure you want to delete this lead?')) return;
    try {
      await api.delete(`/leads/${id}`);
      setDataList(prev => prev.filter(l => l.id !== id));
      toast.success('Lead deleted successfully!');
    } catch (err) {
      toast.error('Failed to delete lead.');
      console.error(err);
    }
  };

  const stats = [
    { label: 'Leads Given (Apr)', value: current.Generated, icon: Users, color: '#c3c0ff' },
    { label: 'Open Prospects', value: active, icon: UserPlus, color: '#4F46E5' },
    { label: 'Won (Apr)', value: current.Converted, icon: UserCheck, color: '#10b981' },
    { label: 'Lost (Apr)', value: current.Lost, icon: UserX, color: '#ef4444' },
  ];

  return (
    <div className="container-fluid px-0">
      <div className="mb-4">
        <h1 className="fs-3 fw-bold text-white mb-2" style={{ fontFamily: 'Manrope, sans-serif' }}>Leads Tracking</h1>
        <p className="text-muted-custom mb-0" style={{ fontSize: '0.875rem' }}>CRM pipeline analysis and lead conversion metrics.</p>
      </div>

      {/* Stat cards */}
      <div className="row g-3 mb-4">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="col-12 col-sm-6 col-xl-3">
            <div className="dash-card d-flex align-items-center gap-3 h-100">
              <div className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                style={{ width: 44, height: 44, background: 'rgba(79, 70, 229, 0.1)' }}>
                <Icon size={20} style={{ color }} />
              </div>
              <div className="min-w-0">
                <p className="fs-3 fw-bold text-white mb-0" style={{ fontFamily: 'Manrope, sans-serif' }}>{value}</p>
                <p className="mb-0 text-muted-custom text-truncate" style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="dash-card mb-4">
        <p className="fw-bold text-white mb-1" style={{ fontSize: '0.95rem', fontFamily: 'Manrope, sans-serif' }}>Lead Conversion Velocity</p>
        <p className="mb-4 text-muted-custom" style={{ fontSize: '0.75rem' }}>Monthly breakdown of generated, converted, and lost leads</p>
        <div className="chart-container-wrapper">
          <ResponsiveContainer width="100%" height={260} minWidth={0}>
            <BarChart data={monthLeads} margin={{ top: 10, right: 0, left: -20, bottom: 0 }} barGap={6}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(226, 226, 235, 0.05)" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: '#c7c4d8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#c7c4d8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#282a30', border: 'none', borderRadius: 8, color: '#e2e2eb', fontSize: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}
                cursor={{ fill: 'rgba(226,226,235,0.04)' }} />
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} iconType="circle" />
              <Bar dataKey="Generated" fill="#c3c0ff" radius={[4, 4, 0, 0]} barSize={12} />
              <Bar dataKey="Converted" fill="#10b981" radius={[4, 4, 0, 0]} barSize={12} />
              <Bar dataKey="Lost" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={12} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Leads table */}
      <div className="dash-card">
        <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3 mb-4">
          <p className="fw-bold text-white mb-0" style={{ fontSize: '0.95rem', fontFamily: 'Manrope, sans-serif' }}>Pipeline Roster</p>
          <div className="d-flex flex-wrap gap-2">
            <button
              className="btn btn-sm d-flex align-items-center gap-2"
              style={{ background: 'rgba(79, 70, 229, 0.1)', color: '#c3c0ff', border: '1px solid rgba(79, 70, 229, 0.2)', fontWeight: 600, fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
              onClick={() => openModal()}
            >
              <Plus size={14} />
              New Lead
            </button>
            <ImportExcelButton
              onImport={handleImport}
              columnMap={{
                'Prospect': 'name', 'Contact': 'phone', 'Product Interest': 'product', 'Added On': 'date', 'Status': 'status'
              }}
              dummyRows={[
                { Prospect: 'Deepak Patel', Contact: '9876543210', 'Product Interest': 'Motor', 'Added On': '2025-01-10', Status: 'Open' },
                { Prospect: 'Kavitha Reddy', Contact: '9812345678', 'Product Interest': 'Health', 'Added On': '2025-02-14', Status: 'Converted' },
                { Prospect: 'Suresh Kumar', Contact: '9988776655', 'Product Interest': 'Life', 'Added On': '2025-03-05', Status: 'Lost' },
                { Prospect: 'Meena Joshi', Contact: '9001234567', 'Product Interest': 'General', 'Added On': '2025-04-22', Status: 'Open' },
                { Prospect: 'Arjun Singh', Contact: '9870001234', 'Product Interest': 'Motor', 'Added On': '2025-05-18', Status: 'Converted' },
              ]}
            />
            <ExportDropdown
              data={filteredAndSorted}
              filename="Leads_Export"
              columns={[
                { header: 'Prospect', key: 'name' },
                { header: 'Contact', key: 'phone' },
                { header: 'Product Interest', key: 'product' },
                { header: 'Added On', key: 'date' },
                { header: 'Status', key: 'status' }
              ]}
            />
            <div className="search-box ms-lg-2" style={{ maxWidth: '200px' }}>
              <Search size={16} className="text-muted-custom" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." />
            </div>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
              className="form-select custom-select" style={{ width: '130px' }}>
              <option value="All">All Status</option>
              <option value="Open">Open</option>
              <option value="Converted">Converted</option>
              <option value="Lost">Lost</option>
            </select>
            <select value={itemsPerPage} onChange={(e) => setItemsPerPage(Number(e.target.value))}
              className="form-select custom-select" style={{ width: '80px' }}>
              <option value={5}>5</option>
              <option value={10}>10</option>
            </select>
          </div>
        </div>

        <div className="table-responsive w-100" style={{ overflowX: 'auto' }}>
          <table className="table table-custom table-borderless w-100 align-middle">
            <thead>
              <tr>
                <th className="sortable-th" onClick={() => handleSort('name')}>Prospect <SortIcon columnKey="name" /></th>
                <th className="sortable-th" onClick={() => handleSort('phone')}>Contact <SortIcon columnKey="phone" /></th>
                <th className="sortable-th" onClick={() => handleSort('product')}>Product Interest <SortIcon columnKey="product" /></th>
                <th className="sortable-th" onClick={() => handleSort('date')}>Added On <SortIcon columnKey="date" /></th>
                <th className="sortable-th" onClick={() => handleSort('status')}>Status <SortIcon columnKey="status" /></th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.length === 0
                ? <tr><td colSpan={5} className="text-center py-5 text-muted-custom">No matching leads found.</td></tr>
                : paginatedData.map((row) => (
                  <tr key={row.id}>
                    <td className="fw-medium text-white">{row.name}</td>
                    <td className="font-monospace text-brand">{row.phone}</td>
                    <td className="text-muted-custom">{row.product}</td>
                    <td className="text-muted-custom text-nowrap">{row.date}</td>
                    <td className="text-nowrap">
                      <span className={`stat-badge ${statusBadge[row.status] || 'bg-secondary bg-opacity-10 text-secondary'}`}>{row.status}</span>
                    </td>
                    <td className="text-end text-nowrap">
                      <button className="btn btn-sm text-brand p-1" onClick={() => openModal(row)}>
                        <Edit2 size={14} />
                      </button>
                      <button className="btn btn-sm text-danger p-1 ms-2" onClick={() => handleDeleteLead(row.id)}>
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {filteredAndSorted.length > 0 && (
          <div className="pagination-container">
            <div className="pagination-info">
              Showing <span className="text-white fw-medium">{startIndex + 1}</span> to <span className="text-white fw-medium">{Math.min(startIndex + itemsPerPage, filteredAndSorted.length)}</span> of <span className="text-white fw-medium">{filteredAndSorted.length}</span> records
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

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="modal-backdrop bg-black bg-opacity-50 d-flex align-items-center justify-content-center" style={{ position: 'fixed', top: 0, left: 0, zIndex: 1050, width: '100vw', height: '100vh' }}>
          <div className="dash-card w-100" style={{ maxWidth: '500px', border: '1px solid rgba(70, 69, 85, 0.4)' }}>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h5 className="text-white mb-0 fw-bold">{modalLead?.id ? 'Edit Lead' : 'Add New Lead'}</h5>
              <button className="btn text-muted-custom p-0" onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveLead}>
              <div className="mb-3">
                <label className="form-label text-muted-custom" style={{ fontSize: '0.8rem' }}>Prospect Name</label>
                <input required className="form-control custom-select" value={modalLead?.name || ''} onChange={(e) => setModalLead({ ...modalLead, name: e.target.value })} />
              </div>
              <div className="mb-3">
                <label className="form-label text-muted-custom" style={{ fontSize: '0.8rem' }}>Contact Info</label>
                <input required className="form-control custom-select" value={modalLead?.phone || ''} onChange={(e) => setModalLead({ ...modalLead, phone: e.target.value })} />
              </div>
              <div className="mb-3">
                <label className="form-label text-muted-custom" style={{ fontSize: '0.8rem' }}>Product Interest</label>
                <select className="form-select custom-select" value={modalLead?.product || ''} onChange={(e) => setModalLead({ ...modalLead, product: e.target.value })}>
                  {products.length === 0 && <option value="General">General</option>}
                  {products.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                </select>
              </div>
              <div className="mb-4">
                <label className="form-label text-muted-custom" style={{ fontSize: '0.8rem' }}>Status</label>
                <select className="form-select custom-select" value={modalLead?.status || 'Open'} onChange={(e) => setModalLead({ ...modalLead, status: e.target.value })}>
                  <option value="Open">Open</option>
                  <option value="Converted">Converted</option>
                  <option value="Lost">Lost</option>
                </select>
              </div>
              <div className="d-flex justify-content-end gap-2">
                <button type="button" className="btn btn-sm" style={{ background: 'transparent', color: '#e2e2eb', border: '1px solid rgba(226,226,235,0.2)' }} onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-sm" style={{ background: '#4F46E5', color: '#fff', border: 'none' }}>Save Lead</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
