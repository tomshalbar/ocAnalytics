import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import { ApiError, getLocations, type LocationReading } from "./locations";

export function useLocations(locationId?: string) {
  const [rows, setRows] = useState<LocationReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [revision, setRevision] = useState(0);
  const refresh = useCallback(() => setRevision((value) => value + 1), []);
  useFocusEffect(
    useCallback(() => {
      // Revision is the explicit manual-refresh token.
      void revision;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 15000);
      setLoading(true);
      setError(null);
      setNotFound(false);
      setRows([]);
      getLocations(locationId, controller.signal)
        .then((data) => {
          if (!controller.signal.aborted) setRows(data);
        })
        .catch((reason: unknown) => {
          if (!active) return;
          setNotFound(reason instanceof ApiError && reason.status === 404);
          setError(
            controller.signal.aborted
              ? "Request timed out. Please retry."
              : reason instanceof Error
                ? reason.message
                : "Unable to load occupancy data.",
          );
        })
        .finally(() => {
          if (active) {
            clearTimeout(timer);
            setLoading(false);
          }
        });
      let active = true;
      return () => {
        active = false;
        clearTimeout(timer);
        controller.abort();
      };
    }, [locationId, revision]),
  );
  return { rows, loading, error, notFound, refresh };
}
