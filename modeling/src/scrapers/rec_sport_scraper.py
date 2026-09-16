import requests
import pandas as pd
import json
from datetime import datetime
import os
import time
import psycopg
from dotenv import load_dotenv
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[3]
ENV_PATH = PROJECT_ROOT / ".env"

load_dotenv(ENV_PATH)
print("ENV path:", ENV_PATH)
print("DATABASE_URL loaded:", os.getenv("DATABASE_URL") is not None)

def get_db_connection():
    database_url = os.getenv("DATABASE_URL")

    if not database_url:
        raise ValueError("DATABASE_URL not found in .env")

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

    # Convert pandas NaN/NaT to Python None
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



CSV_PATH = (
    Path(__file__).resolve().parents[2]
    / "data"
    / "raw_recsports_data.csv"
)
MAX_ATTEMPTS = 3
RETRY_DELAY_SECONDS = 10
JSON_URL = "https://goboardapi.azurewebsites.net/api/FacilityCount/GetCountsByAccount?AccountAPIKey=8E2C21D2-6F5D-45C1-AF9E-C23AEBFDA68B&ShowSubLocationCount=true"

response = None
for attempt in range(1, MAX_ATTEMPTS + 1):
    try:
        response = requests.get(JSON_URL, timeout=15)
        if response is not None and response.status_code == 200:
            break  # success, stop retrying
        else:
            if response is None:
                print("Failed to retrieve data after all attempts.")
            else:
                print(f"Failed to retrieve data. Status code: {response.status_code}")
    except requests.exceptions.RequestException as e:
        print(f"Attempt {attempt} failed with exception: {e}")

    if attempt < MAX_ATTEMPTS:
        time.sleep(RETRY_DELAY_SECONDS)


if response is not None and response.status_code == 200:
    now_dt = datetime.now()

    data = json.loads(response.text)
    features = [
        "LocationId",
        "CountOfParticipants",
        "PercetageCapacity",
        "LastUpdatedDateAndTime",
        "LastCount",
        "FacilityId",
        "IsClosed",
    ]

    df = pd.DataFrame(data)[features]
    df["runDatetime"] = now_dt
    data_file_exists = CSV_PATH.exists()

    df.to_csv(
        CSV_PATH,
        mode="a",
        header=not data_file_exists,
        index=False
    )
    insert_into_database(df)
else:
    if response is None:
        print("Failed to retrieve data after all attempts.")
    else:
        print(f"Failed to retrieve data. Status code: {response.status_code}")
