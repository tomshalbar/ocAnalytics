"""Settings for the occupancy forecast service."""

import os


def forecast_enabled() -> bool:
    # Existing local behavior is preserved; Render Free explicitly disables it.
    return os.getenv("FORECAST_ENABLED", "true").lower() == "true"


# Hours before this one are treated as closed: filled with 0 in the data
# and forced to 0 in every forecast.
CLOSED_BEFORE_HOUR = 5

DEFAULT_HOURS = 24  # forecast length when the request doesn't say
MAX_HOURS = 168  # largest horizon the API will serve (7 days)
MAX_CONTEXT = 1024  # most history (in hours) fed to a model

CACHE_TTL_SECONDS = 600  # reuse a location's forecast for 10 minutes
CACHE_MAX_ITEMS = 200

# Front-end origins allowed to call the API (add your deployed site here).
# ALLOWED_ORIGINS = ["http://localhost:3000", "http://localhost:5173"]

# Which model each location uses. Replace these examples with the winner
# you found for each location in your comparison.
# Types: "timesfm", "chronos2", "timestral", "arima", "naive"
MODEL_BY_LOCATION = {
    6697: {"type": "timesfm"},
    9494: {"type": "timesfm"},
    3367: {"type": "timesfm"},
    3368: {"type": "timesfm"},
    5844: {"type": "timesfm"},
    3230: {"type": "timesfm"},
    3231: {"type": "timesfm"},
    3232: {"type": "timesfm"},
    3233: {"type": "timesfm"},
    3234: {"type": "timesfm"},
    3235: {"type": "timesfm"},
    3243: {"type": "timesfm"},
    3253: {"type": "timesfm"},
    3218: {"type": "timesfm"},
    3219: {"type": "timesfm"},
    3221: {"type": "timesfm"},
    4647: {"type": "timesfm"},
    3222: {"type": "timesfm"},
    3642: {"type": "timesfm"},
    3214: {"type": "timesfm"},
    3216: {"type": "timesfm"},
}
