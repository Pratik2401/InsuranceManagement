'use client';

import React, { useState, useMemo } from 'react';
import { Search, FileText, DollarSign, ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight, Plus, Edit2, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { ExportDropdown, ImportExcelButton } from '@/components/DataMobility';

import api from '@/lib/axios';



const typeBadge: Record<string, string> = {
  Motor: 'bg-primary bg-opacity-10 text-primary',
  Health: 'bg-success bg-opacity-10 text-success',
  Life: 'bg-info bg-opacity-10 text-info',
  General: 'bg-warning bg-opacity-10 text-warning',
};

type SortKey = 'date' | 'number' | 'holder' | 'company' | 'gwp';

export default function NewBusinessPage() {
  const [dataList, setDataList] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalPolicy, setModalPolicy] = useState<any>(null);

  const openModal = (policy: any = { type: 'General', gwp: 0 }) => {
    setModalPolicy(policy);
    setIsModalOpen(true);
  };

  React.useEffect(() => {
    async function load() {
      try {
        const [resPolicies, resProducts] = await Promise.all([
          api.get('/policies'),
          api.get('/products')
        ]);
        setDataList(resPolicies.data.map((p: any) => ({ ...p, gwp: Number(p.gwp) })));
        setProducts(resProducts.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);
  
  // Sorting State
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  const filteredAndSorted = useMemo(() => {
    let result = dataList.filter((p) => {
      const match = p.holder.toLowerCase().includes(search.toLowerCase()) ||
        p.number.toLowerCase().includes(search.toLowerCase()) ||
        p.company.toLowerCase().includes(search.toLowerCase());
      const typeMatch = typeFilter === 'All' || p.type === typeFilter;
      return match && typeMatch;
    });

    result.sort((a, b) => {
      let aVal = a[sortKey];
      let bVal = b[sortKey];

      // Convert date strings to timestamps for correct sorting
      if (sortKey === 'date') {
        aVal = new Date(a.date).getTime();
        bVal = new Date(b.date).getTime();
      }

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [dataList, search, typeFilter, sortKey, sortOrder]);

  // Pagination Math
  const totalPages = Math.ceil(filteredAndSorted.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredAndSorted.slice(startIndex, startIndex + itemsPerPage);

  // Reset to page 1 if filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [search, typeFilter, itemsPerPage]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('desc'); // Default new column sort to desc
    }
  };

  const SortIcon = ({ columnKey }: { columnKey: SortKey }) => {
    if (sortKey !== columnKey) return <ChevronsUpDown size={14} className="ms-1 opacity-25" />;
    return sortOrder === 'asc' ? <ChevronUp size={14} className="ms-1 text-brand" /> : <ChevronDown size={14} className="ms-1 text-brand" />;
  };

  const handleImport = async (importedRows: any[]) => {
    try {
      await api.post('/policies/bulk', importedRows);
      const res = await api.get('/policies');
      setDataList(res.data.map((p: any) => ({ ...p, gwp: Number(p.gwp) })));
    } catch (e) {
      console.error('Error importing policies:', e);
    }
  };

  const handleSavePolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (modalPolicy.id) {
        await api.put(`/policies/${modalPolicy.id}`, modalPolicy);
        setDataList(prev => prev.map(p => p.id === modalPolicy.id ? { ...modalPolicy, date: p.date } : p));
        toast.success('Policy updated successfully!');
      } else {
        const res = await api.post('/policies', modalPolicy);
        const newRecord = { ...modalPolicy, id: res.data.id, date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) };
        setDataList(prev => [newRecord, ...prev]);
        toast.success('Policy added successfully!');
      }
      setIsModalOpen(false);
    } catch (err: any) { 
      toast.error('An error occurred while saving the policy. Please check all fields.');
      console.error(err); 
    }
  };

  const handleDeletePolicy = async (id: number) => {
    if (!confirm('Are you sure you want to delete this policy?')) return;
    try {
      await api.delete(`/policies/${id}`);
      setDataList(prev => prev.filter(p => p.id !== id));
      toast.success('Policy deleted successfully!');
    } catch (err) {
      toast.error('Failed to delete policy.');
      console.error(err); 
    }
  };

  return (
    <div className="container-fluid px-0">
      <div className="mb-4">
        <h1 className="fs-3 fw-bold text-white mb-2" style={{ fontFamily: 'Manrope, sans-serif' }}>New Business</h1>
        <p className="text-muted-custom mb-0" style={{ fontSize: '0.875rem' }}>Policies written this month filterable by product type.</p>
      </div>

      {/* Summary cards */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6">
          <div className="dash-card d-flex align-items-center gap-3">
            <div className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style={{ background: 'rgba(79, 70, 229, 0.1)', width: 48, height: 48 }}>
              <FileText size={22} className="text-brand" />
            </div>
            <div>
              <p className="fs-3 fw-bold text-white mb-0" style={{ fontFamily: 'Manrope, sans-serif' }}>{dataList.length}</p>
              <p className="mb-0 text-muted-custom" style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600 }}>Total Policies</p>
            </div>
          </div>
        </div>
        <div className="col-12 col-sm-6">
          <div className="dash-card d-flex align-items-center gap-3">
            <div className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style={{ background: 'rgba(79, 70, 229, 0.1)', width: 48, height: 48 }}>
              <DollarSign size={22} className="text-brand" />
            </div>
            <div>
              <p className="fs-3 fw-bold text-white mb-0" style={{ fontFamily: 'Manrope, sans-serif' }}>₹{dataList.reduce((a,b)=>a+b.gwp, 0).toLocaleString('en-IN')}</p>
              <p className="mb-0 text-muted-custom" style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600 }}>Premium Aggregate</p>
            </div>
          </div>
        </div>
      </div>

      {/* Table card */}
      <div className="dash-card">

        <div className="d-flex align-items-center justify-content-between mb-4">
          <p className="fw-bold text-white mb-0" style={{ fontSize: '0.95rem', fontFamily: 'Manrope, sans-serif' }}>Master Policy Records</p>
          <div className="d-flex flex-wrap gap-2">
            <button 
              className="btn btn-sm d-flex align-items-center gap-2"
              style={{ background: 'rgba(79, 70, 229, 0.1)', color: '#c3c0ff', border: '1px solid rgba(79, 70, 229, 0.2)', fontWeight: 600, fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
              onClick={() => openModal()}
            >
              <Plus size={14} />
              New Policy
            </button>
            <ImportExcelButton 
              onImport={handleImport} 
              columnMap={{
                'Date': 'date', 'Policy No': 'number', 'Holder': 'holder', 'Company': 'company', 'Type': 'type', 'Policy Type': 'policyType', 'GWP': 'gwp'
              }}
              dummyRows={[
                { Date: '2025-01-15', 'Policy No': 'POL-2025-0001', Holder: 'Ramesh Sharma', Company: 'HDFC ERGO', Type: 'Motor', 'Policy Type': 'Comprehensive', GWP: 18500 },
                { Date: '2025-02-03', 'Policy No': 'POL-2025-0002', Holder: 'Priya Iyer', Company: 'ICICI Lombard', Type: 'Health', 'Policy Type': 'Individual Mediclaim', GWP: 12200 },
                { Date: '2025-03-20', 'Policy No': 'POL-2025-0003', Holder: 'Anil Mehta', Company: 'SBI General', Type: 'Life', 'Policy Type': 'Term Plan', GWP: 9800 },
                { Date: '2025-04-11', 'Policy No': 'POL-2025-0004', Holder: 'Sunita Rao', Company: 'Bajaj Allianz', Type: 'Motor', 'Policy Type': 'Third Party', GWP: 6500 },
                { Date: '2025-05-08', 'Policy No': 'POL-2025-0005', Holder: 'Vikram Nair', Company: 'New India Assurance', Type: 'General', 'Policy Type': 'Fire & Burglary', GWP: 22000 },
              ]}
            />
            <ExportDropdown 
              data={filteredAndSorted} 
              filename="New_Business_Policies"
              columns={[
                { header: 'Date', key: 'date' },
                { header: 'Policy No.', key: 'number' },
                { header: 'Holder', key: 'holder' },
                { header: 'Insurer', key: 'company' },
                { header: 'Type', key: 'type' },
                { header: 'GWP', key: 'gwp' }
              ]} 
            />
          </div>
        </div>

        {/* Controls */}
        <div className="d-flex flex-column flex-sm-row gap-3 mb-4">
          <div className="search-box flex-grow-1">
            <Search size={16} className="text-muted-custom" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by holder, policy no, insurer..." />
          </div>
          <div className="d-flex gap-2">
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
              className="form-select custom-select"
              style={{ width: 'auto', minWidth: '150px' }}>
              <option value="All">All Products</option>
              {products.map((t) => <option key={t.id} value={t.name}>{t.name}</option>)}
            </select>
            <select value={itemsPerPage} onChange={(e) => setItemsPerPage(Number(e.target.value))}
              className="form-select custom-select" style={{ width: '80px' }}>
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="table-responsive w-100" style={{ overflowX: 'auto' }}>
          <table className="table table-custom table-borderless w-100 align-middle">
            <thead>
              <tr>
                <th className="sortable-th" onClick={() => handleSort('date')}>Date <SortIcon columnKey="date" /></th>
                <th className="sortable-th" onClick={() => handleSort('number')}>Policy No. <SortIcon columnKey="number" /></th>
                <th className="sortable-th" onClick={() => handleSort('holder')}>Holder <SortIcon columnKey="holder" /></th>
                <th>Product</th>
                <th className="sortable-th" onClick={() => handleSort('company')}>Insurer <SortIcon columnKey="company" /></th>
                <th>Type</th>
                <th className="sortable-th text-end" onClick={() => handleSort('gwp')}>GWP <SortIcon columnKey="gwp" /></th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.length === 0
                ? <tr><td colSpan={7} className="text-center py-5 text-muted-custom">No records found.</td></tr>
                : paginatedData.map((row) => (
                  <tr key={row.id}>
                    <td className="text-muted-custom">{row.date}</td>
                    <td><span className="text-brand fw-semibold">{row.number}</span></td>
                    <td className="fw-medium text-white">{row.holder}</td>
                    <td><span className={`stat-badge ${typeBadge[row.type] || 'bg-secondary bg-opacity-10 text-secondary'}`}>{row.type}</span></td>
                    <td className="text-muted-custom">{row.company}</td>
                    <td className="text-muted-custom">{row.policyType}</td>
                    <td className="fw-bold text-white text-end text-nowrap">₹{row.gwp.toLocaleString('en-IN')}</td>
                    <td className="text-end text-nowrap">
                      <button className="btn btn-sm text-brand p-1" onClick={() => openModal(row)}>
                        <Edit2 size={14} />
                      </button>
                      <button className="btn btn-sm text-danger p-1 ms-2" onClick={() => handleDeletePolicy(row.id)}>
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))
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
              
              {/* Simple page numbers */}
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
        <div className="modal-backdrop bg-black bg-opacity-50 d-flex align-items-center justify-content-center" style={{ position: 'fixed', top: 0, left: 0, w: '100vw', h: '100vh', zIndex: 1050, width: '100vw', height: '100vh' }}>
          <div className="dash-card w-100" style={{ maxWidth: '500px', border: '1px solid rgba(70, 69, 85, 0.4)' }}>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h5 className="text-white mb-0 fw-bold">{modalPolicy?.id ? 'Edit Policy' : 'Add New Policy'}</h5>
              <button className="btn text-muted-custom p-0" onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSavePolicy}>
              <div className="row g-2 mb-3">
                <div className="col-12 col-sm-6">
                  <label className="form-label text-muted-custom" style={{ fontSize: '0.8rem' }}>Policy No.</label>
                  <input required className="form-control custom-select" value={modalPolicy?.number || ''} onChange={(e) => setModalPolicy({...modalPolicy, number: e.target.value})} />
                </div>
                <div className="col-12 col-sm-6">
                  <label className="form-label text-muted-custom" style={{ fontSize: '0.8rem' }}>Holder Name</label>
                  <input className="form-control custom-select" value={modalPolicy?.holder || ''} onChange={(e) => setModalPolicy({...modalPolicy, holder: e.target.value})} />
                </div>
              </div>
              <div className="row g-2 mb-3">
                <div className="col-12 col-sm-6">
                  <label className="form-label text-muted-custom" style={{ fontSize: '0.8rem' }}>Insurer</label>
                  <input required className="form-control custom-select" value={modalPolicy?.company || ''} onChange={(e) => setModalPolicy({...modalPolicy, company: e.target.value})} />
                </div>
                <div className="col-12 col-sm-6">
                  <label className="form-label text-muted-custom" style={{ fontSize: '0.8rem' }}>GWP (Premium)</label>
                  <input required type="number" className="form-control custom-select" value={modalPolicy?.gwp || ''} onChange={(e) => setModalPolicy({...modalPolicy, gwp: e.target.value})} />
                </div>
              </div>
              <div className="row g-2 mb-4">
                <div className="col-12 col-sm-6">
                  <label className="form-label text-muted-custom" style={{ fontSize: '0.8rem' }}>Product</label>
                  <select className="form-select custom-select" value={modalPolicy?.type || ''} onChange={(e) => setModalPolicy({...modalPolicy, type: e.target.value})}>
                    {products.length === 0 && <option value="General">General</option>}
                    {products.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                  </select>
                </div>
                <div className="col-12 col-sm-6">
                  <label className="form-label text-muted-custom" style={{ fontSize: '0.8rem' }}>Policy Type</label>
                  <input className="form-control custom-select" value={modalPolicy?.policyType || ''} onChange={(e) => setModalPolicy({...modalPolicy, policyType: e.target.value})} />
                </div>
              </div>
              <div className="d-flex justify-content-end gap-2">
                <button type="button" className="btn btn-sm" style={{ background: 'transparent', color: '#e2e2eb', border: '1px solid rgba(226,226,235,0.2)' }} onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-sm" style={{ background: '#4F46E5', color: '#fff', border: 'none' }}>Save Policy</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
