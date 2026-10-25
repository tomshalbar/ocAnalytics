import unittest
from datetime import datetime, timedelta, timezone
from unittest.mock import patch

import psycopg
from fastapi import HTTPException
from backend.api import routes
from backend.api.schemas import Observation
from backend.main import app


class ApiTests(unittest.TestCase):
    def setUp(self):
        self.start = datetime(2026, 9, 1, tzinfo=timezone.utc)
        self.end = self.start + timedelta(days=1)

    def test_time_range_requires_offset(self):
        with self.assertRaises(HTTPException) as error:
            routes.time_range(self.start.replace(tzinfo=None), self.end)
        self.assertEqual(error.exception.status_code, 400)

    def test_range_limits(self):
        for end in (self.start, self.start - timedelta(days=1),
                    self.start + timedelta(days=32)):
            with self.assertRaises(HTTPException):
                routes.time_range(self.start, end)

    def test_equivalent_offsets(self):
        zone = timezone(timedelta(hours=-4))
        self.assertEqual(routes.time_range(self.start, self.end),
                         routes.time_range(self.start.astimezone(zone), self.end.astimezone(zone)))

    @patch.object(routes, 'query', return_value=None)
    def test_missing_location(self, query):
        with self.assertRaises(HTTPException) as error:
            routes.get_latest_location(42)
        self.assertEqual(error.exception.status_code, 404)

    @patch.object(routes, 'query', return_value=[])
    def test_history_pagination_and_half_open_range(self, query):
        self.assertEqual(routes.get_location_history(42, self.start, self.end, 20, 40), [])
        sql, params = query.call_args.args
        self.assertIn('"runDatetime" < %s', sql)
        self.assertIn('id ASC', sql)
        self.assertEqual(params[-2:], (20, 40))
        self.assertEqual(params[0], 42)

    @patch.object(routes, 'query', return_value={'total_readings': 0})
    def test_no_valid_statistics(self, query):
        with self.assertRaises(HTTPException) as error:
            routes.get_location_stats(42, self.start, self.end)
        self.assertEqual(error.exception.status_code, 404)
        self.assertIn('"LastCount" IS NOT NULL', query.call_args.args[0])

    @patch.object(routes, 'get_db_connection', side_effect=psycopg.OperationalError('private connection details'))
    def test_database_failure_is_sanitized(self, connection):
        with self.assertLogs(routes.logger, level='ERROR'):
            with self.assertRaises(HTTPException) as error:
                routes.query('SELECT 1')
        self.assertEqual(error.exception.status_code, 503)
        self.assertNotIn('private', error.exception.detail)

    def test_source_and_collection_freshness_are_separate(self):
        row = dict(id=1, LocationId=42, FacilityId=2, CountOfParticipants=0,
                   PercetageCapacity=0, LastCount=12, IsClosed=False,
                   runDatetime=datetime.now(timezone.utc),
                   LastUpdatedDateAndTime=self.start)
        result = Observation(**routes.observation(row))
        self.assertTrue(result.is_stale)
        self.assertFalse(result.collection_is_stale)
        row['LastUpdatedDateAndTime'] = None
        self.assertTrue(routes.observation(row)['is_stale'])

    def test_openapi_response_and_pagination_contract(self):
        paths = app.openapi()['paths']
        operation = paths['/locations/{location_id}/history']['get']
        params = {p['name']: p for p in operation['parameters']}
        self.assertEqual(params['limit']['schema']['maximum'], 1000)
        self.assertEqual(params['offset']['schema']['minimum'], 0)
        self.assertEqual(operation['responses']['200']['content']['application/json']['schema']['type'], 'array')


if __name__ == '__main__':
    unittest.main()
