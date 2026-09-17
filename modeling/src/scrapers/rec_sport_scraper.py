import requests
import pandas as pd
import json
from datetime import datetime
import time


def get_url_response(
    max_attempts: int, retry_delay_seconds: int, json_url: str
) -> requests.Response:
    """
    gets a response from the given url, retrying and delaying on failure.
    returns just a request.Response object.
    """
    response = None
    for attempt in range(1, max_attempts + 1):
        try:
            response = requests.get(json_url, timeout=15)
            if response is not None and response.status_code == 200:
                return response
            else:
                if response is None:
                    print(f"Failed to retrieve data after attempt {attempt}.")
                else:
                    print(
                        f"Failed to retrieve data. Status code: {response.status_code}"
                    )
        except requests.exceptions.RequestException as e:
            print(f"Attempt {attempt} failed with exception: {e}")

        if attempt < max_attempts:
            time.sleep(retry_delay_seconds)

    return None


def convert_response_to_df(response: requests.Response) -> pd.DataFrame:
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
        return df
    else:
        if response is None:
            print("Failed to retrieve data after all attempts.")
            return None
        else:
            print(f"Failed to retrieve data. Status code: {response.status_code}")
            return None


def scrape_data(
    max_attempts: int, retry_delay_seconds: int, json_url: str
) -> pd.DataFrame:
    """
    Scrapes data from the recsport json url. Should return the cleaned df if successful, or None if failed.
    """
    response = get_url_response(max_attempts, retry_delay_seconds, json_url)
    return convert_response_to_df(response)
