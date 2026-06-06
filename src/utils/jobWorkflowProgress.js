export const WORKFLOW_STEP_COUNT = 4;
export const WORKFLOW_STORAGE_KEY = 'jobWorkflowProgress';

export const WORKFLOW_STEPS = [
  {
    id: 1,
    title: 'Design & Proof',
    task: 'Job review, design & client approval',
    role: 'Super Admin',
    assignee: 'Super Admin 1',
  },
  {
    id: 2,
    title: 'Printing',
    task: 'Plate making & print production',
    role: 'Super Admin',
    assignee: 'Super Admin 2',
  },
  {
    id: 3,
    title: 'Binding & Finish',
    task: 'Cutting, folding, lamination & binding',
    role: 'Admin',
    assignee: 'Admin 1',
  },
  {
    id: 4,
    title: 'QC & Delivery',
    task: 'Quality check, packing & dispatch',
    role: 'Admin',
    assignee: 'Admin 2',
  },
];

export function getJobCardId(job) {
  return String(job?._id || job?.id || '');
}

export function readWorkflowProgressMap() {
  if (typeof window === 'undefined') return {};
  try {
    const saved = localStorage.getItem(WORKFLOW_STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
}

export function getCompletedSteps(jobId, map = readWorkflowProgressMap()) {
  return Number(map[jobId] || 0);
}

export function getProgressPercent(jobId, map = readWorkflowProgressMap()) {
  const completed = getCompletedSteps(jobId, map);
  return Math.min(100, Math.round((completed / WORKFLOW_STEP_COUNT) * 100));
}

export function getWorkflowStepStatus(stepId, completedCount) {
  const safe = Math.min(Math.max(Number(completedCount) || 0, 0), WORKFLOW_STEP_COUNT);
  const allDone = safe >= WORKFLOW_STEP_COUNT;
  const activeStep = allDone ? null : safe + 1;
  if (stepId <= safe) return 'done';
  if (stepId === activeStep) return 'active';
  return 'pending';
}
