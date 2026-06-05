'use client';

import React from 'react';
import { Phone, Mail } from 'lucide-react';

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

export function parseFinishingFromCard(card) {
  if (!card?.bindingNote) return [Object.fromEntries(FINISHING_COLUMNS.map((c) => [c.key, { ticked: false }]))];
  try {
    const parsed = JSON.parse(card.bindingNote);
    if (Array.isArray(parsed) && parsed.length) return parsed;
  } catch {
    /* ignore */
  }
  return [Object.fromEntries(FINISHING_COLUMNS.map((c) => [c.key, { ticked: false }]))];
}

const fmtDate = (value) => {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const Cell = ({ children, className = '', colSpan }) => (
  <td colSpan={colSpan} className={`border border-gray-400 px-2 py-1.5 text-[11px] ${className}`}>{children}</td>
);

const LabelCell = ({ children }) => (
  <td className="border border-gray-400 px-2 py-1.5 text-[10px] font-bold uppercase bg-gray-50 whitespace-nowrap">
    {children}
  </td>
);

const YesNo = ({ yes }) => (
  <span className="inline-flex items-center gap-2 text-[10px] font-semibold">
    <span>{yes ? '☑' : '☐'} Yes</span>
    <span>{!yes ? '☑' : '☐'} No</span>
  </span>
);

const Check = ({ checked, label }) => (
  <span className="inline-flex items-center gap-1 text-[11px] mr-3">
    <span className="font-bold">{checked ? '☑' : '☐'}</span>
    {label}
  </span>
);

export default function JobCardPrintView({ card, printId = 'job-card-print-view' }) {
  const finishingRows = parseFinishingFromCard(card);
  const finishingRow = finishingRows[0] || {};
  const plateType = card?.plateType === 'Old' || card?.plateType === 'Old Plate' ? 'Old' : 'New';
  const setCover = card?.setCover != null
    ? card.setCover
    : (card?.coverPaperDetails?.includes('Cover') || Number(card?.coverPaperCount) > 0);
  const setInner = card?.setInner != null
    ? card.setInner
    : (card?.innerPaperDetails?.includes('Inner') || Number(card?.innerPaperCount) > 0);
  const printSide = card?.printSheet || card?.printSide || 'Single Side';

  return (
    <div id={printId} className="a4-page bg-white text-gray-900 font-sans">
      {/* Header */}
      <div className="flex justify-between items-start border-b-2 border-gray-800 pb-3 mb-4">
        <div>
          <h1 className="text-2xl font-black leading-tight">
            Shree Om <span className="text-blue-700">Printing Press</span>
          </h1>
          <p className="text-[9px] font-semibold text-gray-700 mt-1">
            Office: J-97, Ashok Chowk, Adarsh Nagar, Jaipur-302004
          </p>
          <p className="text-[9px] font-semibold text-gray-700">
            Factory: G-139, Hirawala Industrial Area, Kanota, Agra Road, Jaipur
          </p>
          <div className="flex gap-3 mt-1 text-[9px] font-semibold text-gray-700">
            <span className="flex items-center gap-1"><Phone size={9} /> 0141-2600850, 9414043763</span>
            <span className="flex items-center gap-1"><Mail size={9} /> shreeomprinting@gmail.com</span>
          </div>
        </div>
        <div className="text-right">
          <div className="bg-blue-700 text-white px-4 py-1 text-xs font-black uppercase tracking-widest">
            Job Card
          </div>
          <p className="text-[9px] font-bold mt-2">GSTIN: 08AALPC9959M1ZV</p>
        </div>
      </div>

      {/* Basic Details */}
      <table className="w-full border-collapse mb-4">
        <tbody>
          <tr>
            <LabelCell>Party Name</LabelCell>
            <Cell className="font-bold uppercase">{card?.partyName || '-'}</Cell>
            <LabelCell>Job Name</LabelCell>
            <Cell className="font-bold uppercase">{card?.jobName || '-'}</Cell>
          </tr>
          <tr>
            <LabelCell>Job Number</LabelCell>
            <Cell className="font-bold text-red-700">{card?.jobNumber || 'Auto'}</Cell>
            <LabelCell>Date</LabelCell>
            <Cell>{fmtDate(card?.jobDate)}</Cell>
          </tr>
        </tbody>
      </table>

      {/* Plate Details */}
      <table className="w-full border-collapse mb-4">
        <tbody>
          <tr>
            <LabelCell>Plate Type</LabelCell>
            <Cell colSpan={3}>
              <Check checked={plateType === 'New'} label="New Plate" />
              <Check checked={plateType === 'Old'} label="Old Plate" />
            </Cell>
          </tr>
          <tr>
            <LabelCell>Plate Size</LabelCell>
            <Cell colSpan={3}>
              <div className="flex flex-wrap gap-x-3 gap-y-1">
                {PLATE_SIZES.map((size) => (
                  <span key={size} className={`text-[10px] font-semibold ${card?.plateSize === size ? 'text-blue-700 underline' : ''}`}>
                    {card?.plateSize === size ? '☑' : '☐'} {size}
                  </span>
                ))}
              </div>
            </Cell>
          </tr>
        </tbody>
      </table>

      {/* Paper Details */}
      <table className="w-full border-collapse mb-4">
        <thead>
          <tr className="bg-gray-100">
            {['Paper Size', 'GSM', 'Cutting Size', 'Parts', 'Print Quantity'].map((h) => (
              <th key={h} className="border border-gray-400 px-2 py-1 text-[10px] font-bold uppercase">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <Cell className="text-center font-semibold">{card?.paperSize || '-'}</Cell>
            <Cell className="text-center font-semibold">{card?.paperGSM || '-'}</Cell>
            <Cell className="text-center font-semibold">{card?.cuttingSize || '-'}</Cell>
            <Cell className="text-center font-semibold">{card?.pageCount || '-'}</Cell>
            <Cell className="text-center font-bold text-blue-700">{card?.printingQty || card?.jobQty || '-'}</Cell>
          </tr>
        </tbody>
      </table>

      {/* Set & Side */}
      <table className="w-full border-collapse mb-4">
        <tbody>
          <tr>
            <LabelCell>Set</LabelCell>
            <Cell>
              <Check checked={setCover} label="(I) Cover Pages" />
              <Check checked={setInner} label="(II) Inner Pages" />
            </Cell>
            <LabelCell>Print Side</LabelCell>
            <Cell>
              <Check checked={printSide === 'Single Side'} label="Single Side" />
              <Check checked={printSide === 'Both Side'} label="Both Side" />
            </Cell>
          </tr>
        </tbody>
      </table>

      {/* Finishing Processes */}
      <p className="text-[10px] font-black uppercase mb-1 tracking-wide">Finishing Processes</p>
      <table className="w-full border-collapse mb-4">
        <thead>
          <tr className="bg-gray-100">
            {FINISHING_COLUMNS.map((col) => (
              <th key={col.key} className="border border-gray-400 px-1 py-1 text-[9px] font-bold uppercase text-center">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            {FINISHING_COLUMNS.map((col) => {
              const cell = finishingRow[col.key];
              const ticked = cell?.ticked ?? false;
              return (
                <td key={col.key} className="border border-gray-400 px-1 py-1.5 text-center">
                  <YesNo yes={ticked} />
                </td>
              );
            })}
          </tr>
        </tbody>
      </table>

      {/* Remarks */}
      <table className="w-full border-collapse mb-6">
        <tbody>
          <tr>
            <LabelCell>Remarks</LabelCell>
            <Cell className="min-h-[40px] align-top">{card?.notes || '-'}</Cell>
          </tr>
        </tbody>
      </table>

      {/* Signatures */}
      <div className="grid grid-cols-2 gap-8 mt-8 pt-4 border-t border-gray-300">
        <div className="text-center">
          <div className="border-b border-gray-400 h-10 mb-1" />
          <p className="text-[10px] font-bold uppercase">Office Signature</p>
        </div>
        <div className="text-center">
          <div className="border-b border-gray-400 h-10 mb-1" />
          <p className="text-[10px] font-bold uppercase">Press Signature</p>
        </div>
      </div>
    </div>
  );
}
