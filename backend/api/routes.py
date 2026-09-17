from fastapi import APIRouter, HTTPException

from backend.db.database import get_db_connection


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