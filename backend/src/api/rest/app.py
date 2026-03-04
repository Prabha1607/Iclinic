from fastapi import APIRouter, FastAPI
from src.api.rest.routes import auth
from src.api.rest.routes import voice
from src.api.rest.routes import users
from src.api.middleware.cors import add_cors_middleware
from src.api.middleware.logging import logging_middleware
from src.api.middleware.auth import AuthorizationMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from src.data.clients.postgres_client import init_db
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield

app = FastAPI(lifespan=lifespan)

app.add_middleware(AuthorizationMiddleware)
app.add_middleware(BaseHTTPMiddleware, dispatch = logging_middleware)

add_cors_middleware(app)

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(router=auth.router)
api_router.include_router(router = voice.router)
api_router.include_router(router = users.router)

app.include_router(router=api_router)
