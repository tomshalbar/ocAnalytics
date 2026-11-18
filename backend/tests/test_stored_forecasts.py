"""Local producer -> stored snapshot -> cloud API; no model download or live DB writes."""
from datetime import datetime, timedelta, timezone
import os
import unittest
from unittest.mock import MagicMock, patch

from fastapi.testclient import TestClient
import psycopg

from backend.main import app
from backend.services.forecasting import repository, services
from scripts.publish_forecasts import normalize_timestamps, publish_locations

NOW = datetime(2026, 11, 15, 15, 30, tzinfo=timezone.utc)


def snapshot():
    start = NOW.replace(minute=0)
    return dict(location_id=3367, model="timesfm", used_fallback=False,
                generated_at=NOW.isoformat(), data_through=start.isoformat(),
                forecast=[dict(timestamp=(start + timedelta(hours=i)).isoformat(),
                               median=10, lower=8, upper=12) for i in range(1, 49)])


def connection(payload):
    conn = MagicMock()
    conn.__enter__.return_value = conn
    cur = conn.cursor.return_value.__enter__.return_value
    cur.fetchone.return_value = payload
    return conn, cur


class SnapshotTests(unittest.TestCase):
    def test_future_window_and_contract(self):
        conn, cur = connection({"payload": snapshot()})
        with patch.object(repository, "get_db_connection", return_value=conn):
            result = repository.get_stored_forecast(3367, 24, now=NOW + timedelta(hours=2))
        self.assertEqual(len(result["forecast"]), 24)
        self.assertEqual(result["forecast"][0]["timestamp"], "2026-11-15T18:00:00Z")
        self.assertEqual(result["model"], "timesfm")
        self.assertIn("expires_at >", cur.execute.call_args.args[0])

    def test_missing_expired_or_insufficient_future_results(self):
        for row, now in [(None, NOW), ({"payload": snapshot()}, NOW + timedelta(hours=47))]:
            conn, _ = connection(row)
            with patch.object(repository, "get_db_connection", return_value=conn):
                with self.assertRaises(repository.ForecastUnavailable):
                    repository.get_stored_forecast(3367, 24, now=now)

    def test_invalid_output_not_published(self):
        bad_cases = []
        result = snapshot()
        result["forecast"][0]["median"] = float("nan")
        bad_cases.append(result)
        result = snapshot()
        result["forecast"][0]["lower"] = 20
        bad_cases.append(result)
        result = snapshot()
        result["forecast"][1]["timestamp"] = result["forecast"][0]["timestamp"]
        bad_cases.append(result)
        result = snapshot()
        result["data_through"] = "2026-11-15T15:00:00"
        bad_cases.append(result)
        with patch.object(repository, "get_db_connection") as connect:
            for result in bad_cases:
                with self.assertRaises(ValueError):
                    repository.save_forecast(result)
        connect.assert_not_called()

    def test_atomic_upsert_keeps_newer_results(self):
        conn, cur = connection({"location_id": 3367})
        with patch.object(repository, "get_db_connection", return_value=conn):
            self.assertTrue(repository.save_forecast(snapshot()))
            cur.fetchone.return_value = None
            self.assertFalse(repository.save_forecast(snapshot()))
        sql, params = cur.execute.call_args.args
        self.assertIn("ON CONFLICT", sql)
        self.assertIn("forecast_snapshots.generated_at < EXCLUDED.generated_at", sql)
        self.assertIn("forecast_snapshots.data_through <= EXCLUDED.data_through", sql)
        self.assertEqual(params[3] - params[1], timedelta(hours=6))

    def test_timezone_and_dst_ambiguity(self):
        result = snapshot()
        result["data_through"] = "2026-11-15T10:00:00"
        self.assertEqual(normalize_timestamps(result, "America/New_York")["data_through"],
                         "2026-11-15T15:00:00+00:00")
        result["data_through"] = "2026-11-01T01:00:00"
        with self.assertRaises(Exception):
            normalize_timestamps(result, "America/New_York")

    @patch.dict(os.environ, {"FORECAST_ENABLED": "true", "FORECAST_BACKEND": "database"})
    def test_database_api_does_not_load_or_infer(self):
        with patch.object(services, "preload") as preload, \
             patch.object(services, "get_forecast") as infer, \
             patch.object(repository, "get_stored_forecast", return_value=snapshot()) as stored:
            with TestClient(app) as client:
                result = client.get("/locations/3367/forecast?hours=24")
                self.assertEqual(result.status_code, 200)
                self.assertEqual(result.json()["model"], "timesfm")
                self.assertEqual(client.get("/locations/3367/forecast?hours=0").status_code, 422)
                self.assertEqual(client.get("/").status_code, 200)
        stored.assert_called_once_with(3367, 24)
        preload.assert_not_called()
        infer.assert_not_called()

    @patch.dict(os.environ, {"FORECAST_ENABLED": "true", "FORECAST_BACKEND": "database"})
    def test_unavailable_database_and_missing_predictions(self):
        for error in (repository.ForecastUnavailable(), psycopg.OperationalError("private credentials"), ValueError("bad payload")):
            with patch.object(repository, "get_stored_forecast", side_effect=error):
                with TestClient(app) as client:
                    result = client.get("/locations/3367/forecast")
                    self.assertEqual(result.status_code, 503)
                    self.assertNotIn("private credentials", result.text)
                    self.assertEqual(client.get("/").status_code, 200)


class ProducerTests(unittest.TestCase):
    def fresh(self):
        result = snapshot()
        result["data_through"] = datetime.now(timezone.utc).replace(minute=0, second=0, microsecond=0).isoformat()
        start = datetime.fromisoformat(result["data_through"])
        result["generated_at"] = datetime.now(timezone.utc).isoformat()
        result["forecast"] = [dict(timestamp=(start + timedelta(hours=i)).isoformat(),
                                   median=10, lower=8, upper=12) for i in range(1, 49)]
        return result

    def test_dry_run_and_actual_upload(self):
        with patch.object(services, "get_forecast", return_value=self.fresh()), \
             patch.object(repository, "save_forecast", return_value=True) as save:
            self.assertEqual(publish_locations([3367], dry_run=True), 0)
            save.assert_not_called()
            self.assertEqual(publish_locations([3367]), 0)
            save.assert_called_once()

    def test_stale_history_or_fallback_never_overwrites(self):
        stale = self.fresh()
        stale["data_through"] = (datetime.fromisoformat(stale["data_through"]) - timedelta(days=3)).isoformat()
        for point in stale["forecast"]:
            point["timestamp"] = (datetime.fromisoformat(point["timestamp"]) - timedelta(days=3)).isoformat()
        fallback = self.fresh()
        fallback["used_fallback"] = True
        for result in (stale, fallback):
            with patch.object(services, "get_forecast", return_value=result), \
                 patch.object(repository, "save_forecast") as save, self.assertLogs(level="ERROR"):
                self.assertEqual(publish_locations([3367]), 1)
                save.assert_not_called()

    def test_explicit_fallback_permission(self):
        result = self.fresh()
        result.update(model="naive", used_fallback=True)
        with patch.object(services, "get_forecast", return_value=result), \
             patch.object(repository, "save_forecast", return_value=True) as save:
            self.assertEqual(publish_locations([3367], allow_fallback=True), 0)
        self.assertTrue(save.call_args.args[0]["used_fallback"])

    def test_failure_in_one_location_does_not_stop_others(self):
        result = self.fresh()
        result["location_id"] = 3368
        with patch.object(services, "get_forecast", side_effect=[RuntimeError("offline"), result]), \
             patch.object(repository, "save_forecast", return_value=True) as save, self.assertLogs(level="ERROR"):
            self.assertEqual(publish_locations([3367, 3368]), 1)
        save.assert_called_once()
        self.assertEqual(save.call_args.args[0]["location_id"], 3368)
