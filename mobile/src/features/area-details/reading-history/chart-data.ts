import type { LocationReading } from "@/data/api/location-contracts";

export type ReadingBar = { id: number; count: number; collectedAt: string };
export type ReadingMonth = { key: string; month: number; bars: ReadingBar[] };

export function buildReadingChart(readings: readonly LocationReading[]) {
  const months = new Map<string, ReadingMonth>();
  let maximum = 0;
  let plottedCount = 0;
  let previous: { day: string; count: number } | undefined;

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
    ) {
      previous = undefined;
      continue;
    }

    const month = date.getMonth() + 1;
    const key = `${date.getFullYear()}-${month}`;
    const day = `${key}-${date.getDate()}`;
    plottedCount += 1;
    if (previous?.day === day && previous.count === count) continue;
    previous = { day, count };
    if (!months.has(key)) months.set(key, { key, month, bars: [] });
    months.get(key)!.bars.push({
      id: reading.id,
      count,
      collectedAt: reading.runDatetime,
    });
    maximum = Math.max(maximum, count);
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
