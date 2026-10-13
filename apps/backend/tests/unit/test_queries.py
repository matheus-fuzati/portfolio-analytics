from datetime import date

import pytest

from portfolio_analytics import queries
from portfolio_analytics.config import settings


def test_project_interest_requires_dataset_configured(monkeypatch):
    monkeypatch.setattr(settings, "bq_dataset", "")
    with pytest.raises(RuntimeError):
        queries.project_interest(date(2026, 1, 1), date(2026, 1, 28))
