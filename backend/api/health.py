
"""Read-only health monitoring for the occupancy data pipeline."""

import logging
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo
import os

import psycopg
from fastapi import APIRouter, HTTPException

from backend.db.database import get_db_connection

router = APIRouter(prefix="/health", tags=["Health"])
logger = logging.getLogger(__name__)

FRESHNESS_THRESHOLD = timedelta(minutes=30)


@router.get("/data")
def get_data_health():
    """Check the latest stored collection for each location."""

    sql = """
        SELECT DISTINCT ON ("LocationId")
            "LocationId",
            "runDatetime"
        FROM raw_recsports_data
        ORDER BY "LocationId", "runDatetime" DESC, id DESC
    """

    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(sql)
                rows = cur.fetchall()

    except psycopg.Error:
        logger.exception("Data pipeline health check failed")
        raise HTTPException(
            status_code=503,
            detail="Database health check unavailable"
        ) from None

    now = datetime.now(timezone.utc)
    source_zone = ZoneInfo(os.getenv("RAW_DATA_TIMEZONE", "UTC"))

    fresh = 0
    latest_collection = None

    for row in rows:
        collected = row["runDatetime"]

        if collected.tzinfo is None:
            collected = collected.replace(tzinfo=source_zone)

        collected = collected.astimezone(timezone.utc)

        if latest_collection is None or collected > latest_collection:
            latest_collection = collected

        if timedelta(0) <= now - collected <= FRESHNESS_THRESHOLD:
            fresh += 1

    total = len(rows)
    stale = total - fresh

    return {
        "status": (
            "no_data" if total == 0
            else "healthy" if stale == 0
            else "degraded"
        ),
        "checked_at": now.isoformat(),
        "latest_collection": (
            latest_collection.isoformat()
            if latest_collection else None
        ),
        "total_locations": total,
        "fresh_locations": fresh,
        "stale_locations": stale,
        "freshness_threshold_minutes": 30
    }
