from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, PlainTextResponse

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


# O painel é público (sem IAP/auth — decisão explícita, ver plano de deploy), então ao
# menos tira da indexação de busca: X-Robots-Tag em toda resposta + robots.txt.
@app.middleware("http")
async def add_noindex_header(request, call_next):
    response = await call_next(request)
    response.headers["X-Robots-Tag"] = "noindex, nofollow"
    return response


@app.get("/robots.txt", response_class=PlainTextResponse)
def robots() -> str:
    return "User-agent: *\nDisallow: /\n"


@app.get("/health")
def health():
    return {"status": "ok"}


# Dockerfile da raiz builda o frontend e copia o dist/ aqui dentro — ausente em dev local
# (uvicorn direto, sem Docker), onde o Vite dev server serve o front separado.
STATIC_DIR = Path(__file__).resolve().parent / "static"

if STATIC_DIR.is_dir():

    @app.get("/{full_path:path}")
    def spa(full_path: str) -> FileResponse:
        candidate = STATIC_DIR / full_path
        if candidate.is_file():
            return FileResponse(candidate)
        return FileResponse(STATIC_DIR / "index.html")
