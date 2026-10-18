import unittest
from unittest.mock import patch

import pandas as pd
import psycopg

from backend.services.scraper_data_service import insert_into_database


class ScraperConnectionTests(unittest.TestCase):
    def setUp(self):
        self.frame = pd.DataFrame([{
            "LocationId": 1, "CountOfParticipants": 0,
            "PercetageCapacity": 0, "LastUpdatedDateAndTime": None,
            "LastCount": 5, "FacilityId": 2, "IsClosed": False,
            "runDatetime": pd.Timestamp("2026-10-18"),
        }])

    @patch("backend.services.scraper_data_service.get_db_connection")
    def test_connection_failure_returns_false_without_cleanup_error(self, connect):
        connect.side_effect = psycopg.OperationalError("test connection failure")
        with patch("builtins.print"):
            self.assertFalse(insert_into_database(self.frame))

    @patch("backend.services.scraper_data_service.get_db_connection")
    def test_insert_failure_exits_connection_context(self, connect):
        context = connect.return_value
        connection = context.__enter__.return_value
        cursor = connection.cursor.return_value.__enter__.return_value
        cursor.executemany.side_effect = psycopg.OperationalError("test insert failure")
        with patch("builtins.print"):
            self.assertFalse(insert_into_database(self.frame))
        context.__exit__.assert_called_once()
        self.assertIs(context.__exit__.call_args.args[0], psycopg.OperationalError)
