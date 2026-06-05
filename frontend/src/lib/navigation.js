'use client';

export function navigateWithEditData(router, path, editData) {
  if (typeof window !== 'undefined' && editData) {
    sessionStorage.setItem('crmEditData', JSON.stringify(editData));
  }
  router.push(path);
}

export function consumeEditData() {
  if (typeof window === 'undefined') return null;
  const raw = sessionStorage.getItem('crmEditData');
  if (!raw) return null;
  sessionStorage.removeItem('crmEditData');
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
