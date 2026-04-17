export function normalizeEventInput(inputs) {
  if (!Array.isArray(inputs)) return inputs;
  const merged = {};
  for (const partial of inputs) {
    if (!partial || typeof partial !== 'object') continue;
    Object.keys(partial).forEach(key => {
      if (Array.isArray(partial[key]) && Array.isArray(merged[key])) {
        merged[key] = [...merged[key], ...partial[key]];
      } else if (typeof partial[key] === 'object' && !Array.isArray(partial[key]) && merged[key]) {
        merged[key] = { ...merged[key], ...partial[key] };
      } else {
        merged[key] = partial[key];
      }
    });
  }
  return merged;
}
