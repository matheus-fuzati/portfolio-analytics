from functools import lru_cache

from google.cloud import bigquery

from portfolio_analytics.config import settings


@lru_cache
def get_client() -> bigquery.Client:
    return bigquery.Client(project=settings.gcp_project)
