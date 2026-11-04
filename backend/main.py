from fastapi import FastAPI

from backend.api.routes import router

from contextlib import asynccontextmanager
from backend.services.forecasting import services as forecasting


@asynccontextmanager
async def lifespan(app):
    forecasting.preload()
    yield


app = FastAPI(title="Open Court Analytics API", lifespan=lifespan)


@app.get("/")
def root():
    return {"message": "Open Court Analytics API is running"}


app.include_router(router)
