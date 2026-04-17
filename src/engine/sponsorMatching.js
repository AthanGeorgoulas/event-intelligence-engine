const WEIGHTS = { role_match: 0.30, industry_match: 0.25, interest_overlap: 0.25, networking_intent: 0.20 };
const INTENT_SCORES = { high: 100, medium: 50, low: 20 };

function scoreMatch(profile, sponsor) {
  const role = (!sponsor.target_roles?.length) ? 50 :
    sponsor.target_roles.map(r => r.toLowerCase()).includes(profile.role?.toLowerCase()) ? 100 : 0;
  const industry = (!sponsor.target_industries?.length) ? 50 :
    sponsor.target_industries.map(i => i.toLowerCase()).includes(profile.industry?.toLowerCase()) ? 100 : 0;
  let interests = 0;
  if (profile.interests?.length && sponsor.tags?.length) {
    const setA = new Set(profile.interests.map(i => i.toLowerCase()));
    const setB = new Set(sponsor.tags.map(t => t.toLowerCase()));
    interests = ([...setA].filter(i => setB.has(i)).length / setA.size) * 100;
  }
  const intent = INTENT_SCORES[profile.networking_intent] || 50;
  const total = WEIGHTS.role_match * role + WEIGHTS.industry_match * industry +
    WEIGHTS.interest_overlap * interests + WEIGHTS.networking_intent * intent;
  return {
    user_id: profile.user_id, name: profile.name, role: profile.role,
    industry: profile.industry, company: profile.company,
    scores: { role_match: Math.round(role), industry_match: Math.round(industry),
      interest_overlap: Math.round(interests), networking_intent: Math.round(intent) },
    match_score: Math.round(total),
  };
}

export function recommendSponsorMatches(parsedData) {
  const { profiles, sponsors, attendance } = parsedData;
  const attendedIds = new Set(attendance.filter(a => a.attended).map(a => a.user_id));
  const activeProfiles = profiles.filter(p => attendedIds.has(p.user_id));
  return sponsors.map(sponsor => ({
    sponsor_id: sponsor.sponsor_id, sponsor_name: sponsor.name, sponsor_tier: sponsor.tier,
    top_matches: activeProfiles.map(p => scoreMatch(p, sponsor)).sort((a, b) => b.match_score - a.match_score).slice(0, 20),
  }));
}
