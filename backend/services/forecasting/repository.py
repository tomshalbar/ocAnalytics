"""Publish/read precomputed forecasts using the existing Supabase Postgres connection."""
from datetime import datetime, timedelta, timezone
import math

from psycopg.types.json import Jsonb

from backend.api.schemas import Forecast
from backend.db.database import get_db_connection


class ForecastUnavailable(Exception):
    """A valid snapshot with enough future hours is not available."""


def validate_snapshot(payload: dict) -> dict:
    """Reject incomplete, ambiguous, unordered, or non-finite model output."""
    forecast = Forecast.model_validate(payload)
    timestamps = [forecast.generated_at, forecast.data_through]
    timestamps.extend(p.timestamp for p in forecast.forecast)
    if not forecast.forecast or any(t.utcoffset() is None for t in timestamps):
        raise ValueError("Forecast timestamps must have explicit timezone offsets")
    previous = forecast.data_through
    for point in forecast.forecast:
        if point.timestamp - previous != timedelta(hours=1):
            raise ValueError("Forecast must contain consecutive hourly points")
        if any(not math.isfinite(v) for v in (point.lower, point.median, point.upper)):
            raise ValueError("Forecast values must be finite")
        if not 0 <= point.lower <= point.median <= point.upper:
            raise ValueError("Forecast bounds must be nonnegative and ordered")
        previous = point.timestamp
    return forecast.model_dump(mode="json")


def save_forecast(payload: dict, *, max_age_hours: int = 6) -> bool:
    """Commit a whole location at once. A late older job cannot replace a newer one."""
    payload = validate_snapshot(payload)
    generated = datetime.fromisoformat(payload["generated_at"])
    data_through = datetime.fromisoformat(payload["data_through"])
    if not 1 <= max_age_hours <= 24:
        raise ValueError("max_age_hours must be between 1 and 24")
    with get_db_connection() as conn, conn.cursor() as cur:
        cur.execute('''
            INSERT INTO public.forecast_snapshots
                (location_id, generated_at, data_through, expires_at, payload)
            VALUES (%s, %s, %s, %s, %s)
            ON CONFLICT (location_id) DO UPDATE SET
                generated_at = EXCLUDED.generated_at,
                data_through = EXCLUDED.data_through,
                expires_at = EXCLUDED.expires_at,
                payload = EXCLUDED.payload
            WHERE forecast_snapshots.generated_at < EXCLUDED.generated_at
              AND forecast_snapshots.data_through <= EXCLUDED.data_through
            RETURNING location_id
        ''', (payload["location_id"], generated, data_through,
              generated + timedelta(hours=max_age_hours), Jsonb(payload)))
        return cur.fetchone() is not None


def get_stored_forecast(location_id: int, hours: int, *, now=None) -> dict:
    now = now or datetime.now(timezone.utc)
    with get_db_connection() as conn, conn.cursor() as cur:
        cur.execute('''
            SELECT payload FROM public.forecast_snapshots
            WHERE location_id = %s AND expires_at > %s AND generated_at <= %s
        ''', (location_id, now, now))
        row = cur.fetchone()
    if row is None:
        raise ForecastUnavailable()
    payload = validate_snapshot(row["payload"])
    if payload["location_id"] != location_id:
        raise ValueError("Snapshot location does not match request")
    points = [p for p in payload["forecast"] if datetime.fromisoformat(p["timestamp"]) > now]
    # Do not silently return an old/gapped forecast or fewer hours than requested.
    next_hour = now.astimezone(timezone.utc).replace(minute=0, second=0, microsecond=0) + timedelta(hours=1)
    if len(points) < hours or datetime.fromisoformat(points[0]["timestamp"]) != next_hour:
        raise ForecastUnavailable()
    return {**payload, "forecast": points[:hours]}
