'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useRouter } from 'next/navigation';
import { AlertCircle, Printer, X } from 'lucide-react';
import { consumeEditData } from '@/lib/navigation';
import { saveJobCard, resolveServerJobCard } from '@/utils/jobCardStorage';
import { printElement } from '@/utils/printDocument';
import JobCardPrintView from '@/components/crm/JobCardPrintView';

const PLATE_SIZES = ['530x650', '560x670', '700x945', '800x1030', '715x915', '820x1030'];

const FINISHING_COLUMNS = [
  { key: 'lamination', label: 'Lamination' },
  { key: 'dripoff', label: 'Dripoff' },
  { key: 'uv', label: 'U.V.' },
  { key: 'halfCut', label: 'Half Cut' },
  { key: 'die', label: 'Die' },
  { key: 'dieCutting', label: 'Die Cutting' },
  { key: 'cutting', label: 'Cutting' },
  { key: 'creasingFold', label: 'Creasing/Fold' },
  { key: 'total', label: 'Total' },
];

const emptyCell = () => ({ ticked: null });

const emptyFinishingRow = () =>
  Object.fromEntries(FINISHING_COLUMNS.map((c) => [c.key, emptyCell()]));

const normalizeFinishingRow = (row) =>
  Object.fromEntries(
    FINISHING_COLUMNS.map((c) => {
      const cell = row[c.key];
      if (cell && typeof cell === 'object' && 'ticked' in cell) {
        const { ticked } = cell;
        if (ticked === null || ticked === undefined) {
          return [c.key, { ticked: null }];
        }
        return [c.key, { ticked: !!ticked }];
      }
      const val = cell != null ? String(cell) : '';
      if (!val.trim()) return [c.key, { ticked: null }];
      return [c.key, { ticked: true }];
    }),
  );

const FINISHING_ROW_COUNT = 1;

const defaultFinishingRows = () =>
  Array.from({ length: FINISHING_ROW_COUNT }, () => emptyFinishingRow());

const parseFinishingRows = (editData) => {
  if (!editData?.bindingNote) return defaultFinishingRows();
  try {
    const parsed = JSON.parse(editData.bindingNote);
    if (Array.isArray(parsed) && parsed.length) {
      const rows = parsed.map(normalizeFinishingRow).slice(0, FINISHING_ROW_COUNT);
      while (rows.length < FINISHING_ROW_COUNT) rows.push(emptyFinishingRow());
      return rows;
    }
  } catch {
    /* ignore */
  }
  return defaultFinishingRows();
};

const fieldClass =
  'h-10 border border-gray-200 rounded-lg px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all w-full';

const Section = ({ badge, badgeColor, children }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 relative pt-10">
    <div
      className={`absolute top-0 left-6 -translate-y-1/2 ${badgeColor} text-white px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold shadow-sm`}
    >
      {badge}
    </div>
    {children}
  </div>
);

const validateForm = ({ fd, plateSize, setCover, setInner, finishingRows }) => {
  const errors = [];
  const req = (val, label) => {
    if (!String(val || '').trim()) errors.push(label);
  };

  req(fd.get('partyName'), 'Party Name');
  req(fd.get('jobName'), 'Job Name');
  if (!plateSize) errors.push('Plate Size');
  req(fd.get('paperSize'), 'Paper Size');
  req(fd.get('paperGSM'), 'GSM');
  req(fd.get('cuttingSize'), 'Cutting Size');
  req(fd.get('parts'), 'Parts');
  req(fd.get('printingQty'), 'Print Quantity');

  if (!setCover && !setInner) errors.push('Cover Pages ya Inner Pages — koi ek select karo');

  let tickedCount = 0;
  finishingRows.forEach((row, rowIdx) => {
    FINISHING_COLUMNS.forEach((col) => {
      const cell = row[col.key];
      if (cell.ticked === true) tickedCount += 1;
    });
  });

  if (tickedCount === 0) {
    errors.push('Finishing Processes — kam se kam ek process Yes karo');
  }

  return errors;
};

export default function JobCardForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editIdParam = searchParams.get('editId');
  const isEditMode = Boolean(editIdParam && editIdParam !== 'new');
  const [editData, setEditData] = useState(null);
  const [loadingEdit, setLoadingEdit] = useState(isEditMode);
  const formRef = React.useRef(null);

  useEffect(() => {
    let cancelled = false;

    async function loadEditData() {
      const fromSession = consumeEditData();
      if (fromSession) {
        const resolved = await resolveServerJobCard(fromSession);
        if (!cancelled) {
          setEditData(resolved);
          setLoadingEdit(false);
        }
        return;
      }

      if (editIdParam && editIdParam !== 'new') {
        try {
          const response = await fetch(`/api/jobcard/${editIdParam}`, { cache: 'no-store' });
          if (response.ok) {
            const data = await resolveServerJobCard(await response.json());
            if (!cancelled) {
              setEditData(data);
              setLoadingEdit(false);
            }
            return;
          }
        } catch {
          /* fall through */
        }
      }

      if (!cancelled) {
        setEditData(null);
        setLoadingEdit(false);
      }
    }

    loadEditData();
    return () => {
      cancelled = true;
    };
  }, [editIdParam]);

  const [jobDate, setJobDate] = useState(new Date());
  const [plateType, setPlateType] = useState('New Plate');
  const [plateSize, setPlateSize] = useState('');
  const [printSide, setPrintSide] = useState('Single Side');
  const [setCover, setSetCover] = useState(false);
  const [setInner, setSetInner] = useState(false);
  const [finishingRows, setFinishingRows] = useState(() => defaultFinishingRows());
  const [remarks, setRemarks] = useState('');
  const [formErrors, setFormErrors] = useState([]);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [previewData, setPreviewData] = useState(null);

  useEffect(() => {
    if (!editData) return;
    setJobDate(editData.jobDate ? new Date(editData.jobDate) : new Date());
    setPlateType(
      editData.plateType === 'Old' || editData.plateType === 'Old Plate' ? 'Old Plate' : 'New Plate',
    );
    setPlateSize(editData.plateSize || '');
    setPrintSide(editData.printSheet === 'Both Side' ? 'Both Side' : 'Single Side');
    setSetCover(
      editData.coverPaperDetails?.includes('Cover') || Number(editData.coverPaperCount) > 0,
    );
    setSetInner(
      editData.innerPaperDetails?.includes('Inner') || Number(editData.innerPaperCount) > 0,
    );
    setFinishingRows(parseFinishingRows(editData));
    setRemarks(editData.notes || '');
  }, [editData]);

  const buildPreviewData = () => {
    if (!formRef.current) return null;
    const fd = new FormData(formRef.current);
    return {
      partyName: fd.get('partyName'),
      jobName: fd.get('jobName'),
      jobNumber: editData?.jobNumber || fd.get('jobNumber') || 'Auto',
      jobDate,
      plateType: plateType === 'Old Plate' ? 'Old' : 'New',
      plateSize,
      paperSize: fd.get('paperSize'),
      paperGSM: fd.get('paperGSM'),
      cuttingSize: fd.get('cuttingSize'),
      pageCount: fd.get('parts'),
      printingQty: fd.get('printingQty'),
      printSheet: printSide,
      setCover,
      setInner,
      coverPaperDetails: setCover ? 'Cover Pages' : '',
      innerPaperDetails: setInner ? 'Inner Pages' : '',
      bindingNote: JSON.stringify(finishingRows),
      notes: remarks,
    };
  };

  const handleOpenPrint = () => {
    setPreviewData(buildPreviewData());
    setShowPrintPreview(true);
  };

  const handlePrint = () => {
    printElement('job-card-print-view');
  };

  const toggleFinishingTick = (rowIdx, key, ticked) => {
    setFinishingRows((rows) =>
      rows.map((row, i) => (i === rowIdx ? { ...row, [key]: { ticked } } : row)),
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);

    const errors = validateForm({ fd, plateSize, setCover, setInner, finishingRows });
    if (errors.length) {
      setFormErrors(errors);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setFormErrors([]);

    const jobCard = {
      partyName: fd.get('partyName'),
      companyName: fd.get('partyName'),
      jobName: fd.get('jobName'),
      jobNumber: editData?.jobNumber || undefined,
      jobDate: jobDate.toISOString(),
      plateType: plateType === 'Old Plate' ? 'Old' : 'New',
      plateSize: plateSize || undefined,
      paperSize: fd.get('paperSize'),
      paperGSM: fd.get('paperGSM'),
      cuttingSize: fd.get('cuttingSize'),
      pageCount: fd.get('parts'),
      printingQty: fd.get('printingQty'),
      jobQty: fd.get('printingQty') || '0',
      printSheet: printSide,
      coverPaperDetails: setCover ? 'Cover Pages' : '',
      innerPaperDetails: setInner ? 'Inner Pages' : '',
      coverPaperCount: setCover ? 1 : 0,
      innerPaperCount: setInner ? 1 : 0,
      bindingNote: JSON.stringify(finishingRows),
      notes: remarks,
    };

    const completionDays = fd.get('completionDays');
    if (completionDays !== null && String(completionDays).trim() !== '') {
      jobCard.completionDays = Number(completionDays);
    }

    const hiddenId = fd.get('_id');
    const cardId = hiddenId || editData?._id || (isEditMode ? editIdParam : null);

    if (isEditMode && (!cardId || String(cardId).startsWith('local_'))) {
      alert('Edit mode error: job card server id missing. List se dubara edit karo.');
      return;
    }

    if (cardId) jobCard._id = String(cardId).trim();

    try {
      const result = await saveJobCard(jobCard, {
        editId: isEditMode ? editIdParam : undefined,
      });
      window.dispatchEvent(new Event('fetchNotifications'));
      if (!result.dbSaved) {
        alert(
          `Job card saved on this device only.\nDatabase error: ${result.dbError}\n\nVercel par MONGO_URI set karo aur MongoDB Atlas mein IP whitelist (0.0.0.0/0) allow karo.`,
        );
      }
      router.push('/job-card-list');
    } catch {
      alert('Save failed. Please try again.');
    }
  };

  return (
    <>
    {loadingEdit || (isEditMode && !editData) ? (
      <div className="mx-auto mt-8 pb-12 text-center text-gray-500">Loading job card...</div>
    ) : (
    <form
      key={editData?._id ? String(editData._id) : editIdParam || 'new-job-card'}
      ref={formRef}
      onSubmit={handleSubmit}
      className="mx-auto mt-8 pb-12"
    >
      {(editData?._id || (isEditMode && editIdParam)) && (
        <input type="hidden" name="_id" value={String(editData?._id || editIdParam)} />
      )}

      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div className="bg-blue-600 w-1.5 h-6 rounded-full" />
            Manage Job Card
          </h1>
          <p className="text-gray-500 mt-1 text-sm sm:text-base italic">Enter job card details below</p>
        </div>
        <button
          type="button"
          onClick={handleOpenPrint}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          <Printer size={16} />
          Preview & Print
        </button>
      </div>

      {formErrors.length > 0 && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={20} />
            <div>
              <p className="text-sm font-bold text-red-700 mb-2">
                Job card save nahi hoga — pehle ye sab complete karo:
              </p>
              <ul className="text-sm text-red-600 space-y-1 list-disc list-inside">
                {formErrors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6 sm:space-y-8">
        <Section badge="Basic Details" badgeColor="bg-blue-600">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">Party Name *</label>
              <input type="text" name="partyName" defaultValue={editData?.partyName} required className={fieldClass} placeholder="Enter party name" />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">Job Name *</label>
              <input type="text" name="jobName" defaultValue={editData?.jobName} required className={fieldClass} placeholder="Enter job name" />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">Job Number</label>
              <input
                type="text"
                name="jobNumber"
                defaultValue={editData?.jobNumber || ''}
                readOnly
                className={`${fieldClass} bg-gray-50 font-semibold text-red-600`}
                placeholder="Auto on save"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">Date</label>
              <DatePicker selected={jobDate} onChange={(date) => setJobDate(date)} wrapperClassName="w-full" className={fieldClass} />
            </div>
          </div>
        </Section>

        <Section badge="Plate Details" badgeColor="bg-indigo-600">
          <div className="mb-6">
            <label className="text-sm font-medium text-gray-700 mb-2 block">Plate Type</label>
            <div className="flex items-center gap-6 h-10">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="plateTypeRadio" checked={plateType === 'New Plate'} onChange={() => setPlateType('New Plate')} className="w-4 h-4 text-indigo-600" />
                <span className="text-sm text-gray-700">New Plate</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="plateTypeRadio" checked={plateType === 'Old Plate'} onChange={() => setPlateType('Old Plate')} className="w-4 h-4 text-indigo-600" />
                <span className="text-sm text-gray-700">Old Plate</span>
              </label>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-3 block">Plate Size *</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {PLATE_SIZES.map((size) => (
                <label
                  key={size}
                  className={`flex items-center gap-2 h-10 border rounded-lg px-3 cursor-pointer text-sm transition-all ${
                    plateSize === size
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700 font-semibold ring-2 ring-indigo-500/20'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
                >
                  <input type="radio" name="plateSizeRadio" checked={plateSize === size} onChange={() => setPlateSize(size)} className="w-4 h-4 text-indigo-600" />
                  {size}
                </label>
              ))}
            </div>
          </div>
        </Section>

        <Section badge="Paper Details" badgeColor="bg-sky-600">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">Paper Size *</label>
              <input type="text" name="paperSize" defaultValue={editData?.paperSize} required className={fieldClass} placeholder="Paper size" />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">GSM *</label>
              <input type="text" name="paperGSM" defaultValue={editData?.paperGSM} required className={fieldClass} placeholder="e.g. 350" />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">Cutting Size *</label>
              <input type="text" name="cuttingSize" defaultValue={editData?.cuttingSize} required className={fieldClass} placeholder="Cutting size" />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">Parts *</label>
              <input type="text" name="parts" defaultValue={editData?.pageCount} required className={fieldClass} placeholder="Parts" />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">Print Quantity *</label>
              <input type="text" name="printingQty" defaultValue={editData?.printingQty} required className={fieldClass} placeholder="e.g. 1000" />
            </div>
          </div>
        </Section>

        <Section badge="Set & Side Details" badgeColor="bg-purple-600">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-3 block">Set *</label>
              <div className="space-y-3">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input type="checkbox" checked={setCover} onChange={(e) => setSetCover(e.target.checked)} className="w-4 h-4 text-purple-600 rounded" />
                  <span className="text-sm text-gray-700">(I) Cover Pages</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input type="checkbox" checked={setInner} onChange={(e) => setSetInner(e.target.checked)} className="w-4 h-4 text-purple-600 rounded" />
                  <span className="text-sm text-gray-700">(II) Inner Pages</span>
                </label>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-3 block">Sides</label>
              <div className="flex items-center gap-6 h-10">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" checked={printSide === 'Single Side'} onChange={() => setPrintSide('Single Side')} className="w-4 h-4 text-purple-600" />
                  <span className="text-sm text-gray-700">Single Side</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" checked={printSide === 'Both Side'} onChange={() => setPrintSide('Both Side')} className="w-4 h-4 text-purple-600" />
                  <span className="text-sm text-gray-700">Both Side</span>
                </label>
              </div>
            </div>
          </div>
        </Section>

        <Section badge="Finishing Processes" badgeColor="bg-amber-600">
          <div className="overflow-x-auto -mx-2 px-2">
            <table className="w-full min-w-[800px] border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50">
                  {FINISHING_COLUMNS.map((col) => (
                    <th key={col.key} className="border border-gray-200 px-1 py-2 text-xs font-semibold text-gray-600 uppercase tracking-wide text-center min-w-[90px]">
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {finishingRows.map((row, rowIdx) => (
                  <tr key={rowIdx} className="hover:bg-gray-50/50">
                    {FINISHING_COLUMNS.map((col) => {
                      const cell = row[col.key];
                      return (
                        <td key={col.key} className="border border-gray-200 p-1.5 align-middle">
                          <div className="flex items-center justify-center gap-2 text-[10px] font-medium text-gray-600">
                            <label className="flex items-center gap-0.5 cursor-pointer">
                              <input
                                type="radio"
                                name={`fin-${rowIdx}-${col.key}`}
                                checked={cell.ticked === true}
                                onChange={() => toggleFinishingTick(rowIdx, col.key, true)}
                                className="w-3 h-3 text-emerald-600"
                              />
                              <span>Yes</span>
                            </label>
                            <label className="flex items-center gap-0.5 cursor-pointer">
                              <input
                                type="radio"
                                name={`fin-${rowIdx}-${col.key}`}
                                checked={cell.ticked === false}
                                onChange={() => toggleFinishingTick(rowIdx, col.key, false)}
                                className="w-3 h-3 text-gray-400"
                              />
                              <span>No</span>
                            </label>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        <Section badge="Time Period" badgeColor="bg-rose-600">
          <div className="max-w-xs">
            <label className="text-sm font-medium text-gray-700 mb-1">
              Expected completion time (in days)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                name="completionDays"
                min="1"
                defaultValue={editData?.completionDays ?? ''}
                className={fieldClass}
                placeholder="e.g. 7"
              />
              <span className="text-sm font-semibold text-gray-600 shrink-0">Days</span>
            </div>
          </div>
        </Section>

        <Section badge="Remarks" badgeColor="bg-teal-600">
          <div className="w-full">
            <label className="text-sm text-gray-700 mb-2 block font-semibold tracking-wide">Remarks</label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows={5}
              className="w-full border border-gray-200 rounded-xl px-4 py-4 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all resize-none shadow-sm text-sm"
              placeholder="Enter any extra instructions or remarks here..."
            />
          </div>
        </Section>
      </div>

      <div className="mt-8 flex justify-end">
        <button
          type="submit"
          className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-xl shadow-md hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          {editData ? 'Update Job Card' : 'Save Job Card'}
        </button>
      </div>
    </form>
    )}

    {showPrintPreview && previewData && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto print-modal-overlay">
        <div className="bg-white border border-gray-300 w-full max-w-4xl relative max-h-[95vh] flex flex-col shadow-xl print-modal-shell">
          <div className="p-4 border-b flex justify-between items-center bg-white no-print">
            <h2 className="text-lg font-bold text-gray-800">Job Card Print Preview</h2>
            <button type="button" onClick={() => setShowPrintPreview(false)} className="p-1 hover:bg-gray-100 rounded-full">
              <X size={20} />
            </button>
          </div>
          <div className="p-6 overflow-y-auto grow a4-page-container bg-gray-50">
            <JobCardPrintView card={previewData} />
          </div>
          <div className="p-4 border-t bg-white flex justify-end gap-3 no-print">
            <button
              type="button"
              onClick={() => setShowPrintPreview(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded hover:bg-gray-50"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded"
            >
              <Printer size={16} />
              Print
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
