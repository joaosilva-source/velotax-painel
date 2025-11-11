export async function httpJson(url, options = {}) {
  const res = await fetch(url, { headers: { 'Content-Type': 'application/json', ...(options.headers||{}) }, ...options });
  if (!res.ok) {
    const text = await res.text().catch(()=>'');
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function httpText(url, options = {}) {
  const res = await fetch(url, options);
  if (!res.ok) {
    const text = await res.text().catch(()=>'');
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res.text();
}
