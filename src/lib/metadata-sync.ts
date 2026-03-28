export async function persistMetadataOnly(payload: {
  scoreBucket?: string;
  durationMs?: number;
  payerId?: string;
  createdAt?: string;
}) {
  const res = await fetch('/api/analysis/metadata', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(await res.text());
  }
  return await res.json();
}

export async function submitFeedback(payload: { analysisId?: string; gapId?: string; correct?: boolean; reasonCode?: string; note?: string }) {
  const res = await fetch('/api/feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(await res.text());
  }
  return await res.json();
}
