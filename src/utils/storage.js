const STORAGE_KEY = 'eie_events';
const UPCOMING_KEY = 'eie_upcoming';

export function saveEvents(rawEvents) {
  try {
    const data = rawEvents.map(e => ({ id: e.event?.id || `evt_${Date.now()}`, data: e }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (err) { console.warn('Storage save failed:', err.message); return false; }
}

export function loadEvents() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored).map(entry => entry.data);
  } catch { return []; }
}

export function clearEvents() { localStorage.removeItem(STORAGE_KEY); }

export function saveUpcomingEvents(events) {
  try { localStorage.setItem(UPCOMING_KEY, JSON.stringify(events)); return true; }
  catch { return false; }
}

export function loadUpcomingEvents() {
  try { const s = localStorage.getItem(UPCOMING_KEY); return s ? JSON.parse(s) : []; }
  catch { return []; }
}
