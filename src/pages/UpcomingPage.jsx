import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { recommendSpeakers } from '../engine/speakerMatching';
import { CalendarPlus, X, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';

const COMMON_TAGS = ['AI', 'SaaS', 'Fintech', 'Web3', 'Healthtech', 'Sustainability', 'Growth', 'HR', 'DevOps', 'Marketing', 'Sales', 'Product', 'Design', 'Data', 'IoT', 'Cybersecurity', 'Startup', 'Enterprise'];

export default function UpcomingPage() {
  const { upcomingEvents, addUpcomingEvent, removeUpcomingEvent, events } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', date: '', location: '', type: 'conference', tags: [] });
  const [tagInput, setTagInput] = useState('');
  const [expandedMatch, setExpandedMatch] = useState(null);

  const handleAddTag = (tag) => {
    if (tag && !form.tags.includes(tag)) setForm(f => ({ ...f, tags: [...f.tags, tag] }));
    setTagInput('');
  };

  const handleSubmit = () => {
    if (!form.name.trim()) return;
    addUpcomingEvent({ name: form.name.trim(), date: form.date, location: form.location.trim(), type: form.type, tags: form.tags, target_audience: { interests: form.tags, roles: [] } });
    setForm({ name: '', date: '', location: '', type: 'conference', tags: [] });
    setShowForm(false);
  };

  const getSpeakerRecs = (upcoming) => {
    if (events.length === 0) return [];
    return recommendSpeakers(events.map(e => e.analysis), { name: upcoming.name, tags: upcoming.tags, target_audience: upcoming.target_audience });
  };

  const inputStyle = { width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--bz-border)', background: 'var(--bz-bg-secondary)', color: 'var(--bz-text-primary)', fontSize: 14, fontFamily: 'var(--bz-font)' };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Upcoming Events</h1>
          <p className="page-subtitle">Plan future events and get speaker recommendations</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          <CalendarPlus size={16} /> New Event
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-title">Create upcoming event</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--bz-text-secondary)', display: 'block', marginBottom: 4 }}>Event Name *</label>
              <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. AI Summit Istanbul 2026" style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--bz-text-secondary)', display: 'block', marginBottom: 4 }}>Date</label>
              <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--bz-text-secondary)', display: 'block', marginBottom: 4 }}>Location</label>
              <input type="text" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="e.g. Istanbul, Turkey" style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--bz-text-secondary)', display: 'block', marginBottom: 4 }}>Type</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} style={inputStyle}>
                <option value="conference">Conference</option>
                <option value="meetup">Meetup</option>
                <option value="workshop">Workshop</option>
                <option value="summit">Summit</option>
                <option value="networking">Networking Event</option>
              </select>
            </div>
          </div>

          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--bz-text-secondary)', display: 'block', marginBottom: 6 }}>Topics / Tags</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
            {form.tags.map(tag => (
              <span key={tag} className="badge badge-info" style={{ cursor: 'pointer', gap: 4, display: 'flex', alignItems: 'center' }} onClick={() => setForm(f => ({ ...f, tags: f.tags.filter(t => t !== tag) }))}>
                {tag} <X size={12} />
              </span>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <input type="text" value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag(tagInput.trim()); } }} placeholder="Add custom tag..." style={{ ...inputStyle, flex: 1 }} />
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 16 }}>
            {COMMON_TAGS.filter(t => !form.tags.includes(t)).map(tag => (
              <button key={tag} onClick={() => handleAddTag(tag)} style={{ padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 500, border: '1px solid var(--bz-border)', background: 'transparent', color: 'var(--bz-text-muted)', cursor: 'pointer', fontFamily: 'var(--bz-font)' }}>
                + {tag}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary" onClick={handleSubmit}>Create Event</button>
            <button className="btn btn-outline" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </div>
      )}

      {upcomingEvents.length === 0 && !showForm && (
        <div className="card" style={{ textAlign: 'center', padding: 60, color: 'var(--bz-text-muted)' }}>
          No upcoming events. Create one to get speaker recommendations.
        </div>
      )}

      {upcomingEvents.map((upcoming, idx) => {
        const recs = getSpeakerRecs(upcoming);
        const isExpanded = expandedMatch === idx;
        return (
          <div key={upcoming.id} className="card" style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{upcoming.name}</div>
                <div style={{ fontSize: 13, color: 'var(--bz-text-secondary)' }}>
                  {upcoming.date && `${upcoming.date} · `}{upcoming.location && `${upcoming.location} · `}{upcoming.type}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
                  {upcoming.tags.map(tag => (<span key={tag} className="badge badge-info">{tag}</span>))}
                </div>
              </div>
              <button onClick={() => removeUpcomingEvent(idx)} style={{ background: 'none', border: 'none', color: 'var(--bz-text-muted)', cursor: 'pointer' }}><X size={18} /></button>
            </div>

            {events.length > 0 && recs.length > 0 && (
              <div style={{ marginTop: 16, borderTop: '1px solid var(--bz-border-light)', paddingTop: 16 }}>
                <button onClick={() => setExpandedMatch(isExpanded ? null : idx)} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', color: 'var(--bz-accent)', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'var(--bz-font)', padding: 0 }}>
                  <Sparkles size={14} /> {recs.length} speaker recommendations
                  {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
                {isExpanded && (
                  <table className="data-table" style={{ marginTop: 12 }}>
                    <thead><tr><th>Speaker</th><th>Tags</th><th>Events</th><th>Topic Fit</th><th>Performance</th><th>Net. Impact</th><th>Fit Score</th></tr></thead>
                    <tbody>
                      {recs.slice(0, 10).map(rec => (
                        <tr key={rec.speaker_id}>
                          <td style={{ fontWeight: 600 }}>{rec.name}</td>
                          <td><div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>{rec.tags.slice(0, 3).map(t => (<span key={t} className="badge badge-info" style={{ fontSize: 10 }}>{t}</span>))}</div></td>
                          <td>{rec.events_count}</td>
                          <td>{rec.scores.topic_relevance}</td>
                          <td>{rec.scores.past_performance}</td>
                          <td>{rec.scores.networking_impact}</td>
                          <td><span style={{ fontWeight: 700, fontSize: 15, color: rec.fit_score >= 60 ? 'var(--bz-success)' : rec.fit_score >= 35 ? 'var(--bz-warning)' : 'var(--bz-danger)' }}>{rec.fit_score}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
            {events.length === 0 && (
              <div style={{ marginTop: 12, fontSize: 12, color: 'var(--bz-text-muted)', fontStyle: 'italic' }}>Upload past event data to get speaker recommendations.</div>
            )}
          </div>
        );
      })}
    </div>
  );
}
