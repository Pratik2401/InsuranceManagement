'use client';

import React, { useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Download, Upload, FileSpreadsheet, File as FileTextIcon, ChevronDown } from 'lucide-react';

/* ─── EXPORT BUTTON ─── */

interface ExportDropdownProps {
  data: any[];
  columns: { header: string; key: string }[];
  filename: string;
}

export function ExportDropdown({ data, columns, filename }: ExportDropdownProps) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleExportExcel = () => {
    if (!data.length) return;
    // Map data based on columns
    const mappedData = data.map(item => {
      const row: any = {};
      columns.forEach(c => { row[c.header] = item[c.key]; });
      return row;
    });
    const worksheet = XLSX.utils.json_to_sheet(mappedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
    XLSX.writeFile(workbook, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
    setOpen(false);
  };

  const handleExportPDF = () => {
    if (!data.length) return;
    const doc = new jsPDF();
    const tableHeaders = columns.map(c => c.header);
    const tableData = data.map(item => columns.map(c => String(item[c.key])));

    autoTable(doc, {
      head: [tableHeaders],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229] }, // brand color
      styles: { fontSize: 8, font: 'helvetica' },
    });

    doc.save(`${filename}_${new Date().toISOString().split('T')[0]}.pdf`);
    setOpen(false);
  };

  return (
    <div className="position-relative" ref={dropdownRef}>
      <button 
        className="btn btn-sm d-flex align-items-center gap-2"
        style={{ background: 'rgba(255,255,255,0.05)', color: '#e2e2eb', border: 'none', fontWeight: 600, fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
        onClick={() => setOpen(!open)}
      >
        <Download size={14} />
        Export
        <ChevronDown size={14} className="opacity-50" />
      </button>

      {open && (
        <div 
          className="position-absolute end-0 mt-2 rounded shadow-lg overflow-hidden z-3"
          style={{ background: '#282a30', border: '1px solid rgba(70, 69, 85, 0.4)', minWidth: '160px' }}
        >
          <button className="d-flex align-items-center gap-2 w-100 p-2 border-0 text-start" 
            style={{ background: 'transparent', color: '#e2e2eb', fontSize: '0.8rem', transition: 'background 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            onClick={handleExportExcel}>
            <FileSpreadsheet size={14} className="text-success" />
            Excel (.xlsx)
          </button>
          <button className="d-flex align-items-center gap-2 w-100 p-2 border-0 text-start" 
            style={{ background: 'transparent', color: '#e2e2eb', fontSize: '0.8rem', transition: 'background 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            onClick={handleExportPDF}>
            <FileTextIcon size={14} className="text-danger" />
            PDF (.pdf)
          </button>
        </div>
      )}
    </div>
  );
}

/* ─── IMPORT BUTTON ─── */

interface ImportExcelButtonProps {
  onImport: (mappedData: any[]) => void;
  columnMap: Record<string, string>; // Maps Excel column names to internal keys
}

export function ImportExcelButton({ onImport, columnMap }: ImportExcelButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const rawData = XLSX.utils.sheet_to_json<any>(ws);

      // Map raw data based on columnMap
      const mappedData = rawData.map((row: any) => {
        const newRow: any = {};
        Object.keys(columnMap).forEach(excelHeader => {
          if (row[excelHeader] !== undefined) {
             newRow[columnMap[excelHeader]] = row[excelHeader];
          }
        });
        return newRow;
      });

      onImport(mappedData);
    };
    reader.readAsBinaryString(file);
    
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <>
      <input 
        type="file" 
        accept=".xlsx, .xls" 
        style={{ display: 'none' }} 
        ref={fileInputRef} 
        onChange={handleFile} 
      />
      <button 
        className="btn btn-sm d-flex align-items-center gap-2"
        style={{ background: '#4F46E5', color: '#fff', border: 'none', fontWeight: 600, fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload size={14} />
        Import Data
      </button>
    </>
  );
}
