import { ApiError, getLocationResource } from "./locations.ts";

export type ForecastPoint = {
  timestamp: string;
  median: number;
  lower: number;
  upper: number;
};

export type LocationForecast = {
  location_id: number;
  model: string;
  used_fallback: boolean;
  generated_at: string;
  data_through: string;
  forecast: ForecastPoint[];
};

const offsetDate = (value: unknown): value is string =>
  typeof value === "string" &&
  /(?:Z|[+-]\d{2}:\d{2})$/i.test(value) &&
  Number.isFinite(Date.parse(value));

function isForecast(
  value: unknown,
  locationId: string,
  hours: number,
): value is LocationForecast {
  if (!value || typeof value !== "object") return false;
  const data = value as Record<string, unknown>;
  if (
    data.location_id !== Number(locationId) ||
    typeof data.model !== "string" ||
    data.model.trim() === "" ||
    typeof data.used_fallback !== "boolean" ||
    !offsetDate(data.generated_at) ||
    !offsetDate(data.data_through) ||
    !Array.isArray(data.forecast) ||
    data.forecast.length !== hours
  )
    return false;
  let previous: number | undefined;
  return data.forecast.every((value: unknown) => {
    if (!value || typeof value !== "object") return false;
    const point = value as Record<string, unknown>;
    if (
      !offsetDate(point.timestamp) ||
      typeof point.median !== "number" ||
      !Number.isFinite(point.median) ||
      typeof point.lower !== "number" ||
      !Number.isFinite(point.lower) ||
      typeof point.upper !== "number" ||
      !Number.isFinite(point.upper) ||
      point.lower < 0 ||
      point.lower > point.median ||
      point.median > point.upper
    )
      return false;
    const timestamp = Date.parse(point.timestamp);
    if (
      timestamp <= Date.parse(data.data_through as string) ||
      (previous !== undefined && timestamp - previous !== 3600000)
    )
      return false;
    previous = timestamp;
    return true;
  });
}

export async function getLocationForecast(
  locationId: string,
  hours: number,
  signal: AbortSignal,
): Promise<LocationForecast> {
  if (!Number.isInteger(hours) || hours < 1 || hours > 168)
    throw new ApiError("Choose a forecast of 1 to 168 whole hours.");
  let data: unknown;
  try {
    data = await getLocationResource(
      locationId,
      "forecast",
      `hours=${hours}`,
      signal,
    );
  } catch (error) {
    if (
      error instanceof ApiError &&
      (error.status === 404 || error.status === 503)
    )
      throw new ApiError(
        "Predictions are temporarily unavailable for this location. Please retry later.",
        error.status,
      );
    throw error;
  }
  if (!isForecast(data, locationId, hours))
    throw new ApiError("The backend returned an unexpected forecast response.");
  return data;
}
