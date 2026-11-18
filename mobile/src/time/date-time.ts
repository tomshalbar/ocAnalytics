export type DateTimeSettings = { locale: string; timeZone: string };

export function getDeviceDateTimeSettings(): DateTimeSettings {
  const { locale, timeZone } = new Intl.DateTimeFormat().resolvedOptions();
  return { locale, timeZone };
}

// API instants must carry an offset; never interpret server wall time as local time.
export function parseTimestamp(value: string | null): number {
  return value && /T.*(?:Z|[+-]\d{2}:\d{2})$/i.test(value)
    ? Date.parse(value)
    : NaN;
}

export function createDateTimeFormatter(settings: DateTimeSettings) {
  const date = new Intl.DateTimeFormat(settings.locale, {
    timeZone: settings.timeZone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
  });
  const dateTime = new Intl.DateTimeFormat(settings.locale, {
    timeZone: settings.timeZone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    timeZoneName: "short",
  });
  const month = new Intl.DateTimeFormat(settings.locale, {
    timeZone: settings.timeZone,
    month: "short",
  });
  const hour = new Intl.DateTimeFormat(settings.locale, {
    timeZone: settings.timeZone,
    hour: "numeric",
    hour12: true,
  });
  // Stable keys are independent of the user's display locale/calendar.
  const calendar = new Intl.DateTimeFormat("en-US-u-ca-gregory-nu-latn", {
    timeZone: settings.timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
    timeZoneName: "longOffset",
  });
  const format = (formatter: Intl.DateTimeFormat, value: string | null) => {
    const timestamp = parseTimestamp(value);
    return Number.isFinite(timestamp)
      ? formatter.format(timestamp)
      : "Not provided";
  };

  return {
    ...settings,
    formatDate: (value: string | null) => format(date, value),
    formatDateTime: (value: string | null) => format(dateTime, value),
    formatMonth: (value: string | null) => format(month, value),
    formatHour: (value: string | null) => format(hour, value),
    calendarKeys(value: string) {
      const timestamp = parseTimestamp(value);
      if (!Number.isFinite(timestamp)) return null;
      const parts = calendar.formatToParts(timestamp);
      const part = (type: Intl.DateTimeFormatPartTypes) =>
        parts.find((item) => item.type === type)!.value;
      const monthKey = `${part("year")}-${part("month")}`;
      return {
        month: Number(part("month")),
        monthKey,
        // Include the UTC offset so the repeated DST hour remains two bars.
        hourKey: `${monthKey}-${part("day")}-${part("hour")}-${part("timeZoneName")}`,
      };
    },
  };
}
