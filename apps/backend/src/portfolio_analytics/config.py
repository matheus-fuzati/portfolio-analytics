from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Nunca ler os.environ fora deste módulo — resto do código usa `settings`."""

    model_config = SettingsConfigDict(env_prefix="PORTFOLIO_ANALYTICS_")

    gcp_project: str = "portfolio-analytics-fuzati"
    # Dataset do pipeline Dataform (workflow_settings.yaml), não o dataset bruto do GA4
    # export — as views rpt_* que o backend lê vivem aqui.
    dataform_dataset: str = "portfolio_analytics_dataform"
    cors_origins: list[str] = ["http://localhost:5173"]


settings = Settings()
