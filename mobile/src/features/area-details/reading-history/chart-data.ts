import type { LocationReading } from "@/data/api/location-contracts";
import { RECENT_READING_LIMIT } from "../../../data/api/location-contracts.ts";
import {
  createDateTimeFormatter,
  getDeviceDateTimeSettings,
} from "../../../time/date-time.ts";

export type ReadingBar = { id: number; count: number; collectedAt: string };
export type ReadingMonth = { key: string; month: number; bars: ReadingBar[] };

export function buildReadingChart(
  readings: readonly LocationReading[],
  dateTime = createDateTimeFormatter(getDeviceDateTimeSettings()),
) {
  const months = new Map<string, ReadingMonth>();
  let maximum = 0;
  let omittedCount = 0;

  const recent = [...readings]
    .sort(
      (a, b) =>
        Date.parse(b.runDatetime) - Date.parse(a.runDatetime) || b.id - a.id,
    )
    .slice(0, RECENT_READING_LIMIT)
    .reverse();
  for (const reading of recent) {
    const count = reading.LastCount;
    const keys = dateTime.calendarKeys(reading.runDatetime);
    if (count === null || !Number.isFinite(count) || count < 0 || !keys) {
      omittedCount += 1;
      continue;
    }

    const bar = {
      id: reading.id,
      count,
      collectedAt: reading.runDatetime,
    };
    const { month, monthKey: key } = keys;
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
    omittedCount,
  };
}
