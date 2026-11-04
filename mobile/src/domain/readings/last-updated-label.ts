const timeUnits = [
  { name: "year", seconds: 365 * 24 * 60 * 60 },
  { name: "month", seconds: 30 * 24 * 60 * 60 },
  { name: "day", seconds: 24 * 60 * 60 },
  { name: "hour", seconds: 60 * 60 },
  { name: "minute", seconds: 60 },
] as const;

export function lastUpdatedLabel(
  timestamp: string | null,
  now = Date.now(),
): string {
  const updatedAt = timestamp === null ? NaN : Date.parse(timestamp);
  if (!Number.isFinite(updatedAt)) return "Last updated time unavailable";

  const elapsedSeconds = Math.max(0, (now - updatedAt) / 1000);
  const unit = timeUnits.find(({ seconds }) => elapsedSeconds >= seconds);
  if (!unit) return "Last updated just now";

  const amount = Math.floor(elapsedSeconds / unit.seconds);
  return `Last updated ${amount} ${unit.name}${amount === 1 ? "" : "s"} ago`;
}
