from fastapi import FastAPI  # pyright: ignore[reportMissingImports]

from app.api.admin import router as admin_router
from app.api.prediction import router

app = FastAPI(title="ModelForege", version="1.0.0")

app.include_router(router)
app.include_router(admin_router)
