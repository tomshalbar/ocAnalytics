# Run the model locally, serve predictions from Render

Flow: local TimesFM -> Supabase `forecast_snapshots` -> Render forecast API -> mobile.
The phone keeps using the same backend URL and forecast response fields. No UI,
raw observations, or collection schedules are changed. There is no inbound
connection to the local computer and no tunnel is needed.

## 1. Apply the database migration once

Review and execute `backend/db/migrations/001_forecast_snapshots.sql` in the
Supabase SQL editor as the database owner. It creates a separate table, enables
RLS, and removes access for public/mobile roles. Existing tables are untouched.
Use backend-only Postgres credentials for the local writer and Render reader;
never put the connection string in mobile environment variables or GitHub.
The existing owner connection can access this table; a restricted DB role needs
an explicit SELECT grant (Render) or SELECT/INSERT/UPDATE grant (local writer).

## 2. Prepare the model computer

From the repository root, use a separate Python environment with enough memory:

```bash
python3 -m venv .venv-model
source .venv-model/bin/activate
python -m pip install -r backend/requirements-model.txt
```

Create a gitignored root `.env` (not `mobile/.env.local`):

```dotenv
DATABASE_URL=YOUR_PRIVATE_SUPABASE_POSTGRES_URL
SOURCE_DATA_TIMEZONE=America/New_York
```

Use the same Supabase database as Render. Confirm the source timezone with the
team. Existing naive model timestamps are interpreted in this timezone and
stored in UTC. Ambiguous/nonexistent daylight-saving timestamps fail validation
rather than being guessed. The source history must be recent (default 6 hours).
The first TimesFM run downloads model weights; this requires internet and
sufficient local memory. An upload dry run still reads real history and runs
inference, but never writes predictions.

```bash
python -m scripts.publish_forecasts --location-id 3367 --dry-run
python -m scripts.publish_forecasts --location-id 3367
# All locations configured in MODEL_BY_LOCATION:
python -m scripts.publish_forecasts
```

The default horizon is 168 hours. `--hours`, `--max-age-hours` (default 6), and
`--source-max-age-hours` (default 6) are configurable. If inference falls back to
naive, publishing fails by default. Use `--allow-fallback` only when you intend to
publish a clearly labeled baseline (`model=naive`, `used_fallback=true`).
One location failing does not stop the rest; the process exits nonzero if any
location fails. Each upload atomically replaces one complete snapshot. Failed
uploads retain the previous result, and older/concurrently delayed runs cannot
overwrite a newer snapshot or regress its source-data timestamp.

## 3. Switch the deployed API to database mode

Deploy this branch's reviewed code to Render first. Keep existing DATABASE_URL,
RAW_DATA_TIMEZONE, and SOURCE_DATA_TIMEZONE settings. In Render Environment set:

```dotenv
FORECAST_ENABLED=true
FORECAST_BACKEND=database
```

Save and redeploy. These two variables must both be set: changing only
FORECAST_ENABLED would otherwise use the original in-process model mode.
Render installs `backend/requirements.txt`, never the model requirements. It
skips model preload and inference in database mode. The Blueprint still defaults
to FORECAST_ENABLED=false until the migration and initial uploads are ready.

## 4. Verify

```bash
curl 'https://open-court-analytics-api.onrender.com/locations/3367/forecast?hours=24'
curl 'https://open-court-analytics-api.onrender.com/locations/latest'
```

Forecast success returns the existing location_id/model/used_fallback/
generated_at/data_through/forecast contract. Timestamps now include UTC offsets.
The API selects only future points, starting at the next whole hour. Expired,
missing, malformed, or insufficient predictions return 503; there is no automatic
cloud model fallback. Requesting all 168 hours may become unavailable as a stored
snapshot ages; default 24-hour requests have more headroom. Use generated_at and
data_through to explain freshness in the UI. Latest/history/stats/trends/summary
routes keep their current behavior.

## Refresh and limitations

Start with an hourly scheduled invocation of the same one-shot command on the
model computer, after measuring total runtime. Use your OS scheduler with an
absolute project directory and the `.venv-model` Python path. Do not overlap
runs. This change does not install a scheduler or keep the computer awake.
If the computer sleeps, disconnects, or stops running jobs, existing predictions
remain readable until they expire or have too few future points. Investigate
nonzero exits and refresh before the 6-hour expiry. For permanent operation,
move this producer to a machine that can remain available.

## Tests

```bash
python -m pip install -r backend/requirements-test.txt
python -m unittest discover -s backend/tests -v
```

These exercise producer validation, uploads and reads with mocked Postgres,
API behavior, failure handling and model isolation. They do not download TimesFM
weights or change a live Supabase database. Run the dry run and one-location
upload above to verify your own model, credentials and deployed environment.

Rollback: set FORECAST_ENABLED=false to disable forecasts alone. The default
FORECAST_BACKEND=model preserves existing local inference behavior when enabled.
