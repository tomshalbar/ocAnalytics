# Deploy the FastAPI backend on Render

Only the API runs on Render. Supabase stays the database, and the mobile app
keeps its existing screens and design. This deployment does not run a scraper,
change collection scheduling, or create database tables.

## Before deployment

Review/merge the occupancy API and deployment changes into the branch you will
deploy. The current working branch may not contain teammates' hourly trends and
summary endpoints; deploy the agreed integrated branch to include those routes.

The root `render.yaml` defines a free Python service. It installs only the serving
dependencies from `backend/requirements.txt` and uses Render's assigned `$PORT`.
Automatic deployments are disabled; explicitly deploy reviewed changes.
`/` is a process health check. It does not verify Supabase; the smoke check below
also queries `/locations/latest` to verify database access.

## Create the service

1. Create a Render account at https://dashboard.render.com/ and sign in.
2. Push the reviewed deployment files to GitHub.
3. Choose New > Blueprint and connect `tomshalbar/ocAnalytics`. If you cannot
   select the team repository, ask its owner to grant Render access to this repo.
4. Choose the agreed deployment branch and the root `render.yaml` file.
5. Before applying, confirm that the service plan is Free and no database or
   other paid resources are being created.
6. Enter the prompted environment variables:

   | Variable | Value |
   | --- | --- |
   | `DATABASE_URL` | Supabase Postgres connection string, kept only in Render's secret environment settings |
   | `RAW_DATA_TIMEZONE` | Confirmed timezone of the existing offset-free collection timestamps; use `UTC` only if those timestamps were written in UTC |
   | `SOURCE_DATA_TIMEZONE` | Confirmed timezone of offset-free upstream source timestamps; current API default is `America/New_York` |

   In Supabase, use Connect to obtain the appropriate connection string. The
   session pooler supports IPv4 if the direct database endpoint is unreachable.
   Use SSL (`sslmode=require` in the connection string) and URL-encode special
   characters in the database password. Do not put this connection string in
   GitHub, the mobile app, screenshots, or a PR description.

7. Apply the Blueprint and wait for deployment to finish. Read the build/runtime
   logs if it fails. Render assigns an HTTPS `onrender.com` address; use the actual
   assigned URL, not an assumed service name.

The existing occupancy routes are unauthenticated read endpoints. Deploy only
if this public access matches the team's intended access to occupancy data.

## Verify and connect the phone

From the repository root:

```bash
python scripts/check_deployment.py https://YOUR-ASSIGNED-URL.onrender.com
```

The root and OpenAPI routes must succeed, and `/locations/latest` must query the
existing database successfully. This check never inserts or updates data. It
checks the existing latest API; separately validate any teammate-added routes.

Set `mobile/.env.local` locally:

```dotenv
EXPO_PUBLIC_API_URL=https://YOUR-ASSIGNED-URL.onrender.com
```

Restart Expo and open the development API test page on the phone. Fetch the list,
fetch one location and test 404. Stop the local Uvicorn server and repeat: requests
should still succeed because the phone is now using Render. Existing Home and
detail screens still use demo fixtures until the frontend owner wires them up.

## Free service behavior and maintenance

Render's free service sleeps after 15 minutes of inactivity. Its next request can
be slow enough to exceed the mobile client's current 15-second timeout. For a
class demo, open the API in a browser first, wait for a successful response, and
then Retry in the app. This free plan is useful for testing; it does not provide
an always-awake backend. A paid plan requires a separate team decision.

To update: merge reviewed code, then manually deploy the selected commit in
Render. If an update fails, redeploy the last known working commit. No database
migration is included in this setup.

References:
- https://render.com/docs/deploy-fastapi
- https://render.com/docs/blueprint-spec
- https://render.com/docs/free
- https://supabase.com/docs/guides/database/connecting-to-postgres
