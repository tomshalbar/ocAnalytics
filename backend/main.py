from fastapi import FastAPI

from backend.api.routes import router

import logging
from contextlib import asynccontextmanager
from starlette.concurrency import run_in_threadpool
from backend.services.forecasting.config import forecast_enabled
from backend.services.forecasting import services as forecasting


@asynccontextmanager
async def lifespan(app):
    if forecast_enabled():
        try:
            await run_in_threadpool(forecasting.preload)
        except Exception:
            logging.getLogger(__name__).exception(
                "Forecast model preload failed; existing data APIs remain available"
            )
    yield


app = FastAPI(title="Open Court Analytics API", lifespan=lifespan)


@app.get("/")
def root():
    return {"message": "Open Court Analytics API is running"}


app.include_router(router)
