export interface ProjectInterestRow {
  item_id: string | null;
  event_name: 'select_content' | 'project_gallery_open';
  event_count: number;
}

export interface ContactFunnel {
  steps: { visita: number; clique_projeto: number; contato: number };
  by_channel: { channel: string | null; usuarios: number }[];
}

export interface EngagementRow {
  page_location: string | null;
  avg_engagement_ms: number | null;
  scroll_90_count: number;
  unique_users: number;
}

export type Period = '7d' | '28d' | '90d';
