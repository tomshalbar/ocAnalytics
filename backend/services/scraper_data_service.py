import pandas as pd
from backend.db.database import get_db_connection


def insert_into_database(scraped_df: pd.DataFrame) -> bool:
    insert_sql = """
        INSERT INTO raw_recsports_data (
            "LocationId",
            "CountOfParticipants",
            "PercetageCapacity",
            "LastUpdatedDateAndTime",
            "LastCount",
            "FacilityId",
            "IsClosed",
            "runDatetime"
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        ON CONFLICT ("LocationId", "runDatetime")
        DO NOTHING;
    """

    # Convert pandas NaN/NaT to Python None
    clean_df = scraped_df.astype(object).where(pd.notna(scraped_df), None)

    rows = list(
        clean_df[
            [
                "LocationId",
                "CountOfParticipants",
                "PercetageCapacity",
                "LastUpdatedDateAndTime",
                "LastCount",
                "FacilityId",
                "IsClosed",
                "runDatetime",
            ]
        ].itertuples(index=False, name=None)
    )

    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.executemany(insert_sql, rows)
        return True
    except Exception as e:
        print(f"failed to insert scraped data: {e}")
        return False
    finally:
        conn.close()
