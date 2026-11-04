import type { LocationReading } from "@/data/api/location-contracts";

export type ReadingBar = { id: number; count: number; collectedAt: string };
export type ReadingMonth = { key: string; month: number; bars: ReadingBar[] };

export function buildReadingChart(readings: readonly LocationReading[]) {
  const months = new Map<string, ReadingMonth>();
  const hours = new Map<string, ReadingBar>();
  let maximum = 0;
  let plottedCount = 0;

  const ordered = [...readings].sort(
    (a, b) => Date.parse(a.runDatetime) - Date.parse(b.runDatetime),
  );
  for (const reading of ordered) {
    const count = reading.LastCount;
    const date = new Date(reading.runDatetime);
    if (
      count === null ||
      !Number.isFinite(count) ||
      count < 0 ||
      !Number.isFinite(date.getTime())
    )
      continue;

    const month = date.getMonth() + 1;
    const hour = `${date.getFullYear()}-${month}-${date.getDate()}-${date.getHours()}`;
    plottedCount += 1;
    hours.set(hour, {
      id: reading.id,
      count,
      collectedAt: reading.runDatetime,
    });
  }

  for (const bar of hours.values()) {
    const date = new Date(bar.collectedAt);
    const month = date.getMonth() + 1;
    const key = `${date.getFullYear()}-${month}`;
    if (!months.has(key)) months.set(key, { key, month, bars: [] });
    months.get(key)!.bars.push(bar);
    maximum = Math.max(maximum, bar.count);
  }

  // Four equal intervals with whole-number, readable count ticks.
  const roughStep = Math.max(1, maximum / 4);
  const magnitude = 10 ** Math.floor(Math.log10(roughStep));
  const step =
    [1, 2, 5, 10].find((value) => value * magnitude >= roughStep)! * magnitude;
  const ticks = Array.from({ length: 5 }, (_, index) => (4 - index) * step);

  return {
    months: [...months.values()],
    ticks,
    maximum: ticks[0],
    omittedCount: readings.length - plottedCount,
  };
}
