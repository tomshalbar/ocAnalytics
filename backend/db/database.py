import os
from pathlib import Path

import psycopg
from psycopg.rows import dict_row
from dotenv import load_dotenv

PROJECT_ROOT = Path(__file__).resolve().parents[2]
load_dotenv(PROJECT_ROOT / ".env")

DATABASE_URL = os.getenv("DATABASE_URL")


def get_db_connection():
    if not DATABASE_URL:
        raise psycopg.OperationalError("DATABASE_URL is not configured")
    return psycopg.connect(DATABASE_URL, row_factory=dict_row,
                           prepare_threshold=None, connect_timeout=10)
