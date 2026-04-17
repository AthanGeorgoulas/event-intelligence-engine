function buildReport(eventData) {
  const { parsed, analysis, insights, recommendations } = eventData;
  const { event } = parsed;
  const { scores, attendance, networking, speakers, sponsors } = analysis;
  return {
    title: `Event Intelligence Report: ${event.name}`, generated: new Date().toISOString(),
    event: { name: event.name, date: event.date, location: event.location, type: event.type },
    scores: { overall: scores.total, attendance: scores.breakdown.attendance, networking: scores.breakdown.networking, speakers: scores.breakdown.speaker, sponsors: scores.breakdown.sponsor },
    attendance: { invited: attendance.total_invited, rsvp_yes: attendance.rsvp_yes, attended: attendance.attended, no_shows: attendance.no_shows, attendance_rate: attendance.attendance_rate, rsvp_to_attend: attendance.rsvp_to_attend_rate },
    networking: { total_interactions: networking.total_interactions, connections: networking.accepted, meetings: networking.meetings_booked, follow_ups: networking.follow_ups, quality_score: networking.quality_score, acceptance_rate: networking.acceptance_rate, participation: networking.networking_participation },
    speakers: speakers.map(s => ({ name: s.name, topic: s.topic, impact: s.impact_score, fill_rate: s.fill_rate, networking_triggered: s.networking_triggered })),
    sponsors: sponsors.map(s => ({ name: s.name, tier: s.tier, roi_score: s.roi_score, leads: s.leads_collected, meetings: s.meetings_booked, lead_quality: s.lead_quality })),
    insights: insights.map(i => ({ severity: i.severity, title: i.title, message: i.message })),
    recommendations: recommendations.map(r => ({ priority: r.priority, area: r.area, title: r.title, actions: r.actions })),
  };
}

export async function exportPDF(eventData) {
  const report = buildReport(eventData);
  if (!window.jspdf) {
    await new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.2/jspdf.umd.min.js';
      s.onload = resolve; s.onerror = reject; document.head.appendChild(s);
    });
  }
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const m = 20; const w = doc.internal.pageSize.getWidth(); let y = 20;
  const chk = (n = 20) => { if (y + n > 270) { doc.addPage(); y = 20; } };

  doc.setFontSize(20); doc.setFont('helvetica', 'bold'); doc.setTextColor(47, 107, 255);
  doc.text('Event Intelligence Report', m, y); y += 10;
  doc.setFontSize(14); doc.setTextColor(15, 15, 16); doc.text(report.event.name, m, y); y += 7;
  doc.setFontSize(10); doc.setTextColor(107, 101, 96);
  doc.text(`${report.event.date} · ${report.event.location} · ${report.event.type}`, m, y); y += 12;

  doc.setFontSize(13); doc.setFont('helvetica', 'bold'); doc.setTextColor(15, 15, 16);
  doc.text('Event Success Scores', m, y); y += 8;
  doc.setFontSize(10); doc.setFont('helvetica', 'normal');
  [`Overall: ${report.scores.overall}/100`, `Attendance: ${report.scores.attendance}/100    Networking: ${report.scores.networking}/100`, `Speakers: ${report.scores.speakers}/100    Sponsors: ${report.scores.sponsors}/100`].forEach(l => { doc.text(l, m, y); y += 5; }); y += 6;

  chk(30); doc.setFontSize(13); doc.setFont('helvetica', 'bold'); doc.text('Attendance', m, y); y += 8;
  doc.setFontSize(10); doc.setFont('helvetica', 'normal');
  [`Invited: ${report.attendance.invited}  RSVP: ${report.attendance.rsvp_yes}  Attended: ${report.attendance.attended}`, `Rate: ${report.attendance.attendance_rate.toFixed(1)}%  No-shows: ${report.attendance.no_shows}`].forEach(l => { doc.text(l, m, y); y += 5; }); y += 6;

  chk(30); doc.setFontSize(13); doc.setFont('helvetica', 'bold'); doc.text('Networking', m, y); y += 8;
  doc.setFontSize(10); doc.setFont('helvetica', 'normal');
  [`Interactions: ${report.networking.total_interactions}  Connections: ${report.networking.connections}  Meetings: ${report.networking.meetings}`, `Quality: ${report.networking.quality_score.toFixed(0)}/100  Acceptance: ${report.networking.acceptance_rate.toFixed(0)}%`].forEach(l => { doc.text(l, m, y); y += 5; }); y += 6;

  chk(20); doc.setFontSize(13); doc.setFont('helvetica', 'bold'); doc.text('Speakers', m, y); y += 8;
  doc.setFontSize(9); doc.setFont('helvetica', 'normal');
  report.speakers.forEach(s => { chk(6); doc.text(`${s.name} — Impact: ${s.impact.toFixed(0)}/100, Fill: ${s.fill_rate.toFixed(0)}%`, m, y); y += 5; }); y += 6;

  if (report.sponsors.length > 0) { chk(20); doc.setFontSize(13); doc.setFont('helvetica', 'bold'); doc.text('Sponsors', m, y); y += 8;
    doc.setFontSize(9); doc.setFont('helvetica', 'normal');
    report.sponsors.forEach(s => { chk(6); doc.text(`${s.name} (${s.tier}) — ROI: ${s.roi_score.toFixed(0)}/100, Leads: ${s.leads}`, m, y); y += 5; }); y += 6; }

  chk(20); doc.setFontSize(13); doc.setFont('helvetica', 'bold'); doc.text('Key Insights', m, y); y += 8;
  doc.setFontSize(9); doc.setFont('helvetica', 'normal');
  report.insights.forEach(ins => { chk(12); const p = ins.severity === 'critical' ? '!!' : ins.severity === 'warning' ? '!' : '+';
    doc.text(`${p} ${ins.title}`, m, y); y += 4;
    doc.splitTextToSize(ins.message, w - m * 2).forEach(l => { chk(5); doc.text(l, m + 4, y); y += 4; }); y += 3; });

  chk(20); doc.setFontSize(13); doc.setFont('helvetica', 'bold'); doc.text('Recommendations', m, y); y += 8;
  doc.setFontSize(9); doc.setFont('helvetica', 'normal');
  report.recommendations.forEach(r => { chk(15 + r.actions.length * 5);
    doc.setFont('helvetica', 'bold'); doc.text(`[${r.priority.toUpperCase()}] ${r.title}`, m, y); y += 5;
    doc.setFont('helvetica', 'normal'); r.actions.forEach(a => { chk(5); doc.text(`> ${a}`, m + 4, y); y += 4; }); y += 4; });

  const pc = doc.getNumberOfPages();
  for (let i = 1; i <= pc; i++) { doc.setPage(i); doc.setFontSize(8); doc.setTextColor(141, 132, 124);
    doc.text(`Event Intelligence Engine — ${report.event.name}`, m, 285);
    doc.text(`Page ${i}/${pc}`, w - m, 285, { align: 'right' }); }

  doc.save(`${report.event.name.replace(/[^a-zA-Z0-9]/g, '_')}_report.pdf`);
}
