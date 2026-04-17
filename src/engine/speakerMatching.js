const WEIGHTS = { topic_relevance: 0.40, past_performance: 0.30, networking_impact: 0.20, audience_fit: 0.10 };

function tagOverlap(tagsA, tagsB) {
  if (!tagsA?.length || !tagsB?.length) return 0;
  const setA = new Set(tagsA.map(t => t.toLowerCase()));
  const setB = new Set(tagsB.map(t => t.toLowerCase()));
  const intersection = [...setA].filter(t => setB.has(t)).length;
  const union = new Set([...setA, ...setB]).size;
  return union > 0 ? (intersection / union) * 100 : 0;
}

function buildSpeakerProfiles(pastAnalyses) {
  const profiles = {};
  pastAnalyses.forEach(analysis => {
    (analysis.speakers || []).forEach(sp => {
      if (!profiles[sp.speaker_id]) {
        profiles[sp.speaker_id] = {
          speaker_id: sp.speaker_id, name: sp.name, tags: new Set(sp.tags || []),
          topic: sp.topic || '', events_count: 0, total_impact: 0,
          total_networking_triggered: 0, ratings: [],
        };
      }
      const p = profiles[sp.speaker_id];
      p.events_count++;
      p.total_impact += sp.impact_score || 0;
      p.total_networking_triggered += sp.networking_triggered || 0;
      if (sp.avg_rating) p.ratings.push(sp.avg_rating);
      (sp.tags || []).forEach(t => p.tags.add(t));
    });
  });
  return Object.values(profiles).map(p => ({
    ...p, tags: [...p.tags],
    avg_impact: p.events_count > 0 ? p.total_impact / p.events_count : 0,
    avg_networking: p.events_count > 0 ? p.total_networking_triggered / p.events_count : 0,
    avg_rating: p.ratings.length > 0 ? p.ratings.reduce((a, b) => a + b, 0) / p.ratings.length : null,
  }));
}

function scoreSpeaker(speaker, targetEvent) {
  const topic = tagOverlap(speaker.tags, targetEvent.tags || []);
  const perf = Math.min(100, speaker.avg_impact);
  const net = Math.min(100, (speaker.avg_networking / 20) * 100);
  const audience = tagOverlap(speaker.tags, targetEvent.target_audience?.interests || []);
  const total = WEIGHTS.topic_relevance * topic + WEIGHTS.past_performance * perf +
    WEIGHTS.networking_impact * net + WEIGHTS.audience_fit * audience;
  return {
    speaker_id: speaker.speaker_id, name: speaker.name, tags: speaker.tags,
    topic: speaker.topic, events_count: speaker.events_count,
    avg_impact: speaker.avg_impact, avg_rating: speaker.avg_rating,
    scores: { topic_relevance: Math.round(topic), past_performance: Math.round(perf),
      networking_impact: Math.round(net), audience_fit: Math.round(audience) },
    fit_score: Math.round(total),
  };
}

export function recommendSpeakers(pastAnalyses, targetEvent) {
  const profiles = buildSpeakerProfiles(pastAnalyses);
  return profiles.map(sp => scoreSpeaker(sp, targetEvent)).sort((a, b) => b.fit_score - a.fit_score);
}
