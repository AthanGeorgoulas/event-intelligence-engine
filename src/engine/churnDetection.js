/**
 * Churn Risk Detection
 * Identifies attendees at risk of not returning based on cross-event behavior.
 *
 * Risk signals:
 * - Attended event A but not event B (dropped)
 * - Decreased engagement between events
 * - Low networking in latest event
 * - No follow-ups in latest event
 */

export function detectChurnRisk(eventAnalyses) {
  if (eventAnalyses.length < 2) return { at_risk: [], insights: [], has_data: false };

  // Sort events by date
  const sorted = [...eventAnalyses].sort((a, b) => {
    const evA = a.raw?.event || a.parsed?.event || {};
    const evB = b.raw?.event || b.parsed?.event || {};
    return new Date(evA.date || 0) - new Date(evB.date || 0);
  });

  // Build per-user history across events
  const userHistory = {};

  sorted.forEach((event, eventIdx) => {
    const parsed = event.parsed;
    if (!parsed) return;

    (parsed.profiles || []).forEach(profile => {
      const att = (parsed.attendance || []).find(a => a.user_id === profile.user_id);
      const beh = (parsed.behavior || []).find(b => b.user_id === profile.user_id);

      if (!userHistory[profile.user_id]) {
        userHistory[profile.user_id] = { name: profile.name, role: profile.role, company: profile.company, industry: profile.industry, events: [] };
      }

      userHistory[profile.user_id].events.push({
        event_index: eventIdx,
        event_name: parsed.event?.name || `Event ${eventIdx + 1}`,
        attended: att?.attended || false,
        sessions: beh?.session_joins || 0,
        time_spent: beh?.time_spent_total || 0,
        app_opens: beh?.app_opens || 0,
      });
    });
  });

  // Detect churn risk
  const atRisk = [];
  const lastEventIdx = sorted.length - 1;

  Object.values(userHistory).forEach(user => {
    if (user.events.length < 2) return;

    const lastEvent = user.events.find(e => e.event_index === lastEventIdx);
    const prevEvents = user.events.filter(e => e.event_index < lastEventIdx && e.attended);

    if (prevEvents.length === 0) return;

    // Case 1: Attended before, didn't attend latest
    if (!lastEvent || !lastEvent.attended) {
      if (prevEvents.length > 0) {
        atRisk.push({
          ...user,
          risk_level: 'high',
          reason: 'Attended previous events but missed the latest',
          prev_events_attended: prevEvents.length,
          last_attended: prevEvents[prevEvents.length - 1].event_name,
        });
      }
      return;
    }

    // Case 2: Engagement dropped significantly
    const avgPrevSessions = prevEvents.reduce((s, e) => s + e.sessions, 0) / prevEvents.length;
    const avgPrevTime = prevEvents.reduce((s, e) => s + e.time_spent, 0) / prevEvents.length;

    if (lastEvent.sessions < avgPrevSessions * 0.5 && avgPrevSessions >= 2) {
      atRisk.push({
        ...user,
        risk_level: 'medium',
        reason: `Session attendance dropped from avg ${avgPrevSessions.toFixed(1)} to ${lastEvent.sessions}`,
        prev_events_attended: prevEvents.length,
      });
      return;
    }

    if (lastEvent.time_spent < avgPrevTime * 0.4 && avgPrevTime >= 60) {
      atRisk.push({
        ...user,
        risk_level: 'medium',
        reason: `Time spent dropped from avg ${avgPrevTime.toFixed(0)}min to ${lastEvent.time_spent}min`,
        prev_events_attended: prevEvents.length,
      });
    }
  });

  atRisk.sort((a, b) => (a.risk_level === 'high' ? 0 : 1) - (b.risk_level === 'high' ? 0 : 1));

  const insights = [];
  const highRisk = atRisk.filter(r => r.risk_level === 'high').length;
  const medRisk = atRisk.filter(r => r.risk_level === 'medium').length;
  if (highRisk > 0) insights.push(`${highRisk} attendees who came before didn't show up to the latest event.`);
  if (medRisk > 0) insights.push(`${medRisk} attendees showed decreased engagement in the latest event.`);

  return { at_risk: atRisk, insights, has_data: true, total_tracked: Object.keys(userHistory).length };
}
