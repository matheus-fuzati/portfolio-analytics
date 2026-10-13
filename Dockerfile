# Imagem única (ADR-008 do dp6-billing-platform): o FastAPI serve o SPA buildado como
# estático + /api/* no mesmo serviço Cloud Run, em vez de 2 serviços atrás de proxy.

FROM node:22-slim AS frontend-builder
WORKDIR /app
RUN corepack enable
COPY apps/frontend/package.json apps/frontend/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY apps/frontend/ .
RUN pnpm run build

FROM python:3.12-slim AS backend-builder
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/
WORKDIR /app
COPY apps/backend/pyproject.toml apps/backend/uv.lock ./
RUN uv sync --frozen --no-dev --no-install-project
COPY apps/backend/src ./src
RUN uv sync --frozen --no-dev

FROM python:3.12-slim
RUN useradd --create-home --shell /bin/bash app
WORKDIR /app
COPY --from=backend-builder /app/.venv ./.venv
COPY --from=backend-builder /app/src ./src
COPY --from=frontend-builder /app/dist ./src/portfolio_analytics/static
USER app
ENV PATH="/app/.venv/bin:$PATH"
EXPOSE 8080
CMD ["sh", "-c", "uvicorn portfolio_analytics.main:app --host 0.0.0.0 --port ${PORT:-8080}"]
