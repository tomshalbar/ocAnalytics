import type { LocationReading } from "./location-contracts";

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
  const data: unknown = await response.json();
  const rows = locationId === undefined ? data : [data];
  if (!Array.isArray(rows) || !rows.every(isReading))
    throw new ApiError("The backend returned an unexpected response.");
  return rows;
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
