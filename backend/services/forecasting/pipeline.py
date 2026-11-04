import numpy as np
import pandas as pd
from backend.db.database import get_db_connection
from backend.services.forecasting.config import CLOSED_BEFORE_HOUR


def query_to_df(cur, query):
    rows = cur.execute(query).fetchall()
    return pd.DataFrame(rows)


from contextlib import closing

import pandas as pd

HISTORY_DAYS = 45  # covers MAX_CONTEXT (1024 h ≈ 43 days)


def load_readings(location_id: int, days: int = HISTORY_DAYS) -> pd.DataFrame:
    """Recent raw readings for one location: LastUpdatedDateAndTime, LastCount."""
    sql = """
        SELECT DISTINCT "LastUpdatedDateAndTime", "LastCount"
        FROM raw_recsports_data
        WHERE "LocationId" = %s
          AND "LastUpdatedDateAndTime" >= NOW() - make_interval(days => %s)
        ORDER BY "LastUpdatedDateAndTime"
    """
    with closing(get_db_connection()) as conn, closing(conn.cursor()) as cur:
        cur.execute(sql, (location_id, days))
        columns = [col[0] for col in cur.description]
        df = pd.DataFrame(cur.fetchall(), columns=columns)

    if df.empty:
        raise LookupError(f"no readings for location {location_id}")

    ts = pd.to_datetime(df["LastUpdatedDateAndTime"])
    if ts.dt.tz is not None:  # closed-hours rule uses the local hour
        ts = ts.dt.tz_convert("America/New_York").dt.tz_localize(None)
    df["LastUpdatedDateAndTime"] = ts
    return df


def build_series(readings: pd.DataFrame) -> pd.Series:
    """Raw readings -> one value per hour on a complete hourly grid.

    - several readings in the same hour: keep the last one
    - hours with no reading: NaN, except closed hours which become 0
    """
    if readings is None or readings.empty:
        raise ValueError("no readings for this location")

    hour_ts = readings["LastUpdatedDateAndTime"].dt.floor("h")
    hourly = readings.assign(ts=hour_ts).groupby("ts")["LastCount"].last()

    full = pd.date_range(hourly.index.min(), hourly.index.max(), freq="h")
    y = hourly.reindex(full).astype(float)
    y.index.name = "timestamp"

    closed_gap = (y.index.hour < CLOSED_BEFORE_HOUR) & y.isna()
    y[closed_gap] = 0.0
    return y


def future_index(y: pd.Series, horizon: int) -> pd.DatetimeIndex:
    """The `horizon` hourly timestamps right after the last data point."""
    return pd.date_range(y.index[-1] + pd.Timedelta(hours=1), periods=horizon, freq="h")


def postprocess(index: pd.DatetimeIndex, median, lower, upper) -> pd.DataFrame:
    """Clip at 0, force closed hours to 0, keep lower <= median <= upper."""
    median = np.clip(np.asarray(median, dtype=float).reshape(-1), 0, None)
    lower = np.clip(np.asarray(lower, dtype=float).reshape(-1), 0, None)
    upper = np.clip(np.asarray(upper, dtype=float).reshape(-1), 0, None)

    lower = np.minimum(lower, median)
    upper = np.maximum(upper, median)

    out = pd.DataFrame({"median": median, "lower": lower, "upper": upper}, index=index)
    out.loc[out.index.hour < CLOSED_BEFORE_HOUR, :] = 0.0
    return out
