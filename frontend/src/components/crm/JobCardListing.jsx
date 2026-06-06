'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { PlusSquare, Trash2, Printer, X, Download, Pencil, RefreshCw, Filter, Search, Check, Share2, Loader2 } from 'lucide-react';
import { downloadAsPDF } from '@/utils/pdfExport';
import DeleteConfirmationModal from '@/components/DeleteConfirmationModal';
import JobCardPrintView from '@/components/crm/JobCardPrintView';
import { syncPlateUsageFromCards } from '@/utils/plateUsage';
import { navigateWithEditData } from '@/lib/navigation';
import { printElement } from '@/utils/printDocument';

import { fetchJobCards, deleteJobCard } from '@/utils/jobCardStorage';

export default function JobCardListing() {
  const router = useRouter();
  const [jobCards, setJobCards] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterRef = useRef(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [columnVisibility, setColumnVisibility] = useState(() => {
    const saved = localStorage.getItem('jobCardColumnVisibility');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Error parsing saved visibility:", e);
      }
    }
    return {
      partyName: true,
      jobNumber: true,
      jobDate: true,
      jobQty: true,
      jobName: true,
      pageSize: true,
      pageCount: false,
      printingType: true,
      paper: true,
      paperGSM: true,
      innerPaperGSM: false,
      lamination: true,
      binding: true,
      createdAt: true
    };
  });

  useEffect(() => {
    localStorage.setItem('jobCardColumnVisibility', JSON.stringify(columnVisibility));
  }, [columnVisibility]);

  const loadData = async () => {
    try {
      const data = await fetchJobCards();
      syncPlateUsageFromCards(data);
      setJobCards(data);
    } catch (error) {
      console.error('Error loading job cards:', error);
    }
  };

  useEffect(() => {
    loadData();
    const onUpdate = () => loadData();
    window.addEventListener('jobCardsUpdated', onUpdate);

    const handleClickOutside = (event) => {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setIsFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('jobCardsUpdated', onUpdate);
    };
  }, []);

  const refreshData = () => {
    loadData();
  };

  const getBindingText = (card) => {
    const bindings = [
      { key: 'bindingCenterPin', label: 'Center Pin' },
      { key: 'bindingSilai', label: 'Silai' },
      { key: 'bindingSidePin', label: 'Side Pin' },
      { key: 'bindingFolding', label: 'Folding' },
      { key: 'bindingPerforation', label: 'Perforation' },
      { key: 'bindingNumbring', label: 'Numbring' },
      { key: 'bindingRegister', label: 'Register' }
    ].filter(b => card[b.key]).map(b => b.label);
    return bindings.length > 0 ? bindings : null;
  };

  const formatShortDate = (value) =>
    new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: '2-digit' });

  const formatShortDateTime = (value) => {
    const d = new Date(value);
    return {
      date: d.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: '2-digit' }),
      time: d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
    };
  };

  const exportToCSV = () => {
    const visibleData = jobCards.map(card => {
      const exportRow = {};
      if (columnVisibility.partyName) exportRow['Party Name'] = card.partyName;
      if (columnVisibility.jobNumber) exportRow['Job Number'] = card.jobNumber;
      if (columnVisibility.jobDate) exportRow['Job Date'] = new Date(card.jobDate).toLocaleDateString();
      if (columnVisibility.jobQty) exportRow['Job Qty'] = card.jobQty || 0;
      if (columnVisibility.pageSize) exportRow['Page Size'] = card.pageSize || '-';
      if (columnVisibility.pageCount) exportRow['Page Count'] = card.pageCount || '-';
      if (columnVisibility.printingType) exportRow['Color'] = card.printingType || '-';
      if (columnVisibility.paper) exportRow['Paper'] = card.paper || '-';
      if (columnVisibility.paperGSM) exportRow['Paper GSM'] = card.paperGSM || '-';
      if (columnVisibility.lamination) exportRow['Lamination'] = card.lamination || '-';
      if (columnVisibility.binding) exportRow['Binding'] = (getBindingText(card) || []).join(' • ');
      if (columnVisibility.createdAt) exportRow['Created At'] = new Date(card.createdAt).toLocaleString();
      return exportRow;
    });

    if (visibleData.length === 0) return;

    const headers = Object.keys(visibleData[0]);
    const csvContent = [
      headers.join(','),
      ...visibleData.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `job_card_listing_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleColumn = (col) => {
    setColumnVisibility(prev => ({ ...prev, [col]: !prev[col] }));
  };

  const filteredCards = jobCards.filter(card =>
    card.partyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    card.jobName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    card.jobNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [cardToDelete, setCardToDelete] = useState(null);

  const handleDelete = (id) => {
    setCardToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (cardToDelete) {
      try {
        await deleteJobCard(cardToDelete);
        setJobCards(jobCards.filter((card) => card._id !== cardToDelete));
          setIsDeleteModalOpen(false);
          setCardToDelete(null);
      } catch (error) {
        console.error('Error deleting job card:', error);
      }
    }
  };

  const [selectedCard, setSelectedCard] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openPreview = (card) => {
    setSelectedCard(card);
    setIsModalOpen(true);
  };

  const closePreview = () => {
    setIsModalOpen(false);
    setSelectedCard(null);
  };

  const handlePrint = () => {
    printElement('job-card-print-view');
  };

  const handleSharePDF = async () => {
    await downloadAsPDF(
      'job-card-print-view',
      `JobCard_${selectedCard?.jobNumber || 'preview'}`,
      setIsGenerating
    );
  };

  return (
    <div className="w-full px-0 mt-8 pb-12 max-w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 no-print">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 group flex items-center gap-3">
            <div className="bg-blue-600 w-1.5 h-6 rounded-full" />
            Job Card Listings
          </h1>
          <p className="text-gray-500 mt-1 font-medium text-sm sm:text-base italic">Manage and view all your job cards</p>
        </div>
        <button
          onClick={() => router.push('/job-card')}
          className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-xl shadow-blue-100 hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
        >
          <PlusSquare size={20} />
          Add New Job Card
        </button>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-t-2xl border-x border-t border-gray-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 no-print">
        <div className="relative w-full sm:max-w-xs md:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search keyword..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all"
          />
        </div>

        <div className="flex items-center justify-end gap-2">
          <button
            onClick={refreshData}
            className="p-2.5 text-gray-600 hover:bg-gray-100 rounded-xl transition-all border border-gray-200 group shrink-0"
            title="Refresh Data"
          >
            <RefreshCw size={18} className="group-active:rotate-180 transition-transform duration-500" />
          </button>
          <button
            onClick={exportToCSV}
            className="p-2.5 text-gray-600 hover:bg-gray-100 rounded-xl transition-all border border-gray-200 flex items-center gap-2 text-sm font-semibold shrink-0"
            title="Export CSV"
          >
            <Download size={18} /> <span className="hidden xs:inline">Export</span>
          </button>

          <div className="relative" ref={filterRef}>
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`p-2.5 rounded-xl transition-all border flex items-center gap-2 text-sm font-semibold ${isFilterOpen ? 'bg-blue-50 border-blue-200 text-blue-600' : 'text-gray-600 border-gray-200 hover:bg-gray-100'}`}
            >
              <Filter size={18} /> <span className="hidden xs:inline">Filter</span>
            </button>

            {isFilterOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 p-4 animate-in fade-in zoom-in-95 duration-200">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 px-1">Column Display</h3>
                <div className="space-y-1 max-h-64 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
                  {[
                    { id: 'partyName', label: 'Party Name' },
                    { id: 'jobNumber', label: 'Job Number' },
                    { id: 'jobDate', label: 'Job Date' },
                    { id: 'jobQty', label: 'Job Qty' },
                    { id: 'jobName', label: 'Item Name' },
                    { id: 'pageSize', label: 'Item Size' },
                    { id: 'pageCount', label: 'Page Count' },
                    { id: 'printingType', label: 'Color' },
                    { id: 'paper', label: 'Paper' },
                    { id: 'paperGSM', label: 'Cover GSM' },
                    { id: 'innerPaperGSM', label: 'Inner GSM' },
                    { id: 'lamination', label: 'Lamination' },
                    { id: 'binding', label: 'Binding' },
                    { id: 'createdAt', label: 'Created At' }
                  ].map((col) => (
                    <label key={col.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors group">
                      <span className="text-sm font-medium text-gray-700">{col.label}</span>
                      <div
                        onClick={(e) => { e.preventDefault(); toggleColumn(col.id); }}
                        className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${columnVisibility[col.id] ? 'bg-blue-600 border-blue-600' : 'border-gray-300 bg-white group-hover:border-blue-400'}`}
                      >
                        {columnVisibility[col.id] && <Check size={12} className="text-white" strokeWidth={4} />}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden no-print max-w-full">
        <div className="w-full overflow-hidden">
          <table className="w-full table-fixed text-xs text-left">
            <colgroup>
              <col style={{ width: '28px' }} />
              {columnVisibility.partyName && <col style={{ width: '13%' }} />}
              {columnVisibility.jobNumber && <col style={{ width: '9%' }} />}
              {columnVisibility.jobDate && <col style={{ width: '7%' }} />}
              {columnVisibility.jobQty && <col style={{ width: '10%' }} />}
              {columnVisibility.jobName && <col style={{ width: '14%' }} />}
              {columnVisibility.pageSize && <col style={{ width: '7%' }} />}
              {columnVisibility.pageCount && <col style={{ width: '5%' }} />}
              {columnVisibility.printingType && <col style={{ width: '7%' }} />}
              {columnVisibility.paper && <col style={{ width: '7%' }} />}
              {columnVisibility.paperGSM && <col style={{ width: '5%' }} />}
              {columnVisibility.innerPaperGSM && <col style={{ width: '5%' }} />}
              {columnVisibility.lamination && <col style={{ width: '7%' }} />}
              {columnVisibility.binding && <col style={{ width: '8%' }} />}
              {columnVisibility.createdAt && <col style={{ width: '9%' }} />}
              <col style={{ width: '56px' }} />
            </colgroup>
            <thead>
              <tr className="bg-gray-50 text-gray-500 font-semibold border-b border-gray-100 uppercase tracking-wide text-[10px]">
                <th className="py-2 px-0.5 text-center normal-case tracking-normal">#</th>
                {columnVisibility.partyName && <th className="py-2 px-1.5 break-words whitespace-normal leading-tight">Party Name</th>}
                {columnVisibility.jobNumber && <th className="py-2 px-1.5 whitespace-normal leading-tight">Job No.</th>}
                {columnVisibility.jobDate && <th className="py-2 px-1.5 leading-tight">Date</th>}
                {columnVisibility.jobQty && <th className="py-2 px-1.5 break-words whitespace-normal leading-tight">Qty</th>}
                {columnVisibility.jobName && <th className="py-2 px-1.5 break-words whitespace-normal leading-tight">Item Name</th>}
                {columnVisibility.pageSize && <th className="py-2 px-1.5 break-words whitespace-normal leading-tight">Size</th>}
                {columnVisibility.pageCount && <th className="py-2 px-1.5 leading-tight">Pages</th>}
                {columnVisibility.printingType && <th className="py-2 px-1.5 break-words whitespace-normal leading-tight">Color</th>}
                {columnVisibility.paper && <th className="py-2 px-1.5 break-words whitespace-normal leading-tight">Paper</th>}
                {columnVisibility.paperGSM && <th className="py-2 px-1.5 leading-tight">C.GSM</th>}
                {columnVisibility.innerPaperGSM && <th className="py-2 px-1.5 leading-tight">I.GSM</th>}
                {columnVisibility.lamination && <th className="py-2 px-1.5 break-words whitespace-normal leading-tight">Lam.</th>}
                {columnVisibility.binding && <th className="py-2 px-1.5 break-words whitespace-normal leading-tight">Binding</th>}
                {columnVisibility.createdAt && <th className="py-2 px-1.5 break-words whitespace-normal leading-tight">Created</th>}
                <th className="py-2 px-1 text-center leading-tight">Action</th>
              </tr>
            </thead>
            <tbody className="text-gray-700">
              {filteredCards.length === 0 ? (
                <tr>
                  <td colSpan="20" className="py-8 text-center text-gray-500 text-sm">
                    No job cards found.
                  </td>
                </tr>
              ) : (
                filteredCards.map((card, index) => (
                  <tr key={card._id} className="border-b last:border-0 border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="py-2 px-0.5 text-gray-500 align-top text-center text-[11px]">{index + 1}</td>
                    {columnVisibility.partyName && (
                      <td className="py-2 px-1.5 font-medium text-gray-900 align-top break-words whitespace-normal leading-snug">{card.partyName}</td>
                    )}
                    {columnVisibility.jobNumber && (
                      <td className="py-2 px-1.5 align-top break-words whitespace-normal leading-snug">
                        <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded text-[10px] font-semibold inline-block break-all">
                          {card.jobNumber}
                        </span>
                      </td>
                    )}
                    {columnVisibility.jobDate && (
                      <td className="py-2 px-1.5 text-gray-500 align-top whitespace-normal leading-snug">
                        {formatShortDate(card.jobDate)}
                      </td>
                    )}
                    {columnVisibility.jobQty && (
                      <td className="py-2 px-1.5 text-gray-800 font-semibold align-top break-all whitespace-normal overflow-hidden max-w-0 leading-snug">
                        {card.jobQty || 0}
                      </td>
                    )}
                    {columnVisibility.jobName && (
                      <td className="py-2 px-1.5 text-gray-900 align-top break-words whitespace-normal leading-snug">{card.jobName || '-'}</td>
                    )}
                    {columnVisibility.pageSize && (
                      <td className="py-2 px-1.5 text-gray-700 align-top break-words whitespace-normal leading-snug">{card.pageSize || '-'}</td>
                    )}
                    {columnVisibility.pageCount && (
                      <td className="py-2 px-1.5 text-gray-700 align-top">{card.pageCount || '-'}</td>
                    )}
                    {columnVisibility.printingType && (
                      <td className="py-2 px-1.5 align-top break-words whitespace-normal leading-snug">
                        {card.printingType ? (
                          <span className="bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded text-[10px] font-medium inline-block">{card.printingType}</span>
                        ) : '-'}
                      </td>
                    )}
                    {columnVisibility.paper && (
                      <td className="py-2 px-1.5 text-gray-700 align-top break-words whitespace-normal leading-snug">{card.paper || '-'}</td>
                    )}
                    {columnVisibility.paperGSM && <td className="py-2 px-1.5 text-gray-700 align-top">{card.paperGSM || '-'}</td>}
                    {columnVisibility.innerPaperGSM && <td className="py-2 px-1.5 text-gray-700 align-top">{card.innerPaperGSM || '-'}</td>}
                    {columnVisibility.lamination && (
                      <td className="py-2 px-1.5 align-top break-words whitespace-normal leading-snug">
                        {card.lamination ? (
                          <span className="bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded text-[10px] font-medium inline-block">{card.lamination}</span>
                        ) : <span className="text-gray-400">-</span>}
                      </td>
                    )}
                    {columnVisibility.binding && (
                      <td className="py-2 px-1.5 align-top break-words whitespace-normal leading-snug">
                        {(() => {
                          const chips = getBindingText(card);
                          return chips ? (
                            <div className="flex flex-wrap gap-0.5">
                              {chips.map((b, i) => (
                                <span key={i} className="bg-amber-50 text-amber-700 border border-amber-100 px-1 py-0.5 rounded text-[9px] font-semibold">{b}</span>
                              ))}
                            </div>
                          ) : <span className="text-gray-400">-</span>;
                        })()}
                      </td>
                    )}
                    {columnVisibility.createdAt && (
                      <td className="py-2 px-1.5 text-gray-500 align-top break-words whitespace-normal leading-tight">
                        <span className="block">{formatShortDateTime(card.createdAt).date}</span>
                        <span className="block text-[10px] text-gray-400">{formatShortDateTime(card.createdAt).time}</span>
                      </td>
                    )}
                    <td className="py-2 px-0.5 align-top">
                      <div className="flex items-center justify-center gap-0.5">
                        <button
                          onClick={() => openPreview(card)}
                          className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 p-0.5 rounded transition-colors focus:outline-none"
                          title="Print Preview"
                        >
                          <Printer size={13} />
                        </button>
                        <button
                          onClick={() => navigateWithEditData(router, '/job-card', card)}
                          className="text-teal-500 hover:text-teal-700 hover:bg-teal-50 p-0.5 rounded transition-colors focus:outline-none"
                          title="Edit"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => handleDelete(card._id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 p-0.5 rounded transition-colors focus:outline-none"
                          title="Delete"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Print Preview Modal */}
      {isModalOpen && selectedCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto print-modal-overlay">
          <div className="bg-white border border-gray-300 w-full max-w-4xl relative max-h-[95vh] flex flex-col shadow-xl print-modal-shell">
            <div className="p-4 border-b flex justify-between items-center bg-white no-print">
              <h2 className="text-lg font-bold text-gray-800">Job Card Print Preview</h2>
              <button type="button" onClick={closePreview} className="p-1 hover:bg-gray-100 rounded-full">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto grow a4-page-container bg-gray-50">
              <JobCardPrintView card={selectedCard} />
            </div>

            <div className="p-4 border-t bg-white flex justify-end gap-3 no-print">
              <button
                type="button"
                onClick={closePreview}
                className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded"
              >
                <Printer size={16} />
                Print
              </button>
              <button
                type="button"
                onClick={handleSharePDF}
                disabled={isGenerating}
                className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded ${isGenerating ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
              >
                {isGenerating ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Share2 size={16} />
                    Share PDF
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Are you sure?"
        message="Are you sure you want to move to trash?"
      />
    </div>
  );
}



