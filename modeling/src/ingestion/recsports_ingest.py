import os
from pathlib import Path

import pandas as pd
import psycopg
from dotenv import load_dotenv

from modeling.src.scrapers.rec_sport_scraper import fetch_recsports_data


PROJECT_ROOT = Path(__file__).resolve().parents[3]

load_dotenv(PROJECT_ROOT / ".env")

CSV_PATH = (
    PROJECT_ROOT
    / "modeling"
    / "data"
    / "raw_recsports_data.csv"
)


def get_db_connection():
    database_url = os.getenv("DATABASE_URL")

    if not database_url:
        raise ValueError("DATABASE_URL not found")

    return psycopg.connect(database_url)


def insert_into_database(df):
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

    clean_df = df.astype(object).where(pd.notna(df), None)

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

    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.executemany(insert_sql, rows)

    print(f"Inserted {len(rows)} rows into Supabase.")


def run_ingestion():
    df = fetch_recsports_data()

    print(f"Fetched {len(df)} rows from RecSports.")

    # Optional local CSV backup
    CSV_PATH.parent.mkdir(parents=True, exist_ok=True)

    data_file_exists = CSV_PATH.exists()

    df.to_csv(
        CSV_PATH,
        mode="a",
        header=not data_file_exists,
        index=False,
    )

    insert_into_database(df)


if __name__ == "__main__":
    run_ingestion()