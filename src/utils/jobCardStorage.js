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

export function isLocalJobCardId(id) {
  return isLocalId(id);
}

export function isMongoId(id) {
  return /^[a-f\d]{24}$/i.test(String(id || '').trim());
}

export async function resolveServerJobCard(card) {
  if (!card || typeof card !== 'object') return card;

  const normalized = normalizeCard(card);
  if (normalized._id && isMongoId(normalized._id)) {
    return normalized;
  }

  const jobNumber = normalized.jobNumber ? String(normalized.jobNumber).trim() : '';
  if (!jobNumber || jobNumber === 'Pending') {
    return normalized;
  }

  try {
    const response = await fetch('/api/jobcard', { cache: 'no-store' });
    if (!response.ok) return normalized;
    const list = await response.json();
    if (!Array.isArray(list)) return normalized;

    const match = list.find((item) => {
      if (!item?.jobNumber) return false;
      return String(item.jobNumber).trim() === jobNumber;
    });
    if (match?._id) {
      return normalizeCard({ ...normalized, ...match, _id: String(match._id) });
    }
  } catch {
    /* ignore */
  }

  return normalized;
}

export async function resolveEditCardId(cardId, card, editIdParam) {
  if (cardId && isMongoId(cardId)) return String(cardId).trim();
  if (editIdParam && isMongoId(editIdParam)) return String(editIdParam).trim();

  const resolved = await resolveServerJobCard({
    ...card,
    _id: cardId || editIdParam,
    jobNumber: card?.jobNumber,
  });

  if (resolved._id && isMongoId(resolved._id)) {
    return String(resolved._id);
  }

  return null;
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
    const normalized = normalizeCard(card);
    const jobNumber = normalized.jobNumber ? String(normalized.jobNumber).trim() : '';

    if (isLocalId(String(normalized._id))) {
      if (jobNumber && jobNumber !== 'Pending' && seen.has(jobNumber)) continue;
    } else if (jobNumber && seen.has(jobNumber)) {
      continue;
    }

    const keys = [normalized._id, normalized.jobNumber].filter(Boolean);
    if (keys.some((key) => seen.has(key))) continue;
    merged.push(normalized);
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

function buildCreatePayload(data) {
  const payload = { ...data };
  delete payload._id;
  delete payload.jobNumber;
  return payload;
}

function buildUpdatePayload(data, localSaved) {
  const payload = { ...data };
  delete payload._id;
  if (localSaved.jobNumber || data.jobNumber) {
    payload.jobNumber = localSaved.jobNumber || data.jobNumber;
  }
  return payload;
}

export async function saveJobCard(data, options = {}) {
  const payloadData = { ...data };
  let cardId = payloadData._id ? String(payloadData._id).trim() : '';

  if ((!cardId || isLocalId(cardId)) && options.editId && isMongoId(options.editId)) {
    cardId = String(options.editId).trim();
  }

  if (cardId && isLocalId(cardId)) {
    const resolved = await resolveServerJobCard({ ...payloadData, _id: cardId });
    if (resolved._id && isMongoId(resolved._id)) {
      cardId = String(resolved._id);
      Object.assign(payloadData, resolved);
    }
  }

  if (cardId && isMongoId(cardId)) {
    payloadData._id = cardId;
    const localSaved = saveLocalJobCard(payloadData);

    try {
      const response = await fetch(`/api/jobcard/${encodeURIComponent(cardId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildUpdatePayload(payloadData, localSaved)),
      });

      if (response.ok) {
        const saved = upsertLocalFromServer(localSaved._id, await response.json());
        return { saved, dbSaved: true };
      }

      const err = await response.json().catch(() => ({}));
      return {
        saved: localSaved,
        dbSaved: false,
        dbError: err?.error || 'Database update failed',
      };
    } catch {
      return {
        saved: localSaved,
        dbSaved: false,
        dbError: 'Server not reachable',
      };
    }
  }

  delete payloadData._id;
  delete payloadData.jobNumber;
  const localSaved = saveLocalJobCard(payloadData);

  try {
    const response = await fetch('/api/jobcard', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildCreatePayload(payloadData)),
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
