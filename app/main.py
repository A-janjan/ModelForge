from fastapi import FastAPI

from app.api.prediction import router

app = FastAPI(title="ModelForege", version="1.0.0")

app.include_router(router)
