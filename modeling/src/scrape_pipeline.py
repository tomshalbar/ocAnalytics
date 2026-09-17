import sys
from modeling.src.scrapers.rec_sport_scraper import scrape_data
from backend.services.scraper_data_service import insert_into_database

MAX_ATTEMPTS = 3
RETRY_DELAY_SECONDS = 10
JSON_URL = "https://goboardapi.azurewebsites.net/api/FacilityCount/GetCountsByAccount?AccountAPIKey=8E2C21D2-6F5D-45C1-AF9E-C23AEBFDA68B&ShowSubLocationCount=true"

if __name__ == "__main__":
    data_df = scrape_data(MAX_ATTEMPTS, RETRY_DELAY_SECONDS, JSON_URL)

    if data_df is None or data_df.empty:
        print("Scrape returned no data")
        sys.exit(1)

    success = insert_into_database(data_df)
    if not success:
        print("Database insert failed")
        sys.exit(1)
