import type { ContactFunnel, EngagementRow, ProjectInterestRow } from './types';

// Vazio por padrão: em produção o FastAPI serve o front e a API na mesma origem (ver
// apps/backend/src/portfolio_analytics/main.py), então '/api/...' já basta. Só setar
// VITE_API_BASE_URL quando o front roda separado do backend (ex.: `vite dev` local).
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';

async function getJson<T>(path: string, params: Record<string, string>): Promise<T> {
  const url = new URL(`${API_BASE}${path}`, window.location.origin);
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
