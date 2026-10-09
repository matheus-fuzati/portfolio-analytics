from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from portfolio_analytics.config import settings
from portfolio_analytics.routes import router

app = FastAPI(title="portfolio-analytics")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_methods=["GET"],
    allow_headers=["*"],
)

app.include_router(router)


@app.get("/health")
def health():
    return {"status": "ok"}
