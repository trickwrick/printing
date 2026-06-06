'use client';

import React from 'react';
import { Clock } from 'lucide-react';
import {
  formatDaysLeftLabel,
  getDaysLeft,
  getDaysLeftTone,
} from '@/utils/completionDays';

const toneStyles = {
  ok: 'bg-emerald-50 border-emerald-200 text-emerald-700',
  warning: 'bg-amber-50 border-amber-200 text-amber-700',
  urgent: 'bg-orange-50 border-orange-200 text-orange-700',
  overdue: 'bg-rose-50 border-rose-200 text-rose-700',
  neutral: 'bg-gray-50 border-gray-200 text-gray-500',
};

export default function DaysLeftBadge({ card }) {
  const daysLeft = getDaysLeft(card);
  const label = formatDaysLeftLabel(daysLeft);

  if (label == null) return null;

  const tone = getDaysLeftTone(daysLeft);
  const displayNumber =
    daysLeft > 0 ? daysLeft : daysLeft === 0 ? 0 : Math.abs(daysLeft);

  return (
    <div
      className={`shrink-0 min-w-[72px] rounded-xl border px-2.5 py-2 text-center ${toneStyles[tone]}`}
      title={`Time period: ${card.completionDays} days from job date`}
    >
      <div className="flex items-center justify-center gap-1 mb-0.5">
        <Clock size={11} className="shrink-0 opacity-80" />
        <span className="text-[8px] font-bold uppercase tracking-wide opacity-80">Time Left</span>
      </div>
      <p className="text-xl font-black leading-none tabular-nums">{displayNumber}</p>
      <p className="text-[9px] font-bold leading-tight mt-1">
        {daysLeft > 1 && 'days left'}
        {daysLeft === 1 && 'day left'}
        {daysLeft === 0 && 'due today'}
        {daysLeft < 0 && 'overdue'}
      </p>
      <p className="text-[8px] font-medium opacity-75 mt-1 hidden md:block">{label}</p>
    </div>
  );
}
