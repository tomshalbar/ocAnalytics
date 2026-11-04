# PR #21: Render-only deployment protection

This patch does not change forecast math, timestamps, history processing, cache,
model runners, output schemas or mobile code. It addresses only deployment.

- Install numpy, pandas and cachetools as API runtime dependencies. PR #21 imports
  them even for requests to the original endpoints.
- Render sets `FORECAST_ENABLED=false`: no model preload, no neural inference or
  baseline substitution. `/locations/{id}/forecast` returns explicit HTTP 503.
- Root, latest, history and stats routes retain their implementation and schemas.
- Elsewhere, `FORECAST_ENABLED` defaults to true, preserving the PR's behavior.
  A Python preload exception is logged without preventing API startup.
- `backend/requirements-model.txt` supplies TimesFM/PyTorch dependencies for a
  suitable inference host. Install it and set `FORECAST_ENABLED=true` only after
  verifying the host can run the model. Do not enable it on Render Free and assume
  an exception handler can protect against an OS out-of-memory kill.

This is an availability fix, not a claim that the forecast endpoint is fully
ready. Previously identified forecast time/freshness issues remain for the author
to fix separately. No existing model runner is altered.

For a Blueprint service, sync the new Render configuration. For a manually
configured service, set FORECAST_ENABLED=false in Render before deploying PR #21.
Keep the build command `pip install -r backend/requirements.txt`.

Tests:

```bash
python -m pip install -r backend/requirements-test.txt
python -m unittest discover -s backend/tests -v
```

The added HTTP tests cover all four existing data endpoints when forecasting is
disabled and after a simulated preload failure. Database calls and model loading
are mocked; no live database data is changed. Real model inference is not tested.
