import logging
import threading
from datetime import datetime, timezone

from cachetools import TTLCache

from backend.services.forecasting.config import (
    CACHE_MAX_ITEMS,
    CACHE_TTL_SECONDS,
    MODEL_BY_LOCATION,
)
from backend.services.forecasting.pipeline import (
    build_series,
    future_index,
    load_readings,
    postprocess,
)
from backend.services.forecasting.runners import RUNNERS, ModelStore

log = logging.getLogger(__name__)

store = ModelStore()
cache = TTLCache(maxsize=CACHE_MAX_ITEMS, ttl=CACHE_TTL_SECONDS)
cache_lock = threading.Lock()
infer_lock = (
    threading.Lock()
)  # one model call at a time; torch models may not be thread-safe


def preload() -> None:
    """Load every pretrained model in use once. Call from main.py's lifespan."""
    store.preload({cfg["type"] for cfg in MODEL_BY_LOCATION.values()})


def get_forecast(location_id: int, hours: int) -> dict:
    """Cached forecast for one location. Raises LookupError if there are no readings."""
    key = (location_id, hours)
    with cache_lock:
        hit = cache.get(key)
    if hit is not None:
        return hit

    result = _compute(location_id, hours)
    if not result[
        "used_fallback"
    ]:  # don't cache fallbacks, so the next request retries
        with cache_lock:
            cache[key] = result
    return result


def _compute(location_id: int, hours: int) -> dict:
    cfg = MODEL_BY_LOCATION[location_id]
    y = build_series(load_readings(location_id))  # LookupError if no data

    model_used, fallback = cfg["type"], False
    try:
        with infer_lock:
            raw = RUNNERS[model_used](y, hours, cfg, store)
    except Exception:
        log.exception(
            "model %s failed for location %s; using baseline", model_used, location_id
        )
        raw = RUNNERS["naive"](y, hours, {}, store)
        model_used, fallback = "naive", True

    out = postprocess(future_index(y, hours), raw["median"], raw["lower"], raw["upper"])

    return {
        "location_id": location_id,
        "model": model_used,
        "used_fallback": fallback,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "data_through": y.index[-1].isoformat(),
        "forecast": [
            {
                "timestamp": ts.isoformat(),
                "median": round(float(row["median"]), 2),
                "lower": round(float(row["lower"]), 2),
                "upper": round(float(row["upper"]), 2),
            }
            for ts, row in out.iterrows()
        ],
    }
