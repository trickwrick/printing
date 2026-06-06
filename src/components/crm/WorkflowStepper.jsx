'use client';

import React, { useEffect, useState } from 'react';
import { Check, ChevronRight, RotateCcw, Shield, UserCog } from 'lucide-react';
import {
  WORKFLOW_STORAGE_KEY,
  getJobCardId,
  WORKFLOW_STEPS,
  getWorkflowStepStatus,
} from '@/utils/jobWorkflowProgress';

const getJobId = getJobCardId;

export default function WorkflowStepper({ jobCards = [] }) {
  const [selectedJobId, setSelectedJobId] = useState('');
  const [progressMap, setProgressMap] = useState({});

  useEffect(() => {
    try {
      const saved = localStorage.getItem(WORKFLOW_STORAGE_KEY);
      if (saved) setProgressMap(JSON.parse(saved));
    } catch {
      setProgressMap({});
    }
  }, []);

  useEffect(() => {
    if (!selectedJobId && jobCards.length > 0) {
      setSelectedJobId(getJobId(jobCards[0]));
    }
  }, [jobCards, selectedJobId]);

  const saveProgress = (updated) => {
    setProgressMap(updated);
    localStorage.setItem(WORKFLOW_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event('jobWorkflowUpdated'));
  };

  const completedCount = selectedJobId ? progressMap[selectedJobId] || 0 : 0;
  const selectedJob = jobCards.find((j) => getJobId(j) === selectedJobId);
  const allDone = completedCount >= WORKFLOW_STEPS.length;
  const activeStep = allDone ? null : completedCount + 1;

  const completeNextStep = () => {
    if (!selectedJobId || allDone) return;
    saveProgress({ ...progressMap, [selectedJobId]: completedCount + 1 });
  };

  const resetWorkflow = () => {
    if (!selectedJobId) return;
    saveProgress({ ...progressMap, [selectedJobId]: 0 });
  };

  const getStepStatus = (stepId) => getWorkflowStepStatus(stepId, completedCount);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-7 mb-8">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
        <div>
          <h3 className="text-lg font-black text-gray-900">Job Workflow Progress</h3>
          <p className="text-xs text-gray-400 mt-1">
            Step-by-step — pehle wala complete → tick ✓, phir agla step start
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <select
            value={selectedJobId}
            onChange={(e) => setSelectedJobId(e.target.value)}
            className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30 min-w-[220px]"
            disabled={jobCards.length === 0}
          >
            {jobCards.length === 0 ? (
              <option value="">No job cards</option>
            ) : (
              jobCards.map((job) => (
                <option key={getJobId(job)} value={getJobId(job)}>
                  {job.jobNumber} — {job.partyName}
                </option>
              ))
            )}
          </select>

          {selectedJobId && (
            <button
              onClick={resetWorkflow}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-bold transition-colors"
            >
              <RotateCcw size={15} />
              Reset
            </button>
          )}
        </div>
      </div>

      {jobCards.length === 0 ? (
        <div className="text-center py-10 text-gray-400 text-sm italic border border-dashed border-gray-200 rounded-2xl">
          Pehle job card banao, phir yahan step-by-step progress dikhegi
        </div>
      ) : (
        <>
          {selectedJob && (
            <div className="mb-6 p-4 rounded-xl bg-blue-50/60 border border-blue-100 flex flex-wrap items-center gap-3 text-sm">
              <span className="font-black text-blue-800">{selectedJob.jobNumber}</span>
              <ChevronRight size={14} className="text-blue-300" />
              <span className="font-semibold text-gray-800">{selectedJob.partyName}</span>
              <span className="ml-auto text-xs font-bold text-blue-600 bg-white px-3 py-1 rounded-full border border-blue-100">
                {completedCount} / {WORKFLOW_STEPS.length} steps done
              </span>
            </div>
          )}

          {/* Desktop stepper */}
          <div className="hidden md:block">
            <div className="relative flex items-start justify-between">
              <div className="absolute top-6 left-0 right-0 h-1 bg-gray-100 rounded-full mx-12" />
              <div
                className="absolute top-6 left-0 h-1 bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full mx-12 transition-all duration-700 ease-out"
                style={{
                  width: `calc(${completedCount > 0 ? ((completedCount - 1) / (WORKFLOW_STEPS.length - 1)) * 100 : 0}% - 6rem)`,
                  maxWidth: 'calc(100% - 6rem)',
                }}
              />

              {WORKFLOW_STEPS.map((step) => {
                const status = getStepStatus(step.id);
                const isSuperAdmin = step.role === 'Super Admin';

                return (
                  <div key={step.id} className="relative flex flex-col items-center flex-1 z-10 px-2">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-sm border-4 transition-all duration-500 ${
                        status === 'done'
                          ? 'bg-emerald-500 border-emerald-100 text-white shadow-lg shadow-emerald-200 scale-105'
                          : status === 'active'
                            ? 'bg-blue-600 border-blue-100 text-white shadow-lg shadow-blue-200 ring-4 ring-blue-100 animate-pulse'
                            : 'bg-white border-gray-200 text-gray-400'
                      }`}
                    >
                      {status === 'done' ? <Check size={22} strokeWidth={3} /> : step.id}
                    </div>

                    <div className="mt-4 text-center max-w-[140px]">
                      <p className={`text-sm font-black ${status === 'pending' ? 'text-gray-400' : 'text-gray-900'}`}>
                        {step.title}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-1 leading-snug">{step.task}</p>
                      <div
                        className={`inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide ${
                          isSuperAdmin ? 'bg-violet-50 text-violet-600' : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {isSuperAdmin ? <Shield size={10} /> : <UserCog size={10} />}
                        {step.assignee}
                      </div>
                      {status === 'done' && (
                        <p className="text-[10px] font-bold text-emerald-600 mt-1.5">✓ Complete</p>
                      )}
                      {status === 'active' && (
                        <p className="text-[10px] font-bold text-blue-600 mt-1.5">● In Progress</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mobile stepper */}
          <div className="md:hidden space-y-0">
            {WORKFLOW_STEPS.map((step, idx) => {
              const status = getStepStatus(step.id);
              const isSuperAdmin = step.role === 'Super Admin';
              const isLast = idx === WORKFLOW_STEPS.length - 1;

              return (
                <div key={step.id} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm border-4 shrink-0 ${
                        status === 'done'
                          ? 'bg-emerald-500 border-emerald-100 text-white'
                          : status === 'active'
                            ? 'bg-blue-600 border-blue-100 text-white ring-4 ring-blue-100'
                            : 'bg-white border-gray-200 text-gray-400'
                      }`}
                    >
                      {status === 'done' ? <Check size={18} strokeWidth={3} /> : step.id}
                    </div>
                    {!isLast && (
                      <div
                        className={`w-0.5 flex-1 min-h-[40px] my-1 rounded-full ${
                          status === 'done' ? 'bg-emerald-400' : 'bg-gray-200'
                        }`}
                      />
                    )}
                  </div>
                  <div className={`pb-6 flex-1 ${isLast ? '' : 'border-b border-gray-50'}`}>
                    <p className={`font-black text-sm ${status === 'pending' ? 'text-gray-400' : 'text-gray-900'}`}>
                      Step {step.id}: {step.title}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{step.task}</p>
                    <span
                      className={`inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        isSuperAdmin ? 'bg-violet-50 text-violet-600' : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {isSuperAdmin ? <Shield size={10} /> : <UserCog size={10} />}
                      {step.assignee}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-gray-100">
            <p className="text-xs text-gray-500 font-medium text-center sm:text-left">
              {allDone
                ? '🎉 Saare 4 steps complete! Job ready for final closure.'
                : activeStep
                  ? `Abhi Step ${activeStep} chal raha hai — ${WORKFLOW_STEPS[activeStep - 1].assignee} ka kaam`
                  : 'Workflow start karo'}
            </p>
            {!allDone && (
              <button
                onClick={completeNextStep}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg shadow-emerald-500/25 transition-all active:scale-[0.98] shrink-0"
              >
                <Check size={18} />
                Step {activeStep} Complete ✓
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
