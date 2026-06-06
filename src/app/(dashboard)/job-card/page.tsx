'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import JobCardForm from '@/components/crm/JobCardForm';

function JobCardPageInner() {
  const searchParams = useSearchParams();
  const editId = searchParams.get('editId') || 'new';
  const stamp = searchParams.get('t') || '0';
  return <JobCardForm key={`${editId}-${stamp}`} />;
}

export default function Page() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading job card...</div>}>
      <JobCardPageInner />
    </Suspense>
  );
}
