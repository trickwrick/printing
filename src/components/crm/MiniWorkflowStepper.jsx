'use client';

import React from 'react';
import { Check, Shield, UserCog } from 'lucide-react';
import {
  WORKFLOW_STEPS,
  WORKFLOW_STEP_COUNT,
  getWorkflowStepStatus,
} from '@/utils/jobWorkflowProgress';

export default function MiniWorkflowStepper({ completedCount = 0 }) {
  const safeCompleted = Math.min(Math.max(Number(completedCount) || 0, 0), WORKFLOW_STEP_COUNT);
  const linePercent =
    safeCompleted > 0 ? ((safeCompleted - 1) / (WORKFLOW_STEPS.length - 1)) * 100 : 0;

  return (
    <div className="relative w-full py-1.5 px-1">
      <div className="absolute top-[13px] left-[6%] right-[6%] h-[2px] bg-gray-200 rounded-full" />
      <div
        className="absolute top-[13px] left-[6%] h-[2px] bg-emerald-500 rounded-full transition-all duration-500"
        style={{ width: `calc((100% - 12%) * ${linePercent / 100})` }}
      />

      <div className="relative flex items-start justify-between gap-0.5">
        {WORKFLOW_STEPS.map((step) => {
          const status = getWorkflowStepStatus(step.id, safeCompleted);
          const isSuperAdmin = step.role === 'Super Admin';

          return (
            <div key={step.id} className="flex flex-col items-center flex-1 min-w-0 z-10">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[10px] border-2 shrink-0 transition-all ${
                  status === 'done'
                    ? 'bg-emerald-500 border-emerald-100 text-white shadow-sm shadow-emerald-200'
                    : status === 'active'
                      ? 'bg-blue-600 border-blue-100 text-white shadow-md shadow-blue-200 ring-2 ring-blue-100'
                      : 'bg-white border-gray-200 text-gray-400'
                }`}
              >
                {status === 'done' ? <Check size={13} strokeWidth={3} /> : step.id}
              </div>

              <p
                className={`mt-1.5 text-[9px] font-bold text-center leading-tight px-0.5 ${
                  status === 'pending' ? 'text-gray-400' : 'text-gray-900'
                }`}
              >
                {step.title}
              </p>

              <p className="text-[8px] text-gray-400 text-center leading-snug px-0.5 line-clamp-2 hidden sm:block">
                {step.task}
              </p>

              <div
                className={`inline-flex items-center gap-0.5 mt-1 px-1 py-0.5 rounded text-[7px] font-bold uppercase tracking-wide max-w-full ${
                  isSuperAdmin ? 'bg-violet-50 text-violet-600' : 'bg-amber-50 text-amber-700'
                }`}
              >
                {isSuperAdmin ? <Shield size={8} className="shrink-0" /> : <UserCog size={8} className="shrink-0" />}
                <span className="truncate">{step.assignee}</span>
              </div>

              {status === 'done' && (
                <p className="text-[8px] font-bold text-emerald-600 mt-0.5">✓ Complete</p>
              )}
              {status === 'active' && (
                <p className="text-[8px] font-bold text-blue-600 mt-0.5">● In Progress</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
