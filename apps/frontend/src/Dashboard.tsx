import { useEffect, useMemo, useState } from 'react';
import './Dashboard.css';
import { fetchContactFunnel, fetchEngagementDepth, fetchProjectInterest } from './api';
import type { ContactFunnel, Period, ProjectInterestRow } from './types';

const PERIODS: Period[] = ['7d', '28d', '90d'];
const PERIOD_DAYS: Record<Period, number> = { '7d': 7, '28d': 28, '90d': 90 };

// Slugs reais do portfólio (ver src/content/content.ts no repo do site) — títulos
// renomeados na v1 do site não mudaram o slug, então o mapeamento fica só aqui.
const PROJECT_TITLES: Record<string, string> = {
  'polaris-atlas': 'Atlas',
  'dp6-certifications': 'Plataforma de Certificações',
  'polaris-heap': 'Polaris',
};

function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function useDateRange(period: Period): { start: string; end: string } {
  return useMemo(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - PERIOD_DAYS[period]);
    return { start: toIsoDate(start), end: toIsoDate(end) };
  }, [period]);
}

interface FetchState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

function useFetch<T>(fetcher: () => Promise<T>, deps: unknown[]): FetchState<T> {
  const [state, setState] = useState<FetchState<T>>({ data: null, loading: true, error: null });

  useEffect(() => {
    let cancelled = false;
    setState({ data: null, loading: true, error: null });
    fetcher()
      .then((data) => {
        if (!cancelled) setState({ data, loading: false, error: null });
      })
      .catch((err: Error) => {
        if (!cancelled) setState({ data: null, loading: false, error: err.message });
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return state;
}

interface ProjectBar {
  id: string;
  name: string;
  viewClicks: number;
  galleryOpens: number;
  viewPct: number;
  galleryPct: number;
}

function groupProjectInterest(rows: ProjectInterestRow[]): ProjectBar[] {
  const byProject = new Map<string, { viewClicks: number; galleryOpens: number }>();
  for (const row of rows) {
    const id = row.item_id ?? '—';
    const entry = byProject.get(id) ?? { viewClicks: 0, galleryOpens: 0 };
    if (row.event_name === 'select_content') entry.viewClicks += row.event_count;
    if (row.event_name === 'project_gallery_open') entry.galleryOpens += row.event_count;
    byProject.set(id, entry);
  }
  const list = [...byProject.entries()].map(([id, v]) => ({
    id,
    name: PROJECT_TITLES[id] ?? id,
    ...v,
  }));
  const max = Math.max(1, ...list.map((p) => Math.max(p.viewClicks, p.galleryOpens)));
  return list
    .map((p) => ({
      ...p,
      viewPct: Math.round((p.viewClicks / max) * 100),
      galleryPct: Math.round((p.galleryOpens / max) * 100),
    }))
    .sort((a, b) => b.viewClicks - a.viewClicks);
}

function pagePath(location: string | null): string {
  if (!location) return '—';
  try {
    return new URL(location).pathname;
  } catch {
    return location;
  }
}

function FunnelSteps({ steps }: { steps: ContactFunnel['steps'] }) {
  const items = [
    { label: 'Visitantes', value: steps.visita },
    { label: 'Clicou em "Ver projeto"', value: steps.clique_projeto },
    { label: 'Fez contato', value: steps.contato },
  ];
  const max = Math.max(1, items[0].value);
  return (
    <>
      {items.map((s) => (
        <div className="bar-row" key={s.label}>
          <div className="bar-row-head">
            <span className="bar-row-name">{s.label}</span>
            <span className="mono bar-row-value">
              {s.value} · {Math.round((s.value / max) * 100)}%
            </span>
          </div>
          <div className="bar-track">
            <div className="bar-fill good" style={{ width: `${Math.round((s.value / max) * 100)}%` }} />
          </div>
        </div>
      ))}
    </>
  );
}

export default function Dashboard() {
  const [period, setPeriod] = useState<Period>('28d');
  const { start, end } = useDateRange(period);

  const interest = useFetch(() => fetchProjectInterest(start, end), [start, end]);
  const funnel = useFetch(() => fetchContactFunnel(start, end), [start, end]);
  const engagement = useFetch(() => fetchEngagementDepth(start, end), [start, end]);

  const projects = interest.data ? groupProjectInterest(interest.data) : [];

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div>
          <div className="mono dashboard-eyebrow">portfolio-analytics</div>
          <h1 className="heading dashboard-title">Painel de Analytics</h1>
        </div>
        <div className="period-switch">
          {PERIODS.map((p) => (
            <button
              key={p}
              type="button"
              className={`mono period-btn ${p === period ? 'active' : ''}`}
              onClick={() => setPeriod(p)}
            >
              {p}
            </button>
          ))}
        </div>
      </header>

      <div className="card-grid">
        <section className="card">
          <div className="card-kicker">
            <span className="mono card-kicker-label">01 interesse</span>
            <h2 className="heading card-kicker-title">Interesse por projeto</h2>
          </div>
          {interest.loading && <p className="state-message">Carregando…</p>}
          {interest.error && <p className="state-message error">Sem dados ainda — {interest.error}</p>}
          {!interest.loading && !interest.error && projects.length === 0 && (
            <p className="state-message">Nenhum evento no período.</p>
          )}
          {projects.map((p) => (
            <div className="bar-row" key={p.id}>
              <div className="bar-row-head">
                <span className="bar-row-name">{p.name}</span>
                <span className="mono bar-row-value">
                  {p.viewClicks} ver · {p.galleryOpens} galeria
                </span>
              </div>
              <div className="bar-track">
                <div className="bar-fill" style={{ width: `${p.viewPct}%` }} />
              </div>
              <div className="bar-track">
                <div className="bar-fill good" style={{ width: `${p.galleryPct}%` }} />
              </div>
            </div>
          ))}
        </section>

        <section className="card">
          <div className="card-kicker">
            <span className="mono card-kicker-label">02 conversão</span>
            <h2 className="heading card-kicker-title">Funil de contato</h2>
          </div>
          {funnel.loading && <p className="state-message">Carregando…</p>}
          {funnel.error && <p className="state-message error">Sem dados ainda — {funnel.error}</p>}
          {funnel.data && <FunnelSteps steps={funnel.data.steps} />}
        </section>

        <section className="card">
          <div className="card-kicker">
            <span className="mono card-kicker-label">· canais</span>
            <h2 className="heading card-kicker-title">Contato por canal</h2>
          </div>
          {funnel.loading && <p className="state-message">Carregando…</p>}
          {funnel.error && <p className="state-message error">Sem dados ainda</p>}
          {funnel.data?.by_channel.map((c) => (
            <div className="channel-row" key={c.channel ?? '—'}>
              <span>{c.channel ?? '—'}</span>
              <span className="mono">{c.usuarios}</span>
            </div>
          ))}
        </section>

        <section className="card card-span">
          <div className="card-kicker">
            <span className="mono card-kicker-label">03 profundidade</span>
            <h2 className="heading card-kicker-title">Leitura a fundo vs. superficial</h2>
          </div>
          <div className="table-head">
            <span className="table-col-main">página</span>
            <span className="table-col-num">engajamento</span>
            <span className="table-col-num">scroll 90%</span>
          </div>
          {engagement.loading && <p className="state-message">Carregando…</p>}
          {engagement.error && (
            <p className="state-message error">Sem dados ainda — {engagement.error}</p>
          )}
          {engagement.data?.map((row, i) => (
            <div className="table-row" key={`${row.page_location}-${i}`}>
              <span className="table-col-main">{pagePath(row.page_location)}</span>
              <span className="mono table-col-num">
                {row.avg_engagement_ms ? `${Math.round(row.avg_engagement_ms / 1000)}s` : '—'}
              </span>
              <span className="mono table-col-num">
                {row.unique_users
                  ? `${Math.round((row.scroll_90_count / row.unique_users) * 100)}%`
                  : '—'}
              </span>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
