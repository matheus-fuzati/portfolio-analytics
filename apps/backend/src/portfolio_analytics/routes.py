from datetime import date, timedelta

from fastapi import APIRouter, Query

from portfolio_analytics import queries

router = APIRouter(prefix="/api")


def _default_range(start: date | None, end: date | None) -> tuple[date, date]:
    end = end or date.today()
    start = start or end - timedelta(days=28)
    return start, end


@router.get("/projects/interest")
def get_projects_interest(start: date | None = Query(None), end: date | None = Query(None)):
    start, end = _default_range(start, end)
    return queries.project_interest(start, end)


@router.get("/contact/funnel")
def get_contact_funnel(start: date | None = Query(None), end: date | None = Query(None)):
    start, end = _default_range(start, end)
    return queries.contact_funnel(start, end)


@router.get("/engagement/depth")
def get_engagement_depth(start: date | None = Query(None), end: date | None = Query(None)):
    start, end = _default_range(start, end)
    return queries.engagement_depth(start, end)
