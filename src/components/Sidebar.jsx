import { useApp } from '../context/AppContext';
import {
  LayoutDashboard, Network, Mic2, Building2, Lightbulb,
  GitCompareArrows, Upload, X, CalendarClock, Trash2, Brain
} from 'lucide-react';

const navItems = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'intelligence', label: 'Intelligence', icon: Brain },
  { id: 'networking', label: 'Networking', icon: Network },
  { id: 'speakers', label: 'Speakers', icon: Mic2 },
  { id: 'sponsors', label: 'Sponsors', icon: Building2 },
  { id: 'insights', label: 'Insights', icon: Lightbulb },
  { id: 'compare', label: 'Compare', icon: GitCompareArrows },
];

export default function Sidebar() {
  const { view, events, activeEventIndex, upcomingEvents, dispatch, removeEvent, clearAllEvents } = useApp();

  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <img src={`${import.meta.env.BASE_URL}bizzly-logo.svg`} alt="Bizzly" />
        <span className="logo-suffix">intelligence</span>
      </div>

      <div className="sidebar-nav">
        <button className={`nav-item ${view === 'upload' ? 'active' : ''}`} onClick={() => dispatch({ type: 'SET_VIEW', payload: 'upload' })}>
          <Upload /> Upload Data
        </button>

        <button className={`nav-item ${view === 'upcoming' ? 'active' : ''}`} onClick={() => dispatch({ type: 'SET_VIEW', payload: 'upcoming' })}>
          <CalendarClock /> Upcoming
          {upcomingEvents.length > 0 && (
            <span style={{ marginLeft: 'auto', fontSize: 11, background: 'var(--bz-accent-dim)', color: 'var(--bz-accent)', padding: '1px 6px', borderRadius: 8, fontWeight: 600 }}>{upcomingEvents.length}</span>
          )}
        </button>

        {events.length > 0 && (
          <>
            <div className="nav-section-label">Analysis</div>
            {navItems.map(item => (
              <button key={item.id} className={`nav-item ${view === item.id ? 'active' : ''}`} onClick={() => dispatch({ type: 'SET_VIEW', payload: item.id })}>
                <item.icon /> {item.label}
              </button>
            ))}
          </>
        )}

        {events.length > 0 && (
          <>
            <div className="nav-section-label">Loaded Events</div>
            {events.map((ev, i) => (
              <div key={i} className={`nav-item ${i === activeEventIndex ? 'active' : ''}`} onClick={() => dispatch({ type: 'SET_ACTIVE_EVENT', payload: i })} style={{ justifyContent: 'space-between' }}>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.parsed.event.name}</span>
                <X style={{ width: 14, height: 14, opacity: 0.5, flexShrink: 0 }} onClick={(e) => { e.stopPropagation(); removeEvent(i); }} />
              </div>
            ))}
          </>
        )}
      </div>

      <div className="sidebar-footer">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: 'var(--bz-text-muted)' }}>{events.length} event{events.length !== 1 ? 's' : ''} loaded</span>
          {events.length > 0 && (
            <button onClick={clearAllEvents} title="Clear all data" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--bz-text-muted)', padding: 2 }}><Trash2 size={13} /></button>
          )}
        </div>
      </div>
    </div>
  );
}
