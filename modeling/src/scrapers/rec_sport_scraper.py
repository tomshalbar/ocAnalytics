import requests
import pandas as pd
from datetime import datetime
import time


MAX_ATTEMPTS = 3
RETRY_DELAY_SECONDS = 10

JSON_URL = (
    "https://goboardapi.azurewebsites.net/api/"
    "FacilityCount/GetCountsByAccount?"
    "AccountAPIKey=8E2C21D2-6F5D-45C1-AF9E-C23AEBFDA68B"
    "&ShowSubLocationCount=true"
)


def fetch_recsports_data():
    response = None

    for attempt in range(1, MAX_ATTEMPTS + 1):
        try:
            response = requests.get(JSON_URL, timeout=15)

            if response.status_code == 200:
                break

            print(
                f"Attempt {attempt} failed with "
                f"status code {response.status_code}"
            )

        except requests.exceptions.RequestException as e:
            print(f"Attempt {attempt} failed: {e}")

        if attempt < MAX_ATTEMPTS:
            time.sleep(RETRY_DELAY_SECONDS)

    if response is None or response.status_code != 200:
        raise RuntimeError("Failed to retrieve RecSports data")

    features = [
        "LocationId",
        "CountOfParticipants",
        "PercetageCapacity",
        "LastUpdatedDateAndTime",
        "LastCount",
        "FacilityId",
        "IsClosed",
    ]

    data = response.json()

    df = pd.DataFrame(data)[features]
    df["runDatetime"] = datetime.now()

    return df