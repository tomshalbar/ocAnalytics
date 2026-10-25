# ocAnalytics
 

## Repo structure
 
```
ocAnalytics/
├── mobile/       # React Native (Expo) app
├── modeling/     # Python logic model — source of truth, prototyping & validation
├── backend/      # REST API + database (FastAPI, when needed)
└── docs/         # Logic model spec and other documentation
```
 
## Prerequisites
 
Install these before setting up the project:
 
- [Node.js](https://nodejs.org/) (LTS version)
- [Git](https://git-scm.com/)
- [Python 3.12](https://www.python.org/downloads/)
- [Conda](https://docs.conda.io/projects/conda/en/latest/user-guide/install/index.html)
- [Expo Go](https://expo.dev/go) app on your phone (for testing on-device) *or* Android Studio / Xcode if you want simulators
## Getting started
 
### 1. Clone the repo
 
```bash
git clone https://github.com/tomshalbar/ocAnalytics.git
cd ocAnalytics
```
 
### 2. Set up the Python Environment
 
Create the Conda environment from `environment.yml`:

```bash
conda env create -f environment.yml
conda activate osa_env
```
 
### 3. Configure Environment Variables

Create a `.env` file in the project root:

```bash
DATABASE_URL=your_supabase_postgres_connection_string
```

Do not commit the `.env` file to GitHub.
The production workflow uses GitHub Secrets for sensitive environment variables.

### 4. Run the Backend Locally

From the project root:

```bash
uvicorn backend.main:app --reload
```

The API will be available at:
```bash
http://127.0.0.1:8000
```

FastAPI documentation:

```bash
http://127.0.0.1:8000/docs
```

### 5. Test the RecSports Data Pipeline

From the project root:
```bash
python -m modeling.src.scrape_pipeline
```

A successful run should scrape the latest RecSports occupancy data and insert it into the Supabase PostgreSQL database.

### 6. Run the Mobile Application

```bash
cd mobile
npm install
npx expo start
```
## Occupancy API contract

Existing raw field names are retained, with explicit response schemas in `/docs`.
No facility names, capacities, or court availability are inferred.

- `GET /locations/latest`: latest reading per source location (empty list if none).
- `GET /locations/{location_id}/latest`: latest reading, or 404.
- `GET /locations/{location_id}/history?start=2026-09-01T00:00:00Z&end=2026-09-02T00:00:00Z&limit=100&offset=0`
  returns a list ordered by collection time and ID. Default limit 100, maximum
  1000; offset 0–100000. An empty page returns `[]`.
- `GET /locations/{location_id}/stats?start=2026-09-01T00:00:00Z&end=2026-09-02T00:00:00Z`
  retains the existing `LastCount` statistics, excluding closed readings and null
  counts. This is a summary of collected snapshots, not unique source updates or
  a time-weighted average. No valid readings returns 404. Confirm upstream count
  semantics before interpreting this as current occupancy.

History and stats require timezone offsets, a start before end, and a maximum
31-day range. Both use the half-open interval `[start, end)` to avoid double
counting adjacent windows. Invalid ranges return 400; malformed parameters or
invalid pagination return 422. Database failures return a generic 503.

### Legacy timestamps and freshness

The current scraper writes offset-free `runDatetime` values. Set
`RAW_DATA_TIMEZONE` to the timezone of the host that wrote those timestamps
(default UTC, matching the scheduled GitHub runner). Mixed historical host
zones require a data migration; this setting cannot repair mixed-zone records.
`SOURCE_DATA_TIMEZONE` controls interpretation of offset-free upstream timestamps
(default `America/New_York`); verify against the upstream source. A timestamp
already carrying an offset keeps it. Responses include offsets explicitly.

`is_stale` is true when the source update is missing or older than 30 minutes.
`collection_is_stale` separately reports whether collection is older than 30
minutes. This is a fixed initial policy, not a guarantee of upstream freshness.
The API works with raw data while metadata is incomplete; it does not modify or
synchronize the normalized tables.

### Backend checks

From the repository root, with the Python environment activated:

```bash
python -m unittest discover -s backend/tests -v
```

Tests use database mocks and do not read or write the live database.

## Deploy the backend

See [backend deployment instructions](docs/backend-deployment.md) for the Render
configuration, Supabase environment variables, and phone verification steps.
The deployment smoke check is read-only:

```bash
python scripts/check_deployment.py https://YOUR-ASSIGNED-URL.onrender.com
```
