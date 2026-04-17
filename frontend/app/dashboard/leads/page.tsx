'use client';

import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Users, UserPlus, UserCheck, UserX, Search, ChevronsUpDown, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { ExportDropdown, ImportExcelButton } from '@/components/DataMobility';

const monthLeads = [
  { month: 'Jan', Generated: 120, Converted: 45, Lost: 20 },
  { month: 'Feb', Generated: 145, Converted: 55, Lost: 25 },
  { month: 'Mar', Generated: 160, Converted: 70, Lost: 15 },
  { month: 'Apr', Generated: 110, Converted: 48, Lost: 10 },
];

const latestLeads = [
  { id: 1, name: 'Rahul Verma', phone: '+91 98765 43210', product: 'Motor Comprehensive', date: '14 Apr 2025', status: 'Converted' },
  { id: 2, name: 'Neha Sharma', phone: '+91 87654 32109', product: 'Family Floater', date: '13 Apr 2025', status: 'Active' },
  { id: 3, name: 'Sameer Khan', phone: '+91 76543 21098', product: 'Term Life', date: '12 Apr 2025', status: 'Active' },
  { id: 4, name: 'Anjali Gupta', phone: '+91 65432 10987', product: 'Home Insurance', date: '10 Apr 2025', status: 'Lost' },
  { id: 5, name: 'Vikram Singh', phone: '+91 54321 09876', product: 'Health Individual', date: '08 Apr 2025', status: 'Converted' },
  { id: 6, name: 'Pooja Iyer', phone: '+91 91234 56780', product: 'Motor Third Party', date: '05 Apr 2025', status: 'Active' },
  { id: 7, name: 'Karan Patel', phone: '+91 99887 76655', product: 'Fire & Burglary', date: '04 Apr 2025', status: 'Converted' },
  { id: 8, name: 'Sonia Desai', phone: '+91 88776 65544', product: 'Marine Cargo', date: '03 Apr 2025', status: 'Lost' },
  { id: 9, name: 'Raj Kumar', phone: '+91 77665 54433', product: 'Motor Comprehensive', date: '02 Apr 2025', status: 'Active' },
  { id: 10, name: 'Priya Mehta', phone: '+91 66554 43322', product: 'Endowment Plan', date: '01 Apr 2025', status: 'Converted' },
];

const statusBadge: Record<string, string> = {
  Converted: 'bg-success bg-opacity-10 text-success',
  Active: 'bg-brand bg-opacity-10 text-brand',
  Lost: 'bg-danger bg-opacity-10 text-danger',
};

type SortKey = 'name' | 'phone' | 'product' | 'date' | 'status';

export default function LeadsPage() {
  const current = monthLeads[monthLeads.length - 1];
  const active = current.Generated - current.Converted - current.Lost;

  const [dataList, setDataList] = useState(latestLeads);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Sorting State
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

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

  const handleImport = (importedRows: any[]) => {
    const mapped = importedRows.map((row, i) => ({
      ...row,
      id: Date.now() + i,
      status: row.status || 'Active'
    }));
    setDataList(prev => [...mapped, ...prev]);
  };

  const stats = [
    { label: 'Leads Given (Apr)', value: current.Generated, icon: Users, color: '#c3c0ff' },
    { label: 'Active Prospects', value: active, icon: UserPlus, color: '#4F46E5' },
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
          <div className="d-flex gap-2">
            <ImportExcelButton 
              onImport={handleImport} 
              columnMap={{
                'Prospect': 'name', 'Contact': 'phone', 'Product Interest': 'product', 'Added On': 'date', 'Status': 'status'
              }} 
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
              <option value="Active">Active</option>
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

        <div className="table-wrapper">
          <table className="table table-custom table-borderless w-100">
            <thead>
              <tr>
                <th className="sortable-th" onClick={() => handleSort('name')}>Prospect <SortIcon columnKey="name" /></th>
                <th className="sortable-th" onClick={() => handleSort('phone')}>Contact <SortIcon columnKey="phone" /></th>
                <th className="sortable-th" onClick={() => handleSort('product')}>Product Interest <SortIcon columnKey="product" /></th>
                <th className="sortable-th" onClick={() => handleSort('date')}>Added On <SortIcon columnKey="date" /></th>
                <th className="sortable-th" onClick={() => handleSort('status')}>Status <SortIcon columnKey="status" /></th>
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
                    <td className="text-muted-custom">{row.date}</td>
                    <td>
                      <span className={`stat-badge ${statusBadge[row.status]}`}>{row.status}</span>
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
    </div>
  );
}
