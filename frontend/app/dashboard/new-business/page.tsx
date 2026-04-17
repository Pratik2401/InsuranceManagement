'use client';

import React, { useState, useMemo } from 'react';
import { Search, FileText, DollarSign, ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { ExportDropdown, ImportExcelButton } from '@/components/DataMobility';

const policiesData = [
  { id: 1, date: '12 Apr 2025', type: 'Motor', company: 'HDFC ERGO', policyType: 'Comprehensive', holder: 'Ramesh Patil', number: 'POL-2025-1084', gwp: 18500 },
  { id: 2, date: '11 Apr 2025', type: 'Health', company: 'Star Health', policyType: 'Family Floater', holder: 'Sneha Desai', number: 'POL-2025-1083', gwp: 24200 },
  { id: 3, date: '10 Apr 2025', type: 'Life', company: 'LIC', policyType: 'Term Plan', holder: 'Arjun Mehta', number: 'POL-2025-1082', gwp: 55000 },
  { id: 4, date: '09 Apr 2025', type: 'Motor', company: 'Bajaj Allianz', policyType: 'Third Party', holder: 'Priya Sharma', number: 'POL-2025-1081', gwp: 12800 },
  { id: 5, date: '08 Apr 2025', type: 'General', company: 'New India', policyType: 'Fire & Burglary', holder: 'Kavita Joshi', number: 'POL-2025-1080', gwp: 38000 },
  { id: 6, date: '07 Apr 2025', type: 'Health', company: 'ICICI Lombard', policyType: 'Individual', holder: 'Suresh Kumar', number: 'POL-2025-1079', gwp: 19800 },
  { id: 7, date: '06 Apr 2025', type: 'Motor', company: 'Reliance General', policyType: 'Comprehensive', holder: 'Anil Rane', number: 'POL-2025-1078', gwp: 16500 },
  { id: 8, date: '05 Apr 2025', type: 'Life', company: 'SBI Life', policyType: 'Endowment', holder: 'Deepa Nair', number: 'POL-2025-1077', gwp: 72000 },
  { id: 9, date: '04 Apr 2025', type: 'Health', company: 'Max Bupa', policyType: 'Family Floater', holder: 'Vikram Joshi', number: 'POL-2025-1076', gwp: 21000 },
  { id: 10, date: '03 Apr 2025', type: 'Motor', company: 'Go Digit', policyType: 'Comprehensive', holder: 'Pooja Iyer', number: 'POL-2025-1075', gwp: 14500 },
  { id: 11, date: '02 Apr 2025', type: 'Life', company: 'HDFC Life', policyType: 'Term Plan', holder: 'Rahul Verma', number: 'POL-2025-1074', gwp: 48000 },
  { id: 12, date: '01 Apr 2025', type: 'General', company: 'Tata AIG', policyType: 'Marine', holder: 'Nikhil Shah', number: 'POL-2025-1073', gwp: 115000 },
];

const typeBadge: Record<string, string> = {
  Motor: 'bg-primary bg-opacity-10 text-primary',
  Health: 'bg-success bg-opacity-10 text-success',
  Life: 'bg-info bg-opacity-10 text-info',
  General: 'bg-warning bg-opacity-10 text-warning',
};

const allTypes = ['All', 'Motor', 'Health', 'Life', 'General'];

type SortKey = 'date' | 'number' | 'holder' | 'company' | 'gwp';

export default function NewBusinessPage() {
  const [dataList, setDataList] = useState(policiesData);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  
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

  const handleImport = (importedRows: any[]) => {
    // Add artificial IDs to incoming rows
    const mapped = importedRows.map((row, i) => ({
      ...row,
      id: Date.now() + i,
      type: row.type || 'General',
      gwp: Number(row.gwp) || 0
    }));
    setDataList(prev => [...mapped, ...prev]);
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
          <div className="d-flex gap-2">
            <ImportExcelButton 
              onImport={handleImport} 
              columnMap={{
                'Date': 'date', 'Policy No': 'number', 'Holder': 'holder', 'Company': 'company', 'Type': 'type', 'Policy Type': 'policyType', 'GWP': 'gwp'
              }} 
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
              {allTypes.map((t) => <option key={t} value={t}>{t === 'All' ? 'All Products' : t}</option>)}
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
        <div className="table-wrapper">
          <table className="table table-custom table-borderless w-100">
            <thead>
              <tr>
                <th className="sortable-th" onClick={() => handleSort('date')}>Date <SortIcon columnKey="date" /></th>
                <th className="sortable-th" onClick={() => handleSort('number')}>Policy No. <SortIcon columnKey="number" /></th>
                <th className="sortable-th" onClick={() => handleSort('holder')}>Holder <SortIcon columnKey="holder" /></th>
                <th>Product</th>
                <th className="sortable-th" onClick={() => handleSort('company')}>Insurer <SortIcon columnKey="company" /></th>
                <th>Type</th>
                <th className="sortable-th text-end" onClick={() => handleSort('gwp')}>GWP <SortIcon columnKey="gwp" /></th>
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
                    <td><span className={`stat-badge ${typeBadge[row.type]}`}>{row.type}</span></td>
                    <td className="text-muted-custom">{row.company}</td>
                    <td className="text-muted-custom">{row.policyType}</td>
                    <td className="fw-bold text-white text-end">₹{row.gwp.toLocaleString('en-IN')}</td>
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
    </div>
  );
}
