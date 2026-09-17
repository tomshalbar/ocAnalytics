from fastapi import FastAPI

from backend.api.routes import router


app = FastAPI(
    title="Open Court Analytics API"
)


@app.get("/")
def root():
    return {
        "message": "Open Court Analytics API is running"
    }


app.include_router(router)