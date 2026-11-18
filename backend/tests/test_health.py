
import unittest
from datetime import datetime, timedelta, timezone
from unittest.mock import MagicMock, patch

from fastapi.testclient import TestClient
from backend.main import app


class HealthEndpointTests(unittest.TestCase):

    def setUp(self):
        self.client = TestClient(app)

    @patch("backend.api.health.get_db_connection")
    def test_healthy_pipeline(self, mock_db):
        now = datetime.now(timezone.utc)

        cursor = MagicMock()
        cursor.fetchall.return_value = [
            {
                "LocationId": 3214,
                "runDatetime": now - timedelta(minutes=5),
            },
            {
                "LocationId": 3230,
                "runDatetime": now - timedelta(minutes=10),
            },
        ]

        mock_db.return_value.__enter__.return_value \
            .cursor.return_value.__enter__.return_value = cursor

        response = self.client.get("/health/data")

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "healthy")
        self.assertEqual(data["total_locations"], 2)
        self.assertEqual(data["fresh_locations"], 2)
        self.assertEqual(data["stale_locations"], 0)

    @patch("backend.api.health.get_db_connection")
    def test_degraded_pipeline(self, mock_db):
        now = datetime.now(timezone.utc)

        cursor = MagicMock()
        cursor.fetchall.return_value = [
            {
                "LocationId": 3214,
                "runDatetime": now - timedelta(minutes=5),
            },
            {
                "LocationId": 3230,
                "runDatetime": now - timedelta(hours=2),
            },
        ]

        mock_db.return_value.__enter__.return_value \
            .cursor.return_value.__enter__.return_value = cursor

        response = self.client.get("/health/data")

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "degraded")
        self.assertEqual(data["fresh_locations"], 1)
        self.assertEqual(data["stale_locations"], 1)

    @patch("backend.api.health.get_db_connection")
    def test_empty_pipeline(self, mock_db):
        cursor = MagicMock()
        cursor.fetchall.return_value = []

        mock_db.return_value.__enter__.return_value \
            .cursor.return_value.__enter__.return_value = cursor

        response = self.client.get("/health/data")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], "no_data")
        self.assertEqual(response.json()["total_locations"], 0)


if __name__ == "__main__":
    unittest.main()
