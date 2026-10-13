"""As 3 queries da v1, lendo as views `rpt_*` que o pipeline Dataform materializa
(ver `definitions/reporting/` neste repo e `specs/05-analytics-spec.md` no repo do site
pra taxonomia de eventos). O UNNEST(event_params) do export GA4->BigQuery já foi feito
uma vez só em `stg_portfolio_events` — aqui é só filtro de data + agregação final.
"""

from datetime import date

from google.cloud import bigquery

from portfolio_analytics.bigquery_client import get_client
from portfolio_analytics.config import settings


def _reporting_table(name: str) -> str:
    if not settings.dataform_dataset:
        raise RuntimeError(
            "PORTFOLIO_ANALYTICS_DATAFORM_DATASET não configurado — rode o pipeline "
            "Dataform (definitions/) antes de consultar."
        )
    return f"`{settings.gcp_project}.{settings.dataform_dataset}.{name}`"


def _date_range_params(start: date, end: date) -> list[bigquery.ScalarQueryParameter]:
    return [
        bigquery.ScalarQueryParameter("start_date", "DATE", start),
        bigquery.ScalarQueryParameter("end_date", "DATE", end),
    ]


def _run(query: str, start: date, end: date) -> bigquery.table.RowIterator:
    job_config = bigquery.QueryJobConfig(query_parameters=_date_range_params(start, end))
    return get_client().query(query, job_config=job_config).result()


def project_interest(start: date, end: date) -> list[dict]:
    query = f"""
        SELECT
          item_id,
          event_name,
          SUM(event_count) AS event_count
        FROM {_reporting_table('rpt_project_interest')}
        WHERE event_date BETWEEN @start_date AND @end_date
        GROUP BY item_id, event_name
        ORDER BY event_count DESC
    """
    return [dict(row.items()) for row in _run(query, start, end)]


def contact_funnel(start: date, end: date) -> dict:
    steps_query = f"""
        WITH flagged AS (
          SELECT
            user_pseudo_id,
            LOGICAL_OR(visitou) AS visitou,
            LOGICAL_OR(clicou_projeto) AS clicou_projeto,
            LOGICAL_OR(converteu) AS converteu
          FROM {_reporting_table('rpt_contact_funnel')}
          WHERE event_date BETWEEN @start_date AND @end_date
          GROUP BY user_pseudo_id
        )
        SELECT
          COUNTIF(visitou) AS visita,
          COUNTIF(clicou_projeto) AS clique_projeto,
          COUNTIF(converteu) AS contato
        FROM flagged
    """
    channel_query = f"""
        SELECT
          channel,
          COUNT(DISTINCT user_pseudo_id) AS usuarios
        FROM {_reporting_table('rpt_contact_channels')}
        WHERE event_date BETWEEN @start_date AND @end_date
        GROUP BY channel
        ORDER BY usuarios DESC
    """
    steps_row = next(iter(_run(steps_query, start, end)))
    channels = [dict(row.items()) for row in _run(channel_query, start, end)]
    return {"steps": dict(steps_row.items()), "by_channel": channels}


def engagement_depth(start: date, end: date) -> list[dict]:
    query = f"""
        SELECT
          page_location,
          AVG(engagement_time_msec) AS avg_engagement_ms,
          COUNTIF(event_name = 'scroll') AS scroll_90_count,
          COUNT(DISTINCT user_pseudo_id) AS unique_users
        FROM {_reporting_table('rpt_engagement_depth')}
        WHERE event_date BETWEEN @start_date AND @end_date
        GROUP BY page_location
        ORDER BY avg_engagement_ms DESC
    """
    return [dict(row.items()) for row in _run(query, start, end)]
