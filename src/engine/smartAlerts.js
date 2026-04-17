/**
 * Smart Alerts Engine
 * Surfaces the most critical findings automatically.
 * Priority: critical > warning > info
 * Each alert has an action suggestion.
 */

export function generateSmartAlerts(analysis, segmentation, timeline, churnData) {
  const alerts = [];

  // Critical: Very low event score
  if (analysis.scores.total < 30) {
    alerts.push({ priority: 'critical', icon: 'flame', title: 'Event severely underperformed', detail: `Overall score ${analysis.scores.total}/100. Multiple dimensions failed. Immediate review needed.`, action: 'Review networking infrastructure and speaker selection.' });
  }

  // Critical: Sponsors with near-zero ROI
  analysis.sponsors.forEach(sp => {
    if (sp.roi_score < 15) {
      alerts.push({ priority: 'critical', icon: 'sponsor', title: `${sp.name} had almost zero ROI`, detail: `ROI score: ${sp.roi_score.toFixed(0)}/100. ${sp.meetings_booked} meetings from ${sp.impressions} impressions.`, action: `Reconsider booth placement or replace ${sp.name} for next event.` });
    }
  });

  // Critical: Speaker with zero networking trigger
  analysis.speakers.forEach(sp => {
    if (sp.networking_triggered === 0 && sp.total_attendees > 10) {
      alerts.push({ priority: 'critical', icon: 'speaker', title: `${sp.name} triggered zero networking`, detail: `${sp.total_attendees} attendees but no networking activity after their session.`, action: `Don't rebook ${sp.name} unless format changes.` });
    }
  });

  // Warning: High no-show rate
  if (analysis.attendance.no_shows > analysis.attendance.rsvp_yes * 0.35) {
    alerts.push({ priority: 'warning', icon: 'attendance', title: `${analysis.attendance.no_shows} no-shows detected`, detail: `${((analysis.attendance.no_shows / Math.max(1, analysis.attendance.rsvp_yes)) * 100).toFixed(0)}% of RSVPs didn't show up.`, action: 'Implement reminder sequence: 7d, 3d, 1d, 1h before event.' });
  }

  // Warning: Passive attendees dominant
  if (segmentation) {
    const passivePct = segmentation.summary.passive_attendees.pct;
    if (passivePct > 40) {
      alerts.push({ priority: 'warning', icon: 'users', title: `${passivePct.toFixed(0)}% of attendees were passive`, detail: `${segmentation.summary.passive_attendees.count} attendees showed minimal engagement.`, action: 'Add gamification, live polls, or structured networking breaks.' });
    }

    if (segmentation.summary.power_networkers.count > 0) {
      alerts.push({ priority: 'info', icon: 'star', title: `${segmentation.summary.power_networkers.count} power networkers identified`, detail: 'These attendees drove disproportionate networking value.', action: 'Invite them as community ambassadors for next events.' });
    }

    if (segmentation.summary.high_value_leads.count > 0) {
      alerts.push({ priority: 'info', icon: 'target', title: `${segmentation.summary.high_value_leads.count} high-value leads detected`, detail: 'Founders/investors with high networking intent and active engagement.', action: 'Share this list with sponsors for targeted follow-up.' });
    }
  }

  // Warning: Low follow-up rate
  if (analysis.networking.follow_up_rate < 15 && analysis.networking.meetings_booked > 5) {
    alerts.push({ priority: 'warning', icon: 'followup', title: 'Very low post-event follow-up', detail: `Only ${analysis.networking.follow_up_rate.toFixed(0)}% of meetings led to follow-ups.`, action: 'Enable automated follow-up nudges within 24h of event.' });
  }

  // Info: Peak activity time
  if (timeline && timeline.peak_hour) {
    alerts.push({ priority: 'info', icon: 'clock', title: `Peak activity at ${timeline.peak_hour.hour}`, detail: `${timeline.peak_hour.total} networking interactions in this hour — the busiest period.`, action: 'Schedule key sessions and sponsor activations around this time.' });
  }

  // Churn alerts
  if (churnData && churnData.has_data) {
    const highRisk = churnData.at_risk.filter(r => r.risk_level === 'high').length;
    if (highRisk > 5) {
      alerts.push({ priority: 'warning', icon: 'churn', title: `${highRisk} attendees at high churn risk`, detail: 'These people attended previous events but skipped the latest one.', action: 'Send re-engagement campaign with early-bird offers.' });
    }
  }

  alerts.sort((a, b) => {
    const p = { critical: 0, warning: 1, info: 2 };
    return (p[a.priority] || 2) - (p[b.priority] || 2);
  });

  return alerts;
}
