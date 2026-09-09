import requests
import pandas as pd
import json
from datetime import datetime
import os
import time

CSV_PATH = r"C:\Users\tomsh\projects\school_projects\CIS4913\ocAnalytics\modeling\data\raw_recsports_data.csv"
MAX_ATTEMPTS = 3
RETRY_DELAY_SECONDS = 10
JSON_URL = "https://goboardapi.azurewebsites.net/api/FacilityCount/GetCountsByAccount?AccountAPIKey=8E2C21D2-6F5D-45C1-AF9E-C23AEBFDA68B&ShowSubLocationCount=true"

response = None
for attempt in range(1, MAX_ATTEMPTS + 1):
    try:
        response = requests.get(JSON_URL, timeout=15)
        if response.status_code == 200:
            break  # success, stop retrying
        else:
            print(f"Attempt {attempt} failed with status code {response.status_code}")
    except requests.exceptions.RequestException as e:
        print(f"Attempt {attempt} failed with exception: {e}")

    if attempt < MAX_ATTEMPTS:
        time.sleep(RETRY_DELAY_SECONDS)


if response.status_code == 200:
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
    data_file_exists = os.path.isfile(CSV_PATH)
    df.to_csv(CSV_PATH, mode="a", header=not data_file_exists, index=False)
else:
    print(f"Failed to retrieve data. Status code: {response.status_code}")
