/**
 * Attendee Segmentation Engine
 * Clusters participants into behavioral segments based on engagement patterns.
 *
 * Segments:
 * - Power Networkers: high networking + high meetings
 * - Active Engagers: attend sessions + moderate networking
 * - Passive Attendees: attended but low engagement
 * - Speaker Followers: high session attendance, low networking
 * - No-shows: RSVP'd but didn't attend
 * - High-value Leads: founders/investors with high networking intent
 */

export function segmentAttendees(parsedData) {
  const { profiles, attendance, behavior, networking } = parsedData;

  // Build per-user networking stats
  const netStats = {};
  networking.forEach(n => {
    if (!netStats[n.from_user_id]) netStats[n.from_user_id] = { sent: 0, accepted: 0, meetings: 0, messages: 0, followUps: 0 };
    netStats[n.from_user_id].sent++;
    if (n.accepted) netStats[n.from_user_id].accepted++;
    if (n.meeting_booked) netStats[n.from_user_id].meetings++;
    if (n.message_sent) netStats[n.from_user_id].messages++;
    if (n.follow_up) netStats[n.from_user_id].followUps++;
  });

  const segments = {
    power_networkers: [],
    active_engagers: [],
    passive_attendees: [],
    speaker_followers: [],
    no_shows: [],
    high_value_leads: [],
  };

  profiles.forEach((profile, idx) => {
    const att = attendance[idx];
    const beh = behavior[idx];
    const ns = netStats[profile.user_id] || { sent: 0, accepted: 0, meetings: 0, messages: 0, followUps: 0 };

    const userData = {
      user_id: profile.user_id,
      name: profile.name,
      role: profile.role,
      industry: profile.industry,
      company: profile.company,
      networking_intent: profile.networking_intent,
      attended: att.attended,
      rsvp_status: att.rsvp_status,
      sessions_joined: beh.session_joins,
      time_spent: beh.time_spent_total,
      app_opens: beh.app_opens,
      connections_sent: ns.sent,
      connections_accepted: ns.accepted,
      meetings_booked: ns.meetings,
      messages_sent: ns.messages,
      follow_ups: ns.followUps,
    };

    // No-shows
    if (!att.attended && att.rsvp_status === 'yes') {
      segments.no_shows.push(userData);
      return;
    }

    if (!att.attended) return;

    // High-value leads (role-based + intent)
    const isHighValue = ['founder', 'investor', 'corporate'].includes(profile.role) && profile.networking_intent === 'high';

    // Power networkers: 5+ connections AND 2+ meetings
    if (ns.accepted >= 5 && ns.meetings >= 2) {
      segments.power_networkers.push(userData);
      if (isHighValue) segments.high_value_leads.push(userData);
      return;
    }

    // Speaker followers: 3+ sessions, low networking
    if (beh.session_joins >= 3 && ns.sent <= 1) {
      segments.speaker_followers.push(userData);
      return;
    }

    // Active engagers: some sessions + some networking
    if (beh.session_joins >= 2 || ns.sent >= 2) {
      segments.active_engagers.push(userData);
      if (isHighValue) segments.high_value_leads.push(userData);
      return;
    }

    // Passive attendees: everything else
    segments.passive_attendees.push(userData);
  });

  const totalAttended = attendance.filter(a => a.attended).length;

  return {
    segments,
    summary: {
      power_networkers: { count: segments.power_networkers.length, pct: totalAttended > 0 ? (segments.power_networkers.length / totalAttended * 100) : 0 },
      active_engagers: { count: segments.active_engagers.length, pct: totalAttended > 0 ? (segments.active_engagers.length / totalAttended * 100) : 0 },
      passive_attendees: { count: segments.passive_attendees.length, pct: totalAttended > 0 ? (segments.passive_attendees.length / totalAttended * 100) : 0 },
      speaker_followers: { count: segments.speaker_followers.length, pct: totalAttended > 0 ? (segments.speaker_followers.length / totalAttended * 100) : 0 },
      no_shows: { count: segments.no_shows.length, pct: attendance.filter(a => a.rsvp_status === 'yes').length > 0 ? (segments.no_shows.length / attendance.filter(a => a.rsvp_status === 'yes').length * 100) : 0 },
      high_value_leads: { count: segments.high_value_leads.length, pct: totalAttended > 0 ? (segments.high_value_leads.length / totalAttended * 100) : 0 },
    },
    total_attended: totalAttended,
  };
}
