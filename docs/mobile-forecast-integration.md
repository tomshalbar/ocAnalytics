# Mobile forecast API integration

The mobile app calls Render, never TimesFM or Supabase directly:
`GET /locations/{sourceLocationId}/forecast?hours=24`.

- `mobile/src/data/api/forecasts.ts`: typed request and response validation, using
  the same API base URL and request helper as historical data.
- `mobile/src/data/api/use-location-forecast.ts`: shared request cache, loading,
  retry and configured timeout via the existing resource hook.
- The existing Trends > Insights section now lets users select a source location
  and view hourly predicted people, bounds, model/fallback label and timestamps.
  Home, tabs and historical summary behavior are preserved. The date-range choice
  controls history only; the prediction horizon remains the next 24 hours.

## Try on a phone

1. Keep the local publisher uploading recent predictions. For the first location:
   `python -m scripts.publish_forecasts --location-id 3367` from the repository root.
2. Configure `mobile/.env.local` using `.env.example` (Render URL and 90000 ms timeout).
3. In `mobile`, run `npm install`, then `npx expo start --clear --lan`.
4. Open Expo Go on the same network, scan the QR code, and open Trends.
5. Choose the facility containing SWRC Weight Room, scroll to Insights and choose
   SWRC Weight Room (source LocationId 3367). Tap Refresh or pull to refresh.
6. Confirm future-hour predicted people and local dates/times match the Render
   forecast endpoint. Counts are estimates of people, not available courts.
7. Select a location without uploaded predictions: expect an unavailable message
   and Retry, not zero counts. Returning to 3367 should show its own results.

No new Expo packages, API environment variables or navigation routes are needed.
Forecast 404/503 responses stay explicit errors. Cached values are hidden after a
failed refresh, and past hourly entries are excluded from display. Mobile device
rendering and interactions still need phone verification.

## Checks

From `mobile`:

```bash
npm run typecheck
npm run lint
node --experimental-transform-types --test tests/*.test.mjs
```

Tests cover URLs, cancellation forwarding, malformed/mismatched data, unavailable
predictions, true zero counts, fallback metadata, history and cache behavior.
Existing stale-status tests were updated to match the current Last updated copy;
relative imports in pure helpers allow the documented Node tests to run.
