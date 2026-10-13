from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Nunca ler os.environ fora deste módulo — resto do código usa `settings`."""

    model_config = SettingsConfigDict(env_prefix="PORTFOLIO_ANALYTICS_")

    gcp_project: str = "portfolio-analytics-fuzati"
    # analytics_<property_id>, criado pelo link GA4->BigQuery.
    bq_dataset: str = "analytics_558211221"
    cors_origins: list[str] = ["http://localhost:5173"]


settings = Settings()
