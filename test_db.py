import os
import psycopg
from dotenv import load_dotenv

load_dotenv()

database_url = os.getenv("DATABASE_URL")

if not database_url:
    raise ValueError("DATABASE_URL not found in .env")

with psycopg.connect(database_url) as conn:
    with conn.cursor() as cur:
        cur.execute("SELECT COUNT(*) FROM raw_recsports_data;")
        count = cur.fetchone()[0]

print("Connected successfully!")
print(f"Rows in raw_recsports_data: {count}")
