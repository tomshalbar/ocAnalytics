"""One runner per model type.

Every runner has the same shape:
    runner(y, horizon, cfg, models) -> {"median": arr, "lower": arr, "upper": arr}
where y is the clean hourly Series from pipeline.build_series().
Lower/upper are the 10th/90th percentiles (an 80% band).
"""

import threading

import numpy as np
import pandas as pd

from backend.services.forecasting.config import MAX_CONTEXT, MAX_HOURS
from backend.services.forecasting.pipeline import future_index

ARIMA_CONTEXT = 24 * 28  # ARIMA refits each time, so keep its history modest


# ---------------------------------------------------------------- loaders
def _load_timesfm():
    import timesfm

    model = timesfm.TimesFM_2p5_200M_torch.from_pretrained(
        "google/timesfm-2.5-200m-pytorch", torch_compile=False
    )
    model.compile(
        timesfm.ForecastConfig(
            max_context=MAX_CONTEXT,
            max_horizon=MAX_HOURS,  # must be >= any horizon the API serves
            normalize_inputs=True,
            use_continuous_quantile_head=True,
            force_flip_invariance=True,
            infer_is_positive=True,
            fix_quantile_crossing=True,
        )
    )
    return model


def _load_chronos2():
    from chronos import Chronos2Pipeline

    return Chronos2Pipeline.from_pretrained("amazon/chronos-2", device_map="cpu")


def _load_timestral():
    import torch
    from timestral import TimestralForecaster

    return TimestralForecaster.from_pretrained(
        "mistralai/Timestral-209M",
        device="cuda" if torch.cuda.is_available() else "cpu",
    )


_LOADERS = {
    "timesfm": _load_timesfm,
    "chronos2": _load_chronos2,
    "timestral": _load_timestral,
}


class ModelStore:
    """Loads each pretrained model once and keeps it in memory."""

    def __init__(self):
        self._models = {}
        self._load_lock = threading.Lock()

    def get(self, name):
        if name not in self._models:
            with self._load_lock:
                if name not in self._models:
                    self._models[name] = _LOADERS[name]()
        return self._models[name]

    def preload(self, names):
        for name in names:
            if name in _LOADERS:
                self.get(name)


# ---------------------------------------------------------------- runners
def run_timesfm(y, horizon, cfg, models):
    model = models.get("timesfm")
    context = y.to_numpy(dtype=float)[-MAX_CONTEXT:]
    point, quant = model.forecast(horizon=horizon, inputs=[context])
    # quant[..., 0] is the mean, then the 10th..90th percentiles
    return {"median": point[0], "lower": quant[0, :, 1], "upper": quant[0, :, 9]}


def run_chronos2(y, horizon, cfg, models):
    pipe = models.get("chronos2")
    y = y.iloc[-MAX_CONTEXT:]
    fut_idx = future_index(y, horizon)

    context_df = pd.DataFrame(
        {
            "id": "series",
            "timestamp": y.index,
            "target": y.to_numpy(dtype=float),
            "hour": y.index.hour.to_numpy(),
            "dayofweek": y.index.dayofweek.to_numpy(),
        }
    )
    future_df = pd.DataFrame(
        {
            "id": "series",
            "timestamp": fut_idx,
            "hour": fut_idx.hour.to_numpy(),
            "dayofweek": fut_idx.dayofweek.to_numpy(),
        }
    )
    out = pipe.predict_df(
        context_df,
        future_df=future_df,
        prediction_length=horizon,
        quantile_levels=[0.1, 0.5, 0.9],
        id_column="id",
        timestamp_column="timestamp",
        target="target",
        freq="h",
    )
    # If these column names differ in your version, print(out.columns).
    return {
        "median": out["0.5"].to_numpy(),
        "lower": out["0.1"].to_numpy(),
        "upper": out["0.9"].to_numpy(),
    }


def run_timestral(y, horizon, cfg, models):
    model = models.get("timestral")
    context = y.to_numpy(dtype=float)[-MAX_CONTEXT:]
    f = model.forecast(context, prediction_length=horizon)
    return {
        "median": np.asarray(f.median, dtype=float).squeeze(),
        "lower": np.asarray(f.quantile(0.1), dtype=float).squeeze(),
        "upper": np.asarray(f.quantile(0.9), dtype=float).squeeze(),
    }


def run_arima(y, horizon, cfg, models):
    from statsmodels.tsa.arima.model import ARIMA

    endog = y.to_numpy(dtype=float)[-ARIMA_CONTEXT:]
    res = ARIMA(
        endog,
        order=cfg.get("order", (1, 0, 1)),
        seasonal_order=cfg.get("seasonal_order", (1, 0, 0, 24)),
    ).fit()
    frame = res.get_forecast(steps=horizon).summary_frame(alpha=0.2)  # 80% interval
    return {
        "median": frame["mean"].to_numpy(),
        "lower": frame["mean_ci_lower"].to_numpy(),
        "upper": frame["mean_ci_upper"].to_numpy(),
    }


def run_naive(y, horizon, cfg, models):
    """Same hour yesterday. Also the fallback when another model fails."""
    last_day = y.ffill().fillna(0).to_numpy(dtype=float)[-24:]
    pred = np.resize(last_day, horizon)  # repeats the last 24 hours
    return {"median": pred, "lower": pred, "upper": pred}


RUNNERS = {
    "timesfm": run_timesfm,
    "chronos2": run_chronos2,
    "timestral": run_timestral,
    "arima": run_arima,
    "naive": run_naive,
}
