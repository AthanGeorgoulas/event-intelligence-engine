import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { segmentAttendees } from '../engine/segmentation';
import { buildTimeline } from '../engine/timeline';
import { detectChurnRisk } from '../engine/churnDetection';
import { generateSmartAlerts } from '../engine/smartAlerts';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, AreaChart, Area } from 'recharts';
import { AlertTriangle, Flame, Clock, Users, Star, Target, ChevronDown, ChevronUp, TrendingDown, Zap } from 'lucide-react';

const SEGMENT_COLORS = {
  power_networkers: '#2F6BFF',
  active_engagers: '#16A34A',
  speaker_followers: '#D97706',
  passive_attendees: '#8D847C',
  no_shows: '#DC2626',
  high_value_leads: '#7C3AED',
};

const SEGMENT_LABELS = {
  power_networkers: 'Power Networkers',
  active_engagers: 'Active Engagers',
  speaker_followers: 'Speaker Followers',
  passive_attendees: 'Passive Attendees',
  no_shows: 'No-shows',
  high_value_leads: 'High-value Leads',
};

const alertIcons = {
  flame: <Flame size={16} />,
  sponsor: <Target size={16} />,
  speaker: <Zap size={16} />,
  attendance: <Users size={16} />,
  users: <Users size={16} />,
  star: <Star size={16} />,
  target: <Target size={16} />,
  followup: <TrendingDown size={16} />,
  clock: <Clock size={16} />,
  churn: <AlertTriangle size={16} />,
};

export default function IntelligencePage() {
  const { activeEvent, events } = useApp();
  const [expandedSegment, setExpandedSegment] = useState(null);
  const [showChurn, setShowChurn] = useState(false);

  if (!activeEvent) return null;

  const segmentation = segmentAttendees(activeEvent.parsed);
  const timeline = buildTimeline(activeEvent.parsed);
  const churnData = events.length >= 2 ? detectChurnRisk(events) : { at_risk: [], insights: [], has_data: false };
  const alerts = generateSmartAlerts(activeEvent.analysis, segmentation, timeline, churnData);

  const tooltipStyle = { contentStyle: { background: '#FFFFFF', border: '1px solid #E5E2DD', borderRadius: 8, fontSize: 12, color: '#0F0F10' } };

  const segmentChartData = Object.entries(segmentation.summary)
    .filter(([key]) => key !== 'high_value_leads')
    .map(([key, val]) => ({ name: SEGMENT_LABELS[key], count: val.count, pct: val.pct, fill: SEGMENT_COLORS[key] }))
    .sort((a, b) => b.count - a.count);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Intelligence Center</h1>
        <p className="page-subtitle">AI-powered segmentation, timeline analysis, churn detection, and smart alerts</p>
      </div>

      {/* Smart Alerts */}
      {alerts.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div className="card-title">Smart alerts</div>
          {alerts.slice(0, 8).map((alert, i) => (
            <div key={i} className={`insight-card ${alert.priority === 'critical' ? 'critical' : alert.priority === 'warning' ? 'warning' : 'positive'}`} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{ color: alert.priority === 'critical' ? 'var(--bz-danger)' : alert.priority === 'warning' ? 'var(--bz-warning)' : 'var(--bz-accent)', flexShrink: 0, marginTop: 2 }}>
                {alertIcons[alert.icon] || <Zap size={16} />}
              </div>
              <div style={{ flex: 1 }}>
                <div className="insight-title">{alert.title}</div>
                <div className="insight-message">{alert.detail}</div>
                <div style={{ fontSize: 12, color: 'var(--bz-accent)', fontWeight: 600, marginTop: 4 }}>→ {alert.action}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Attendee Segmentation */}
      <div className="grid-2" style={{ marginBottom: 24 }}>
        <div className="card">
          <div className="card-title">Attendee segmentation</div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={segmentChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fill: '#A6A09A', fontSize: 10 }} axisLine={false} tickLine={false} angle={-20} textAnchor="end" height={50} />
              <YAxis tick={{ fill: '#8D847C', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip {...tooltipStyle} formatter={(v, name, props) => [`${v} (${props.payload.pct.toFixed(0)}%)`, 'Attendees']} />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {segmentChartData.map((entry, i) => (<Cell key={i} fill={entry.fill} />))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="card-title">Segment breakdown</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {Object.entries(segmentation.summary).map(([key, val]) => (
              <div key={key}>
                <button
                  onClick={() => setExpandedSegment(expandedSegment === key ? null : key)}
                  style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--bz-font)', fontSize: 13, color: 'var(--bz-text-primary)', padding: '4px 0' }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: SEGMENT_COLORS[key], flexShrink: 0 }} />
                    <span style={{ fontWeight: 500 }}>{SEGMENT_LABELS[key]}</span>
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontWeight: 700 }}>{val.count}</span>
                    <span style={{ fontSize: 11, color: 'var(--bz-text-muted)' }}>({val.pct.toFixed(0)}%)</span>
                    {expandedSegment === key ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  </span>
                </button>
                {expandedSegment === key && segmentation.segments[key].length > 0 && (
                  <div style={{ marginLeft: 18, marginTop: 4, marginBottom: 8, maxHeight: 150, overflowY: 'auto' }}>
                    {segmentation.segments[key].slice(0, 10).map(u => (
                      <div key={u.user_id} style={{ fontSize: 12, color: 'var(--bz-text-secondary)', padding: '2px 0', display: 'flex', justifyContent: 'space-between' }}>
                        <span>{u.name}</span>
                        <span style={{ color: 'var(--bz-text-muted)' }}>{u.role} · {u.company}</span>
                      </div>
                    ))}
                    {segmentation.segments[key].length > 10 && (
                      <div style={{ fontSize: 11, color: 'var(--bz-text-muted)', marginTop: 4 }}>+{segmentation.segments[key].length - 10} more</div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Event Timeline */}
      {timeline.has_data && (
        <div className="grid-2" style={{ marginBottom: 24 }}>
          <div className="card">
            <div className="card-title">Networking activity timeline</div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={timeline.networking_timeline} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <XAxis dataKey="hour" tick={{ fill: '#A6A09A', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#8D847C', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip {...tooltipStyle} />
                <Area type="monotone" dataKey="total" name="Interactions" stroke="#2F6BFF" fill="#2F6BFF" fillOpacity={0.15} strokeWidth={2} />
                <Area type="monotone" dataKey="meetings" name="Meetings" stroke="#16A34A" fill="#16A34A" fillOpacity={0.1} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
            {timeline.peak_hour && (
              <div style={{ fontSize: 12, color: 'var(--bz-text-secondary)', marginTop: 8 }}>
                Peak: <strong>{timeline.peak_hour.hour}</strong> ({timeline.peak_hour.total} interactions) · 
                Quiet: <strong>{timeline.quiet_hour?.hour}</strong> ({timeline.quiet_hour?.total} interactions)
              </div>
            )}
          </div>

          <div className="card">
            <div className="card-title">Check-in distribution</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={timeline.checkin_timeline} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <XAxis dataKey="hour" tick={{ fill: '#A6A09A', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#8D847C', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip {...tooltipStyle} />
                <Bar dataKey="count" name="Check-ins" fill="#5A8AFF" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Churn Risk */}
      {churnData.has_data && churnData.at_risk.length > 0 && (
        <div className="card">
          <button
            onClick={() => setShowChurn(!showChurn)}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--bz-font)', padding: 0 }}
          >
            <span className="card-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertTriangle size={14} color="var(--bz-warning)" /> Churn risk detection ({churnData.at_risk.length} at risk)
            </span>
            {showChurn ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {showChurn && (
            <div style={{ marginTop: 12 }}>
              {churnData.insights.map((ins, i) => (
                <div key={i} style={{ fontSize: 13, color: 'var(--bz-text-secondary)', marginBottom: 4 }}>→ {ins}</div>
              ))}
              <div style={{ overflowX: 'auto', marginTop: 12 }}>
                <table className="data-table" style={{ minWidth: 600 }}>
                  <thead>
                    <tr><th>Name</th><th>Role</th><th>Company</th><th>Risk</th><th>Reason</th></tr>
                  </thead>
                  <tbody>
                    {churnData.at_risk.slice(0, 15).map((r, i) => (
                      <tr key={i}>
                        <td style={{ fontWeight: 600 }}>{r.name}</td>
                        <td><span className="badge badge-info" style={{ fontSize: 10 }}>{r.role}</span></td>
                        <td style={{ fontSize: 12, color: 'var(--bz-text-secondary)' }}>{r.company}</td>
                        <td><span className={`badge ${r.risk_level === 'high' ? 'badge-critical' : 'badge-warning'}`}>{r.risk_level}</span></td>
                        <td style={{ fontSize: 12, color: 'var(--bz-text-secondary)' }}>{r.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {churnData.at_risk.length > 15 && (
                <div style={{ fontSize: 12, color: 'var(--bz-text-muted)', marginTop: 8 }}>+{churnData.at_risk.length - 15} more at risk</div>
              )}
            </div>
          )}
        </div>
      )}

      {!churnData.has_data && (
        <div className="card" style={{ color: 'var(--bz-text-muted)', fontSize: 13 }}>
          Load 2+ events to enable churn risk detection.
        </div>
      )}
    </div>
  );
}
