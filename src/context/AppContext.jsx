import { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { validateEventJSON, parseEventData } from '../engine/dataModel';
import { analyzeEvent } from '../engine/scoringEngine';
import { generateInsights, generateRecommendations, detectPatterns } from '../engine/intelligenceLayer';
import { normalizeEventInput } from '../utils/eventNormalizer';
import { saveEvents, loadEvents, clearEvents, saveUpcomingEvents, loadUpcomingEvents } from '../utils/storage';

const AppContext = createContext(null);

const initialState = {
  events: [], activeEventIndex: 0, patterns: [], upcomingEvents: [],
  loading: false, error: null, view: 'upload',
};

function reducer(state, action) {
  switch (action.type) {
    case 'ADD_EVENT': {
      const newEvents = [...state.events, action.payload];
      const patterns = detectPatterns(newEvents.map(e => e.analysis));
      return { ...state, events: newEvents, activeEventIndex: newEvents.length - 1, patterns, view: 'overview', error: null };
    }
    case 'LOAD_EVENTS': {
      const patterns = detectPatterns(action.payload.map(e => e.analysis));
      return { ...state, events: action.payload, activeEventIndex: 0, patterns, view: action.payload.length > 0 ? 'overview' : 'upload' };
    }
    case 'REMOVE_EVENT': {
      const newEvents = state.events.filter((_, i) => i !== action.payload);
      const patterns = detectPatterns(newEvents.map(e => e.analysis));
      return { ...state, events: newEvents, activeEventIndex: Math.min(state.activeEventIndex, Math.max(0, newEvents.length - 1)), patterns, view: newEvents.length === 0 ? 'upload' : state.view };
    }
    case 'CLEAR_ALL_EVENTS':
      return { ...state, events: [], activeEventIndex: 0, patterns: [], view: 'upload' };
    case 'SET_ACTIVE_EVENT': return { ...state, activeEventIndex: action.payload };
    case 'SET_VIEW': return { ...state, view: action.payload };
    case 'SET_ERROR': return { ...state, error: action.payload };
    case 'CLEAR_ERROR': return { ...state, error: null };
    case 'SET_UPCOMING': return { ...state, upcomingEvents: action.payload };
    case 'ADD_UPCOMING': return { ...state, upcomingEvents: [...state.upcomingEvents, action.payload] };
    case 'REMOVE_UPCOMING': return { ...state, upcomingEvents: state.upcomingEvents.filter((_, i) => i !== action.payload) };
    default: return state;
  }
}

function processRawEvent(jsonData) {
  const normalized = normalizeEventInput(jsonData);
  const validation = validateEventJSON(normalized);
  if (!validation.valid) throw new Error(`Validation: ${validation.errors.join(', ')}`);
  const parsed = parseEventData(normalized);
  const analysis = analyzeEvent(parsed);
  const insights = generateInsights(analysis);
  const recommendations = generateRecommendations(analysis);
  return { raw: jsonData, parsed, analysis, insights, recommendations };
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    const stored = loadEvents();
    if (stored.length > 0) {
      try { dispatch({ type: 'LOAD_EVENTS', payload: stored.map(raw => processRawEvent(raw)) }); }
      catch (err) { console.warn('Failed to restore events:', err.message); }
    }
    const upcoming = loadUpcomingEvents();
    if (upcoming.length > 0) dispatch({ type: 'SET_UPCOMING', payload: upcoming });
  }, []);

  useEffect(() => {
    if (state.events.length > 0) saveEvents(state.events.map(e => e.raw));
    else clearEvents();
  }, [state.events]);

  useEffect(() => { saveUpcomingEvents(state.upcomingEvents); }, [state.upcomingEvents]);

  const loadEvent = useCallback((jsonData) => {
    try { dispatch({ type: 'ADD_EVENT', payload: processRawEvent(jsonData) }); return true; }
    catch (err) { dispatch({ type: 'SET_ERROR', payload: err.message }); return false; }
  }, []);

  const removeEvent = useCallback((index) => { dispatch({ type: 'REMOVE_EVENT', payload: index }); }, []);
  const clearAllEvents = useCallback(() => { dispatch({ type: 'CLEAR_ALL_EVENTS' }); clearEvents(); }, []);
  const addUpcomingEvent = useCallback((event) => {
    dispatch({ type: 'ADD_UPCOMING', payload: { id: `upcoming_${Date.now()}`, ...event, created: new Date().toISOString() } });
  }, []);
  const removeUpcomingEvent = useCallback((index) => { dispatch({ type: 'REMOVE_UPCOMING', payload: index }); }, []);

  const value = {
    ...state, activeEvent: state.events[state.activeEventIndex] || null,
    loadEvent, removeEvent, clearAllEvents, addUpcomingEvent, removeUpcomingEvent, dispatch,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
