export const LOCAL_JOB_CARDS_KEY = 'localJobCards';

export function getLocalJobCards() {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(LOCAL_JOB_CARDS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function setLocalJobCards(cards) {
  localStorage.setItem(LOCAL_JOB_CARDS_KEY, JSON.stringify(cards));
  window.dispatchEvent(new Event('jobCardsUpdated'));
}

export function generateLocalId() {
  return `local_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function generateJobNumber(cards = getLocalJobCards()) {
  let nextNum = 1;
  for (const card of cards) {
    if (!card?.jobNumber) continue;
    const num = parseInt(String(card.jobNumber).replace(/[^0-9]/g, ''), 10);
    if (!Number.isNaN(num) && num >= nextNum) nextNum = num + 1;
  }
  return `JOBHR-${String(nextNum).padStart(4, '0')}`;
}

export function saveLocalJobCard(data) {
  const cards = getLocalJobCards();
  const now = new Date().toISOString();
  let saved;

  if (data._id) {
    const idx = cards.findIndex((c) => c._id === data._id);
    if (idx >= 0) {
      saved = { ...cards[idx], ...data, updatedAt: now };
      cards[idx] = saved;
    } else {
      saved = {
        ...data,
        jobNumber: data.jobNumber || generateJobNumber(cards),
        createdAt: now,
        updatedAt: now,
      };
      cards.unshift(saved);
    }
  } else if (data.jobNumber) {
    const idx = cards.findIndex((c) => c.jobNumber === data.jobNumber);
    if (idx >= 0) {
      saved = { ...cards[idx], ...data, updatedAt: now };
      cards[idx] = saved;
    } else {
      saved = {
        ...data,
        _id: generateLocalId(),
        createdAt: now,
        updatedAt: now,
      };
      cards.unshift(saved);
    }
  } else {
    saved = {
      ...data,
      _id: generateLocalId(),
      jobNumber: generateJobNumber(cards),
      createdAt: now,
      updatedAt: now,
    };
    cards.unshift(saved);
  }

  setLocalJobCards(cards);
  return saved;
}

export function deleteLocalJobCard(id) {
  setLocalJobCards(getLocalJobCards().filter((c) => c._id !== id));
}

function isLocalId(id) {
  return typeof id === 'string' && id.startsWith('local_');
}

function mergeJobCards(serverCards, localCards) {
  const merged = Array.isArray(serverCards) ? [...serverCards] : [];
  const seen = new Set(
    merged.flatMap((card) => [card?._id, card?.jobNumber].filter(Boolean)),
  );

  for (const card of localCards) {
    const keys = [card?._id, card?.jobNumber].filter(Boolean);
    if (keys.some((key) => seen.has(key))) continue;
    merged.push(card);
    keys.forEach((key) => seen.add(key));
  }

  return merged.sort(
    (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime(),
  );
}

export async function fetchJobCards() {
  const local = getLocalJobCards();

  try {
    const response = await fetch('/api/jobcard', { cache: 'no-store' });
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data)) return mergeJobCards(data, local);
    }
  } catch {
    /* server not available — use local */
  }

  return local;
}

function buildApiPayload(data, localSaved) {
  const payload = { ...data, jobNumber: localSaved.jobNumber };
  if (localSaved._id && !isLocalId(localSaved._id)) {
    payload._id = localSaved._id;
  } else {
    delete payload._id;
  }
  return payload;
}

export async function saveJobCard(data) {
  const localSaved = saveLocalJobCard(data);

  try {
    const response = await fetch('/api/jobcard', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildApiPayload(data, localSaved)),
    });

    if (response.ok) {
      const saved = await response.json();
      saveLocalJobCard(saved);
      return { saved, dbSaved: true };
    }

    const err = await response.json().catch(() => ({}));
    return {
      saved: localSaved,
      dbSaved: false,
      dbError: err?.error || 'Database save failed',
    };
  } catch {
    return {
      saved: localSaved,
      dbSaved: false,
      dbError: 'Server not reachable',
    };
  }
}

export async function deleteJobCard(id) {
  deleteLocalJobCard(id);

  try {
    await fetch(`/api/jobcard/${id}`, { method: 'DELETE' });
  } catch {
    /* deleted locally */
  }
}
