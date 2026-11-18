import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { PropsWithChildren } from "react";
import { AppState } from "react-native";

import {
  createDateTimeFormatter,
  getDeviceDateTimeSettings,
} from "./date-time";

const DateTimeContext = createContext<ReturnType<
  typeof createDateTimeFormatter
> | null>(null);

export function DateTimeProvider({ children }: PropsWithChildren) {
  const [settings, setSettings] = useState(getDeviceDateTimeSettings);

  useEffect(() => {
    const sync = () => {
      const next = getDeviceDateTimeSettings();
      setSettings((previous) =>
        previous.locale === next.locale && previous.timeZone === next.timeZone
          ? previous
          : next,
      );
    };
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") sync();
    });
    // Also pick up settings changes while the app/browser remains visible.
    const timer = setInterval(sync, 60_000);
    sync();
    return () => {
      subscription.remove();
      clearInterval(timer);
    };
  }, []);

  const formatter = useMemo(
    () => createDateTimeFormatter(settings),
    [settings],
  );
  return (
    <DateTimeContext.Provider value={formatter}>
      {children}
    </DateTimeContext.Provider>
  );
}

export function useDateTime() {
  const value = useContext(DateTimeContext);
  if (!value) throw new Error("useDateTime requires DateTimeProvider");
  return value;
}
