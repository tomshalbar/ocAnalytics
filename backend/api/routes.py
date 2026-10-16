from fastapi import APIRouter, HTTPException

from backend.db.database import get_db_connection
from datetime import datetime


router = APIRouter()


@router.get("/locations/{location_id}/latest")
def get_latest_location(location_id: int):

    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT *
                FROM raw_recsports_data
                WHERE "LocationId" = %s
                ORDER BY "runDatetime" DESC
                LIMIT 1;
                """,
                (location_id,)
            )

            row = cur.fetchone()

    if row is None:
        raise HTTPException(
            status_code=404,
            detail="Location not found"
        )

    return row

@router.get("/locations/latest")
def get_latest_locations():
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT DISTINCT ON ("LocationId") *
                FROM raw_recsports_data
                ORDER BY "LocationId", "runDatetime" DESC;
                """
            )

            rows = cur.fetchall()

    return rows

@router.get("/locations/{location_id}/history")
def get_location_history(
    location_id: int,
    start: datetime,
    end: datetime
):
    if start >= end:
        raise HTTPException(
            status_code=400,
            detail="Start time must be before end time"
        )

    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT *
                FROM raw_recsports_data
                WHERE "LocationId" = %s
                  AND "runDatetime" >= %s
                  AND "runDatetime" <= %s
                ORDER BY "runDatetime" ASC;
                """,
                (location_id, start, end)
            )

            rows = cur.fetchall()

    return rows


@router.get("/locations/{location_id}/stats")
def get_location_stats(
    location_id: int,
    start: datetime,
    end: datetime
):
    if start >= end:
        raise HTTPException(
            status_code=400,
            detail="Start time must be before end time"
        )

    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT
                    COUNT(*) AS total_readings,
                    ROUND(AVG("LastCount"), 2) AS average_count,
                    MIN("LastCount") AS minimum_count,
                    MAX("LastCount") AS maximum_count
                FROM raw_recsports_data
                WHERE "LocationId" = %s
                  AND "runDatetime" >= %s
                  AND "runDatetime" <= %s
                  AND "IsClosed" = false;
                """,
                (location_id, start, end)
            )

            stats = cur.fetchone()
            if stats["total_readings"] == 0:
                raise HTTPException(
                    status_code=404,
                    detail="No occupancy data found for this location and date range"
                )

            return {
                "location_id": location_id,
                "start": start,
                "end": end,
                "statistics": stats
            }


@router.get("/locations/{location_id}/trends")
def get_location_trends(location_id: int, start: datetime, end: datetime):
    if start >= end:
        raise HTTPException(
            status_code=400,
            detail="Start time must be before end time"
        )

    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT
                    EXTRACT(HOUR FROM "runDatetime")::int AS hour,
                    ROUND(AVG("LastCount"), 2) AS average_count,
                    COUNT(*) AS total_readings
                FROM raw_recsports_data
                WHERE "LocationId" = %s
                  AND "runDatetime" >= %s
                  AND "runDatetime" <= %s
                  AND "IsClosed" = false
                GROUP BY EXTRACT(HOUR FROM "runDatetime")
                ORDER BY hour;
            """, (location_id, start, end))

            rows = cur.fetchall()

    if not rows:
        raise HTTPException(
            status_code=404,
            detail="No occupancy data found for this location and date range"
        )

    return {
        "location_id": location_id,
        "start": start,
        "end": end,
        "hourly_averages": rows
    }