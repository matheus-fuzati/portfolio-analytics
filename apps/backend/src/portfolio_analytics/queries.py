"""As 3 queries da v1, mapeadas 1:1 nas views do painel (ver specs/05-analytics-spec.md
no repo do portfólio). Schema do export GA4->BigQuery: cada evento é uma linha em
`events_*`, com `event_params` como RECORD repetido (key + value.{string,int}_value).
"""

from datetime import date

from google.cloud import bigquery

from portfolio_analytics.bigquery_client import get_client
from portfolio_analytics.config import settings


def _events_table() -> str:
    if not settings.bq_dataset:
        raise RuntimeError(
            "PORTFOLIO_ANALYTICS_BQ_DATASET não configurado — defina o dataset "
            "analytics_<property_id> criado pelo link GA4->BigQuery antes de consultar."
        )
    return f"`{settings.gcp_project}.{settings.bq_dataset}.events_*`"


def _date_range_params(start: date, end: date) -> list[bigquery.ScalarQueryParameter]:
    return [
        bigquery.ScalarQueryParameter("start_date", "STRING", start.strftime("%Y%m%d")),
        bigquery.ScalarQueryParameter("end_date", "STRING", end.strftime("%Y%m%d")),
    ]


def _run(query: str, start: date, end: date) -> bigquery.table.RowIterator:
    job_config = bigquery.QueryJobConfig(query_parameters=_date_range_params(start, end))
    return get_client().query(query, job_config=job_config).result()


def project_interest(start: date, end: date) -> list[dict]:
    query = f"""
        SELECT
          (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'item_id') AS item_id,
          event_name,
          COUNT(*) AS event_count
        FROM {_events_table()}
        WHERE event_name IN ('select_content', 'project_gallery_open')
          AND _TABLE_SUFFIX BETWEEN @start_date AND @end_date
        GROUP BY item_id, event_name
        ORDER BY event_count DESC
    """
    return [dict(row.items()) for row in _run(query, start, end)]


def contact_funnel(start: date, end: date) -> dict:
    steps_query = f"""
        WITH flagged AS (
          SELECT
            user_pseudo_id,
            LOGICAL_OR(event_name = 'page_view') AS visitou,
            LOGICAL_OR(event_name = 'select_content') AS clicou_projeto,
            LOGICAL_OR(event_name IN ('contact_click', 'cv_print_click')) AS converteu
          FROM {_events_table()}
          WHERE _TABLE_SUFFIX BETWEEN @start_date AND @end_date
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
          (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'channel') AS channel,
          COUNT(DISTINCT user_pseudo_id) AS usuarios
        FROM {_events_table()}
        WHERE event_name = 'contact_click' AND _TABLE_SUFFIX BETWEEN @start_date AND @end_date
        GROUP BY channel
        ORDER BY usuarios DESC
    """
    steps_row = next(iter(_run(steps_query, start, end)))
    channels = [dict(row.items()) for row in _run(channel_query, start, end)]
    return {"steps": dict(steps_row.items()), "by_channel": channels}


def engagement_depth(start: date, end: date) -> list[dict]:
    query = f"""
        SELECT
          (SELECT value.string_value FROM UNNEST(event_params)
           WHERE key = 'page_location') AS page_location,
          AVG((SELECT value.int_value FROM UNNEST(event_params)
               WHERE key = 'engagement_time_msec')) AS avg_engagement_ms,
          COUNTIF(event_name = 'scroll') AS scroll_90_count,
          COUNT(DISTINCT user_pseudo_id) AS unique_users
        FROM {_events_table()}
        WHERE event_name IN ('user_engagement', 'scroll')
          AND _TABLE_SUFFIX BETWEEN @start_date AND @end_date
        GROUP BY page_location
        ORDER BY avg_engagement_ms DESC
    """
    return [dict(row.items()) for row in _run(query, start, end)]
