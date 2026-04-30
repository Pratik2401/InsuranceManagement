'use client';

import React, { useState, useMemo } from 'react';
import { Package, Search, Plus, Edit2, Trash2, X, ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { ExportDropdown } from '@/components/DataMobility';

import api from '@/lib/axios';

type SortKey = 'name' | 'description' | 'created_at';

export default function ProductsPage() {
  const [dataList, setDataList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalProduct, setModalProduct] = useState<any>(null);

  const openModal = (product: any = { name: '', description: '' }) => {
    setModalProduct(product);
    setIsModalOpen(true);
  };

  // Sorting State
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  React.useEffect(() => {
    async function load() {
      try {
        const res = await api.get('/products');
        const formatted = res.data.map((r: any) => ({
          ...r,
          created_at: new Date(r.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
        }));
        setDataList(formatted);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filteredAndSorted = useMemo(() => {
    let result = dataList.filter((p) => {
      return p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(search.toLowerCase()));
    });

    result.sort((a, b) => {
      let aVal = a[sortKey];
      let bVal = b[sortKey];

      if (sortKey === 'created_at') {
        aVal = new Date(a.created_at).getTime();
        bVal = new Date(b.created_at).getTime();
      }

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [dataList, search, sortKey, sortOrder]);

  const totalPages = Math.ceil(filteredAndSorted.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredAndSorted.slice(startIndex, startIndex + itemsPerPage);

  React.useEffect(() => { setCurrentPage(1); }, [search, itemsPerPage]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  const SortIcon = ({ columnKey }: { columnKey: SortKey }) => {
    if (sortKey !== columnKey) return <ChevronsUpDown size={14} className="ms-1 opacity-25" />;
    return sortOrder === 'asc' ? <ChevronUp size={14} className="ms-1 text-brand" /> : <ChevronDown size={14} className="ms-1 text-brand" />;
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (modalProduct.id) {
        await api.put(`/products/${modalProduct.id}`, modalProduct);
        setDataList(prev => prev.map(p => p.id === modalProduct.id ? { ...modalProduct, created_at: p.created_at } : p));
        toast.success('Product updated successfully!');
      } else {
        const res = await api.post('/products', modalProduct);
        const newRecord = {
          ...modalProduct,
          id: res.data.id,
          created_at: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
        };
        setDataList(prev => [...prev, newRecord]);
        toast.success('Product added successfully!');
      }
      setIsModalOpen(false);
    } catch (err: any) {
      if (err.response?.status === 409) {
        toast.error('A product with this name already exists.');
      } else {
        toast.error('An error occurred while saving.');
        console.error(err);
      }
    }
  };

  const handleDeleteProduct = async (id: number) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await api.delete(`/products/${id}`);
      setDataList(prev => prev.filter(p => p.id !== id));
      toast.success('Product deleted successfully!');
    } catch (err) {
      toast.error('Failed to delete product.');
      console.error(err);
    }
  };

  return (
    <div className="container-fluid px-0">
      <div className="mb-4">
        <h1 className="fs-3 fw-bold text-white mb-2" style={{ fontFamily: 'Manrope, sans-serif' }}>Product Master</h1>
        <p className="text-muted-custom mb-0" style={{ fontSize: '0.875rem' }}>Manage all insurance products and types.</p>
      </div>

      <div className="dash-card mb-4">
        <div className="d-flex align-items-center gap-3">
          <div className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style={{ background: 'rgba(79, 70, 229, 0.1)', width: 48, height: 48 }}>
            <Package size={22} className="text-brand" />
          </div>
          <div>
            <p className="fs-3 fw-bold text-white mb-0" style={{ fontFamily: 'Manrope, sans-serif' }}>{dataList.length}</p>
            <p className="mb-0 text-muted-custom" style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600 }}>Total Master Products</p>
          </div>
        </div>
      </div>

      <div className="dash-card">
        <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3 mb-4">
          <p className="fw-bold text-white mb-0" style={{ fontSize: '0.95rem', fontFamily: 'Manrope, sans-serif' }}>Product List</p>
          <div className="d-flex flex-wrap gap-2">
            <button
              className="btn btn-sm d-flex align-items-center gap-2"
              style={{ background: 'rgba(79, 70, 229, 0.1)', color: '#c3c0ff', border: '1px solid rgba(79, 70, 229, 0.2)', fontWeight: 600, fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
              onClick={() => openModal()}
            >
              <Plus size={14} />
              New Product
            </button>
            <ExportDropdown
              data={filteredAndSorted}
              filename="Products_Master"
              columns={[
                { header: 'Product Name', key: 'name' },
                { header: 'Description', key: 'description' },
                { header: 'Created On', key: 'created_at' }
              ]}
            />
            <div className="search-box ms-lg-2" style={{ maxWidth: '250px' }}>
              <Search size={16} className="text-muted-custom" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products..." />
            </div>
            <select value={itemsPerPage} onChange={(e) => setItemsPerPage(Number(e.target.value))}
              className="form-select custom-select" style={{ width: '80px' }}>
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
            </select>
          </div>
        </div>

        <div className="table-responsive w-100" style={{ overflowX: 'auto' }}>
          <table className="table table-custom table-borderless w-100 align-middle">
            <thead>
              <tr>
                <th className="sortable-th" onClick={() => handleSort('name')}>Product Name <SortIcon columnKey="name" /></th>
                <th className="sortable-th" onClick={() => handleSort('description')}>Description <SortIcon columnKey="description" /></th>
                <th className="sortable-th" onClick={() => handleSort('created_at')}>Created On <SortIcon columnKey="created_at" /></th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={4} className="text-center py-4 text-muted-custom">Loading products...</td></tr> : null}
              {!loading && paginatedData.length === 0
                ? <tr><td colSpan={4} className="text-center py-5 text-muted-custom">No products found.</td></tr>
                : paginatedData.map((row) => (
                  <tr key={row.id}>
                    <td className="fw-medium text-white">{row.name}</td>
                    <td className="text-muted-custom text-break">{row.description || '-'}</td>
                    <td className="text-muted-custom text-nowrap">{row.created_at}</td>
                    <td className="text-end text-nowrap">
                      <button className="btn btn-sm text-brand p-1" onClick={() => openModal({ ...row })}>
                        <Edit2 size={14} />
                      </button>
                      <button className="btn btn-sm text-danger p-1 ms-2" onClick={() => handleDeleteProduct(row.id)}>
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
              <h5 className="text-white mb-0 fw-bold">{modalProduct?.id ? 'Edit Product' : 'Add New Product'}</h5>
              <button className="btn text-muted-custom p-0" onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveProduct}>
              <div className="mb-3">
                <label className="form-label text-muted-custom" style={{ fontSize: '0.8rem' }}>Product Name</label>
                <input required className="form-control custom-select" value={modalProduct?.name || ''} onChange={(e) => setModalProduct({ ...modalProduct, name: e.target.value })} placeholder="e.g. Cyber Security" />
              </div>
              <div className="mb-4">
                <label className="form-label text-muted-custom" style={{ fontSize: '0.8rem' }}>Description</label>
                <textarea className="form-control custom-select" rows={3} value={modalProduct?.description || ''} onChange={(e) => setModalProduct({ ...modalProduct, description: e.target.value })} placeholder="Optional product description..."></textarea>
              </div>
              <div className="d-flex justify-content-end gap-2">
                <button type="button" className="btn btn-sm" style={{ background: 'transparent', color: '#e2e2eb', border: '1px solid rgba(226,226,235,0.2)' }} onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-sm" style={{ background: '#4F46E5', color: '#fff', border: 'none' }}>Save Product</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
