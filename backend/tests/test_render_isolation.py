"""Render deployment isolation: model problems must not block existing routes."""
import os
import unittest
from datetime import datetime, timezone
from unittest.mock import patch

from fastapi.testclient import TestClient
from backend.main import app
from backend.services.forecasting import services


class RenderIsolationTests(unittest.TestCase):
    @patch.dict(os.environ, {"FORECAST_ENABLED": "false"})
    @patch.object(services, "preload")
    @patch.object(services, "get_forecast")
    def test_disabled_model_never_loads_or_runs(self, forecast, preload):
        with TestClient(app) as client:
            self.assertEqual(client.get("/").status_code, 200)
            self.assertEqual(client.get("/openapi.json").status_code, 200)
            result = client.get("/locations/3367/forecast")
            self.assertEqual(result.status_code, 503)
            self.assertEqual(result.json()["detail"], "Forecasting is disabled on this deployment")
        preload.assert_not_called()
        forecast.assert_not_called()

    def assert_existing_routes(self, client):
        now = datetime(2026, 11, 4, 12, tzinfo=timezone.utc)
        row = dict(id=1, LocationId=3367, FacilityId=596, CountOfParticipants=0,
                   PercetageCapacity=0, LastCount=12, IsClosed=False,
                   LastUpdatedDateAndTime=now, runDatetime=now)
        with patch("backend.api.routes.query", return_value=[row]):
            result = client.get("/locations/latest")
            self.assertEqual(result.status_code, 200)
            self.assertEqual(result.json()[0]["LastCount"], 12)
        with patch("backend.api.routes.query", return_value=row):
            result = client.get("/locations/3367/latest")
            self.assertEqual(result.status_code, 200)
            self.assertEqual(result.json()["LocationId"], 3367)
        params = {"start": "2026-11-03T00:00:00Z", "end": "2026-11-04T00:00:00Z"}
        with patch("backend.api.routes.query", return_value=[row]):
            result = client.get("/locations/3367/history", params=params)
            self.assertEqual(result.status_code, 200)
            self.assertEqual(len(result.json()), 1)
        stats = dict(total_readings=1, average_count=12, minimum_count=12, maximum_count=12)
        with patch("backend.api.routes.query", return_value=stats):
            result = client.get("/locations/3367/stats", params=params)
            self.assertEqual(result.status_code, 200)
            self.assertEqual(result.json()["statistics"]["average_count"], 12)

    @patch.dict(os.environ, {"FORECAST_ENABLED": "false"})
    def test_all_existing_endpoints_work_with_forecast_disabled(self):
        with TestClient(app) as client:
            self.assert_existing_routes(client)

    @patch.dict(os.environ, {"FORECAST_ENABLED": "true"})
    @patch.object(services, "preload", side_effect=RuntimeError("weights unavailable"))
    def test_preload_exception_does_not_break_existing_endpoints(self, preload):
        with self.assertLogs("backend.main", level="ERROR"):
            with TestClient(app) as client:
                self.assertEqual(client.get("/").status_code, 200)
                self.assert_existing_routes(client)
        preload.assert_called_once()

    @patch.dict(os.environ, {"FORECAST_ENABLED": "true"})
    @patch.object(services, "preload")
    @patch.object(services, "get_forecast", side_effect=LookupError("no readings"))
    def test_enabled_forecast_retains_original_behavior(self, forecast, preload):
        with TestClient(app) as client:
            self.assertEqual(client.get("/locations/3367/forecast").status_code, 404)
            self.assertEqual(client.get("/locations/3367/forecast?hours=0").status_code, 422)
        preload.assert_called_once()
        forecast.assert_called_once_with(3367, 24)
