"""Read-only occupancy endpoints over raw data, pending metadata completion."""
from datetime import datetime, timedelta, timezone
import logging
import os
from zoneinfo import ZoneInfo

from fastapi import APIRouter, HTTPException, Query
import psycopg

from backend.api.schemas import Observation, StatisticsResponse
from backend.db.database import get_db_connection

router = APIRouter()
logger = logging.getLogger(__name__)
# Legacy scraper timestamps have no offset. Set this to the scraper host timezone.
LEGACY_TIMEZONE = ZoneInfo(os.getenv("RAW_DATA_TIMEZONE", "UTC"))
SOURCE_TIMEZONE = ZoneInfo(os.getenv("SOURCE_DATA_TIMEZONE", "America/New_York"))
STALE_AFTER = timedelta(minutes=30)
COLUMNS = '''id, "LocationId", "FacilityId", "CountOfParticipants",
    "PercetageCapacity", "LastCount", "IsClosed",
    "LastUpdatedDateAndTime", "runDatetime"'''


def query(sql, params=(), *, many=False):
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(sql, params)
                return cur.fetchall() if many else cur.fetchone()
    except psycopg.Error:
        logger.exception("Occupancy database query failed")
        raise HTTPException(503, "Occupancy data temporarily unavailable") from None


def aware(value, zone):
    return value.replace(tzinfo=zone) if value.tzinfo is None else value


def observation(row):
    result = dict(row)
    now = datetime.now(timezone.utc)
    collected = aware(row["runDatetime"], LEGACY_TIMEZONE)
    updated = row["LastUpdatedDateAndTime"]
    updated = aware(updated, SOURCE_TIMEZONE) if updated else None
    result.update(
        runDatetime=collected,
        LastUpdatedDateAndTime=updated,
        is_stale=updated is None or now - updated > STALE_AFTER,
        collection_is_stale=now - collected > STALE_AFTER,
    )
    return result


@router.get("/locations/{location_id}/summary")
def get_location_summary(location_id: int):
    row = query('''
        SELECT
            "LocationId" AS location_id,
            "LastCount" AS count,
            "IsClosed" AS is_closed,
            "runDatetime" AS last_updated
        FROM raw_recsports_data
        WHERE "LocationId" = %s
        ORDER BY "runDatetime" DESC, id DESC
        LIMIT 1
    ''', (location_id,))

    if row is None:
        raise HTTPException(404, "Location not found")

    return row

def time_range(start, end):
    if start.tzinfo is None or end.tzinfo is None:
        raise HTTPException(400, "start and end must include a timezone offset")
    if start >= end:
        raise HTTPException(400, "Start time must be before end time")
    if end - start > timedelta(days=31):
        raise HTTPException(400, "Date range must not exceed 31 days")
    # runDatetime is a legacy timestamp WITHOUT time zone.
    return tuple(value.astimezone(LEGACY_TIMEZONE).replace(tzinfo=None)
                 for value in (start, end))


@router.get("/locations/latest", response_model=list[Observation])
def get_latest_locations():
    rows = query(f'''SELECT DISTINCT ON ("LocationId") {COLUMNS}
        FROM raw_recsports_data
        ORDER BY "LocationId", "runDatetime" DESC, id DESC''', many=True)
    return [observation(row) for row in rows]


@router.get("/locations/{location_id}/latest", response_model=Observation)
def get_latest_location(location_id: int):
    row = query(f'''SELECT {COLUMNS} FROM raw_recsports_data
        WHERE "LocationId" = %s
        ORDER BY "runDatetime" DESC, id DESC LIMIT 1''', (location_id,))
    if row is None:
        raise HTTPException(404, "Location not found")
    return observation(row)


@router.get("/locations/{location_id}/history", response_model=list[Observation])
def get_location_history(location_id: int, start: datetime, end: datetime,
                         limit: int = Query(100, ge=1, le=1000),
                         offset: int = Query(0, ge=0, le=100000)):
    bounds = time_range(start, end)
    rows = query(f'''SELECT {COLUMNS} FROM raw_recsports_data
        WHERE "LocationId" = %s AND "runDatetime" >= %s AND "runDatetime" < %s
        ORDER BY "runDatetime" ASC, id ASC LIMIT %s OFFSET %s''',
        (location_id, *bounds, limit, offset), many=True)
    return [observation(row) for row in rows]


@router.get("/locations/{location_id}/trends")
def get_location_trends(location_id: int, start: datetime, end: datetime):
    bounds = time_range(start, end)

    rows = query('''
        SELECT
            EXTRACT(HOUR FROM "runDatetime")::int AS hour,
            ROUND(AVG("LastCount"), 2) AS average_count,
            COUNT(*) AS total_readings
        FROM raw_recsports_data
        WHERE "LocationId" = %s
          AND "runDatetime" >= %s
          AND "runDatetime" < %s
          AND "IsClosed" = false
          AND "LastCount" IS NOT NULL
        GROUP BY EXTRACT(HOUR FROM "runDatetime")
        ORDER BY hour
    ''', (location_id, *bounds), many=True)

    if not rows:
        raise HTTPException(
            404, "No occupancy data found for this location and date range"
        )

    return {
        "location_id": location_id,
        "start": start,
        "end": end,
        "hourly_averages": rows
    }


@router.get("/locations/{location_id}/stats", response_model=StatisticsResponse)
def get_location_stats(location_id: int, start: datetime, end: datetime):
    bounds = time_range(start, end)
    stats = query('''SELECT COUNT(*) AS total_readings,
        ROUND(AVG("LastCount"), 2) AS average_count,
        MIN("LastCount") AS minimum_count, MAX("LastCount") AS maximum_count
        FROM raw_recsports_data
        WHERE "LocationId" = %s AND "runDatetime" >= %s AND "runDatetime" < %s
        AND "IsClosed" = false AND "LastCount" IS NOT NULL''',
        (location_id, *bounds))
    if stats["total_readings"] == 0:
        raise HTTPException(404, "No occupancy data found for this location and date range")
    return dict(location_id=location_id, start=start, end=end, statistics=stats)