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

function syncLocalJobCards(cards) {
  localStorage.setItem(LOCAL_JOB_CARDS_KEY, JSON.stringify(cards));
}

export function generateLocalId() {
  return `local_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function isLocalId(id) {
  return typeof id === 'string' && id.startsWith('local_');
}

function normalizeCard(card) {
  if (!card || typeof card !== 'object') return card;
  return {
    ...card,
    _id: card._id != null ? String(card._id) : card._id,
  };
}

function upsertLocalFromServer(localId, serverCard) {
  const saved = normalizeCard(serverCard);
  const cards = getLocalJobCards().filter(
    (c) =>
      c._id !== localId &&
      c._id !== saved._id &&
      (!saved.jobNumber || c.jobNumber !== saved.jobNumber),
  );
  cards.unshift(saved);
  setLocalJobCards(cards);
  return saved;
}

export function saveLocalJobCard(data) {
  const cards = getLocalJobCards();
  const now = new Date().toISOString();
  let saved;

  if (data._id && !isLocalId(data._id)) {
    const idx = cards.findIndex((c) => String(c._id) === String(data._id));
    if (idx >= 0) {
      saved = { ...cards[idx], ...data, updatedAt: now };
      cards[idx] = saved;
    } else {
      saved = { ...data, _id: String(data._id), createdAt: data.createdAt || now, updatedAt: now };
      cards.unshift(saved);
    }
  } else if (data._id && isLocalId(data._id)) {
    const idx = cards.findIndex((c) => c._id === data._id);
    saved = {
      ...data,
      _id: data._id,
      jobNumber: data.jobNumber || 'Pending',
      createdAt: data.createdAt || now,
      updatedAt: now,
    };
    if (idx >= 0) cards[idx] = saved;
    else cards.unshift(saved);
  } else {
    saved = {
      ...data,
      _id: generateLocalId(),
      jobNumber: 'Pending',
      createdAt: now,
      updatedAt: now,
    };
    cards.unshift(saved);
  }

  setLocalJobCards(cards);
  return saved;
}

export function deleteLocalJobCard(id) {
  setLocalJobCards(getLocalJobCards().filter((c) => String(c._id) !== String(id)));
}

function mergeJobCards(serverCards, localCards) {
  const merged = (Array.isArray(serverCards) ? serverCards : []).map(normalizeCard);
  const seen = new Set(
    merged.flatMap((card) => [card?._id, card?.jobNumber].filter(Boolean)),
  );

  for (const card of localCards) {
    if (!isLocalId(card?._id)) continue;
    const keys = [card?._id, card?.jobNumber].filter(Boolean);
    if (keys.some((key) => seen.has(key))) continue;
    merged.push(normalizeCard(card));
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
      if (Array.isArray(data)) {
        const pendingLocal = local.filter((c) => isLocalId(String(c._id)));
        const merged = mergeJobCards(data, pendingLocal);
        syncLocalJobCards(merged);
        return merged;
      }
    }
  } catch {
    /* server not available — use local */
  }

  return local.map(normalizeCard);
}

function buildApiPayload(data, localSaved) {
  const payload = { ...data };

  const cardId = localSaved._id || data._id;
  if (cardId && !isLocalId(String(cardId))) {
    payload._id = String(cardId);
    if (localSaved.jobNumber || data.jobNumber) {
      payload.jobNumber = localSaved.jobNumber || data.jobNumber;
    }
    return payload;
  }

  delete payload._id;
  delete payload.jobNumber;
  return payload;
}

export async function saveJobCard(data) {
  const payloadData = { ...data };
  const cardId = payloadData._id ? String(payloadData._id) : '';

  if (!cardId || isLocalId(cardId)) {
    delete payloadData._id;
    delete payloadData.jobNumber;
  } else {
    payloadData._id = cardId;
  }

  const localSaved = saveLocalJobCard(payloadData);

  try {
    const response = await fetch('/api/jobcard', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildApiPayload(payloadData, localSaved)),
    });

    if (response.ok) {
      const saved = upsertLocalFromServer(localSaved._id, await response.json());
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

  if (!id || isLocalId(String(id))) return;

  try {
    await fetch(`/api/jobcard/${id}`, { method: 'DELETE' });
  } catch {
    /* deleted locally */
  }
}
