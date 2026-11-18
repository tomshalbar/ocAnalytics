-- Apply once in the Supabase SQL editor using the database owner.
-- Separate from raw observations; one atomic snapshot per source LocationId.
CREATE TABLE IF NOT EXISTS public.forecast_snapshots (
    location_id integer PRIMARY KEY,
    generated_at timestamptz NOT NULL,
    data_through timestamptz NOT NULL,
    expires_at timestamptz NOT NULL,
    payload jsonb NOT NULL CHECK (jsonb_typeof(payload) = 'object'),
    CHECK (expires_at > generated_at)
);
ALTER TABLE public.forecast_snapshots ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.forecast_snapshots FROM PUBLIC, anon, authenticated;
-- No browser/mobile write policies. Use backend-only Postgres credentials.
