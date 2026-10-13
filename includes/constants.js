// Constantes e helpers compartilhados pelo pipeline do painel de analytics.
// Ver specs/05-analytics-spec.md no repo do site (taxonomia de eventos, fonte de verdade).

const V = dataform.projectConfig.vars;

const LOOKBACK_DAYS = Number(V.lookback_days || 400);

// GA4 export é sharded por dia (events_YYYYMMDD) — não existe um nome de tabela literal
// pra declarar via `ref()` (que resolve pra um nome exato, não um wildcard). Por isso o
// acesso é uma string de tabela crua, igual o resto do pipeline faz via ${} em vez de
// ${ref(...)} sempre que a origem não é uma tabela única (ver includes/billing_accounts.js
// no billing-platform pro mesmo padrão com múltiplas contas).
function ga4EventsTable() {
  return `\`${V.ga4_project}.${V.ga4_dataset}.events_*\``;
}

function lookbackFilter() {
  return (
    `_TABLE_SUFFIX BETWEEN FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL ${LOOKBACK_DAYS} DAY)) ` +
    `AND FORMAT_DATE('%Y%m%d', CURRENT_DATE())`
  );
}

// Só os event_name que alguma view de reporting usa hoje — nav_click/ui_toggle (também
// tagueados, ver spec) ficam fora porque nenhuma das 3 perguntas de negócio do painel
// precisa deles ainda.
const RELEVANT_EVENT_NAMES = [
  "select_content",
  "project_gallery_open",
  "contact_click",
  "cv_print_click",
  "page_view",
  "scroll",
  "user_engagement",
];

function relevantEventNamesList() {
  return RELEVANT_EVENT_NAMES.map((n) => `'${n}'`).join(", ");
}

module.exports = {
  LOOKBACK_DAYS,
  ga4EventsTable,
  lookbackFilter,
  RELEVANT_EVENT_NAMES,
  relevantEventNamesList,
};
