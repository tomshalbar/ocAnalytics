import type {
  LocationReading,
  LocationStatisticsResponse,
  LocationTimeRange,
  LocationHistoryQuery,
} from "./location-contracts";

export type { LocationReading } from "./location-contracts";

export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
  ) {
    super(message);
  }
}

function getApiBaseUrl() {
  const base = process.env.EXPO_PUBLIC_API_URL?.trim().replace(/\/+$/, "");
  if (!base)
    throw new ApiError(
      "Set EXPO_PUBLIC_API_URL to your backend address, then restart Expo.",
    );
  return base;
}

// Connectivity only. The root endpoint does not query occupancy or the database.
export async function checkBackendConnection(
  signal: AbortSignal,
): Promise<void> {
  const base = getApiBaseUrl();
  let response: Response;
  try {
    response = await fetch(`${base}/`, { signal });
  } catch {
    throw new ApiError("Cannot reach the backend. Please retry.");
  }
  if (!response.ok)
    throw new ApiError(
      "Backend server is unavailable. Please retry.",
      response.status,
    );
  let data: unknown;
  try {
    data = await response.json();
  } catch {
    throw new ApiError("The backend returned an unexpected health response.");
  }
  if (
    !data ||
    typeof data !== "object" ||
    !("message" in data) ||
    data.message !== "Open Court Analytics API is running"
  )
    throw new ApiError("The backend returned an unexpected health response.");
}

function isReading(value: unknown): value is LocationReading {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  const nullableNumber = (v: unknown) =>
    v === null || (typeof v === "number" && Number.isFinite(v));
  const date = (v: unknown) =>
    typeof v === "string" && Number.isFinite(Date.parse(v));
  return (
    Number.isInteger(row.id) &&
    Number.isInteger(row.LocationId) &&
    nullableNumber(row.FacilityId) &&
    nullableNumber(row.CountOfParticipants) &&
    nullableNumber(row.PercetageCapacity) &&
    nullableNumber(row.LastCount) &&
    (row.IsClosed === null || typeof row.IsClosed === "boolean") &&
    (row.LastUpdatedDateAndTime === null || date(row.LastUpdatedDateAndTime)) &&
    date(row.runDatetime) &&
    typeof row.is_stale === "boolean" &&
    typeof row.collection_is_stale === "boolean"
  );
}

export async function getLocations(
  locationId: string | undefined,
  signal: AbortSignal,
): Promise<LocationReading[]> {
  const base = getApiBaseUrl();
  if (locationId !== undefined && !/^\d+$/.test(locationId)) {
    throw new ApiError("This location does not exist.", 404);
  }
  const path =
    locationId === undefined
      ? "/locations/latest"
      : `/locations/${encodeURIComponent(locationId)}/latest`;
  let response: Response;
  try {
    response = await fetch(base + path, { signal });
  } catch {
    throw new ApiError(
      "Cannot reach the backend. Check your connection and API address.",
    );
  }
  if (!response.ok) {
    throw new ApiError(
      response.status === 404
        ? "This location does not exist."
        : "Occupancy data is temporarily unavailable. Please retry.",
      response.status,
    );
  }
  let data: unknown;
  try {
    data = await response.json();
  } catch {
    throw new ApiError("The backend returned an unexpected response.");
  }
  const rows = locationId === undefined ? data : [data];
  if (
    !Array.isArray(rows) ||
    !rows.every(
      (row) =>
        isReading(row) &&
        (locationId === undefined || row.LocationId === Number(locationId)),
    )
  )
    throw new ApiError("The backend returned an unexpected response.");
  return rows;
}

function rangeQuery(range: LocationTimeRange) {
  const start = Date.parse(range.start);
  const end = Date.parse(range.end);
  const hasOffset = (value: string) => /(?:Z|[+-]\d{2}:\d{2})$/i.test(value);
  if (
    !hasOffset(range.start) ||
    !hasOffset(range.end) ||
    !Number.isFinite(start) ||
    !Number.isFinite(end) ||
    start >= end ||
    end - start > 31 * 86400000
  )
    throw new ApiError("Choose an offset-aware date range of at most 31 days.");
  return `start=${encodeURIComponent(range.start)}&end=${encodeURIComponent(range.end)}`;
}

async function getLocationResource(
  locationId: string,
  resource: string,
  query: string,
  signal: AbortSignal,
): Promise<unknown> {
  if (!/^\d+$/.test(locationId))
    throw new ApiError("This location does not exist.", 404);
  let response: Response;
  try {
    response = await fetch(
      `${getApiBaseUrl()}/locations/${encodeURIComponent(locationId)}/${resource}?${query}`,
      { signal },
    );
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      "Cannot reach the backend. Check your connection and API address.",
    );
  }
  if (!response.ok)
    throw new ApiError(
      response.status === 404
        ? "No data found for this location and date range."
        : "Occupancy data is temporarily unavailable. Please retry.",
      response.status,
    );
  try {
    return await response.json();
  } catch {
    throw new ApiError("The backend returned an unexpected response.");
  }
}

export async function getLocationHistory(
  locationId: string,
  query: LocationHistoryQuery,
  signal: AbortSignal,
): Promise<LocationReading[]> {
  const { limit = 100, offset = 0 } = query;
  if (
    !Number.isInteger(limit) ||
    limit < 1 ||
    limit > 1000 ||
    !Number.isInteger(offset) ||
    offset < 0 ||
    offset > 100000
  )
    throw new ApiError("Invalid history page.");
  const data = await getLocationResource(
    locationId,
    "history",
    `${rangeQuery(query)}&limit=${limit}&offset=${offset}`,
    signal,
  );
  if (
    !Array.isArray(data) ||
    !data.every(
      (row) => isReading(row) && row.LocationId === Number(locationId),
    )
  )
    throw new ApiError("The backend returned an unexpected response.");
  return data;
}

export async function getLocationStatistics(
  locationId: string,
  range: LocationTimeRange,
  signal: AbortSignal,
): Promise<LocationStatisticsResponse | null> {
  let data: unknown;
  try {
    data = await getLocationResource(
      locationId,
      "stats",
      rangeQuery(range),
      signal,
    );
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
  if (!data || typeof data !== "object")
    throw new ApiError("The backend returned an unexpected response.");
  const row = data as Record<string, unknown>;
  const stats = row.statistics as Record<string, unknown> | null;
  const nullableNumber = (value: unknown) =>
    value === null || (typeof value === "number" && Number.isFinite(value));
  if (
    row.location_id !== Number(locationId) ||
    typeof row.start !== "string" ||
    typeof row.end !== "string" ||
    Date.parse(row.start) !== Date.parse(range.start) ||
    Date.parse(row.end) !== Date.parse(range.end) ||
    !stats ||
    typeof stats !== "object" ||
    !Number.isInteger(stats.total_readings) ||
    (stats.total_readings as number) < 0 ||
    !nullableNumber(stats.average_count) ||
    !nullableNumber(stats.minimum_count) ||
    !nullableNumber(stats.maximum_count)
  )
    throw new ApiError("The backend returned an unexpected response.");
  return data as LocationStatisticsResponse;
}

export function readingStatus(row: LocationReading) {
  if (row.is_stale || row.collection_is_stale)
    return "Outdated reading · current status unconfirmed";
  if (row.IsClosed === true) return "Reported closed";
  if (row.IsClosed === false) return "Reported open";
  return "Opening status unknown";
}

export function formatReadingTime(value: string | null) {
  return value ? new Date(value).toLocaleString() : "Not provided";
}

// Invalid or excessive configuration falls back to 15 seconds.
export function getRequestTimeoutMs(
  value: string | undefined = process.env.EXPO_PUBLIC_API_TIMEOUT_MS,
): number {
  const milliseconds = Number(value);
  return Number.isInteger(milliseconds) &&
    milliseconds >= 1000 &&
    milliseconds <= 300000
    ? milliseconds
    : 15000;
}
