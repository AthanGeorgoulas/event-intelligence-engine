/**
 * Event Health Timeline
 * Analyzes engagement patterns across the event timeline using timestamps.
 * Groups networking interactions by hour to show activity peaks.
 */

export function buildTimeline(parsedData) {
  const { networking, attendance } = parsedData;

  // Group networking by hour
  const hourlyActivity = {};
  const hourlyDepth = {};

  networking.forEach(n => {
    if (!n.timestamp) return;
    const hour = new Date(n.timestamp).getHours();
    const key = `${String(hour).padStart(2, '0')}:00`;

    if (!hourlyActivity[key]) hourlyActivity[key] = { connections: 0, messages: 0, meetings: 0, total: 0 };
    hourlyActivity[key].total++;
    if (n.accepted) hourlyActivity[key].connections++;
    if (n.message_sent) hourlyActivity[key].messages++;
    if (n.meeting_booked) hourlyActivity[key].meetings++;
  });

  // Sort by hour
  const timeline = Object.entries(hourlyActivity)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([hour, data]) => ({ hour, ...data }));

  // Find peak and quiet hours
  const peak = timeline.length > 0 ? timeline.reduce((best, h) => h.total > best.total ? h : best, timeline[0]) : null;
  const quiet = timeline.length > 0 ? timeline.reduce((worst, h) => h.total < worst.total ? h : worst, timeline[0]) : null;

  // Check-in distribution
  const checkinHours = {};
  attendance.forEach(a => {
    if (!a.check_in_time) return;
    const hour = new Date(a.check_in_time).getHours();
    const key = `${String(hour).padStart(2, '0')}:00`;
    checkinHours[key] = (checkinHours[key] || 0) + 1;
  });

  const checkinTimeline = Object.entries(checkinHours)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([hour, count]) => ({ hour, count }));

  // Context breakdown over time
  const contextByHour = {};
  networking.forEach(n => {
    if (!n.timestamp) return;
    const hour = `${String(new Date(n.timestamp).getHours()).padStart(2, '0')}:00`;
    if (!contextByHour[hour]) contextByHour[hour] = {};
    contextByHour[hour][n.context] = (contextByHour[hour][n.context] || 0) + 1;
  });

  return {
    networking_timeline: timeline,
    checkin_timeline: checkinTimeline,
    peak_hour: peak,
    quiet_hour: quiet,
    context_by_hour: contextByHour,
    has_data: timeline.length > 0,
  };
}
