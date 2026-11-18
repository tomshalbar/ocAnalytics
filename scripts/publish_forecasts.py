"""Run locally: python -m scripts.publish_forecasts --location-id 3367 --dry-run."""
import argparse
from datetime import datetime, timedelta, timezone
import logging
import os

from dotenv import load_dotenv

from backend.db.database import PROJECT_ROOT

log = logging.getLogger(__name__)


def normalize_timestamps(payload: dict, source_timezone: str) -> dict:
    # Existing model pipeline emits local, offset-free hourly times. Reject DST
    # ambiguity instead of guessing; store explicit UTC timestamps for API clients.
    import pandas as pd

    def utc(value):
        ts = pd.Timestamp(value)
        if ts.tzinfo is None:
            ts = ts.tz_localize(source_timezone, ambiguous="raise", nonexistent="raise")
        return ts.tz_convert("UTC").isoformat()

    return {
        **payload,
        "generated_at": utc(payload["generated_at"]),
        "data_through": utc(payload["data_through"]),
        "forecast": [{**p, "timestamp": utc(p["timestamp"])} for p in payload["forecast"]],
    }


def publish_locations(location_ids, *, hours=168, dry_run=False,
                      allow_fallback=False, max_age_hours=6, source_max_age_hours=6):
    from backend.services.forecasting import services
    from backend.services.forecasting.repository import save_forecast, validate_snapshot

    failed = 0
    for location_id in location_ids:
        try:
            result = normalize_timestamps(
                services.get_forecast(location_id, hours),
                os.getenv("SOURCE_DATA_TIMEZONE", "America/New_York"),
            )
            result = validate_snapshot(result)
            if result["location_id"] != location_id:
                raise ValueError("Model output location does not match the requested location")
            age = datetime.now(timezone.utc) - datetime.fromisoformat(result["data_through"])
            if age < timedelta(0) or age > timedelta(hours=source_max_age_hours):
                raise ValueError("Source history is missing recent data; refusing to publish")
            if result["used_fallback"] and not allow_fallback:
                raise ValueError("Model used a fallback; rerun with --allow-fallback only if intended")
            if dry_run:
                log.info("Location %s: validated %s points (%s); no write", location_id,
                         len(result["forecast"]), result["model"])
            else:
                saved = save_forecast(result, max_age_hours=max_age_hours)
                log.info("Location %s: %s (%s)", location_id,
                         "uploaded" if saved else "kept newer snapshot", result["model"])
        except Exception:
            failed += 1
            log.exception("Location %s failed; existing snapshot retained", location_id)
    return 1 if failed else 0


def main():
    load_dotenv(PROJECT_ROOT / ".env")
    parser = argparse.ArgumentParser(description="Generate locally and publish predictions to Supabase")
    parser.add_argument("--location-id", type=int, action="append", help="Repeat to select locations; defaults to all configured")
    parser.add_argument("--hours", type=int, choices=range(1, 169), default=168, metavar="1-168")
    parser.add_argument("--max-age-hours", type=int, choices=range(1, 25), default=6, metavar="1-24")
    parser.add_argument("--source-max-age-hours", type=int, choices=range(1, 25), default=6, metavar="1-24")
    parser.add_argument("--dry-run", action="store_true", help="Run inference and validate without uploading")
    parser.add_argument("--allow-fallback", action="store_true", help="Explicitly permit baseline predictions if the model fails")
    args = parser.parse_args()
    from backend.services.forecasting.config import MODEL_BY_LOCATION
    locations = args.location_id or sorted(MODEL_BY_LOCATION)
    unknown = set(locations) - MODEL_BY_LOCATION.keys()
    if unknown:
        parser.error(f"No model configured for location IDs: {sorted(unknown)}")
    logging.basicConfig(level=logging.INFO)
    return publish_locations(locations, hours=args.hours, dry_run=args.dry_run,
                             allow_fallback=args.allow_fallback,
                             max_age_hours=args.max_age_hours,
                             source_max_age_hours=args.source_max_age_hours)


if __name__ == "__main__":
    raise SystemExit(main())
