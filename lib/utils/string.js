export function toTitleCase(input = '') {
  const lower = String(input).toLowerCase().replace(/\s+/g, ' ').trim();
  const keepLower = new Set(['da','de','do','das','dos','e']);
  return lower.split(' ').filter(Boolean).map((p, i) => {
    if (i > 0 && keepLower.has(p)) return p;
    return p.charAt(0).toUpperCase() + p.slice(1);
  }).join(' ');
}

export function normalizeName(s = '') {
  return String(s)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
