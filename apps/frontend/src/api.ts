import type { ContactFunnel, EngagementRow, ProjectInterestRow } from './types';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';

async function getJson<T>(path: string, params: Record<string, string>): Promise<T> {
  const url = new URL(`${API_BASE}${path}`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`${path} respondeu ${res.status}`);
  }
  return res.json();
}

export function fetchProjectInterest(start: string, end: string) {
  return getJson<ProjectInterestRow[]>('/api/projects/interest', { start, end });
}

export function fetchContactFunnel(start: string, end: string) {
  return getJson<ContactFunnel>('/api/contact/funnel', { start, end });
}

export function fetchEngagementDepth(start: string, end: string) {
  return getJson<EngagementRow[]>('/api/engagement/depth', { start, end });
}
