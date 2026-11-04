import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import { ApiError, getRequestTimeoutMs } from "./locations";

// Clear old results on request changes; abort on blur, retry, timeout, or unmount.
export function useApiResource<T>(
  load: ((signal: AbortSignal) => Promise<T>) | null,
) {
  const [state, setState] = useState<{
    data: T | undefined;
    loading: boolean;
    error: string | null;
    notFound: boolean;
    request: typeof load;
  }>({
    data: undefined,
    loading: !!load,
    error: null,
    notFound: false,
    request: load,
  });
  const [revision, setRevision] = useState(0);
  const refresh = useCallback(() => setRevision((value) => value + 1), []);
  useFocusEffect(
    useCallback(() => {
      void revision;
      if (!load) return;
      let active = true;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), getRequestTimeoutMs());
      setState({
        data: undefined,
        loading: true,
        error: null,
        notFound: false,
        request: load,
      });
      load(controller.signal)
        .then((data) => {
          if (active && !controller.signal.aborted)
            setState({
              data,
              loading: false,
              error: null,
              notFound: false,
              request: load,
            });
        })
        .catch((reason: unknown) => {
          if (active)
            setState({
              data: undefined,
              loading: false,
              error: controller.signal.aborted
                ? "Request timed out. Please retry."
                : reason instanceof Error
                  ? reason.message
                  : "Unable to load data.",
              notFound: reason instanceof ApiError && reason.status === 404,
              request: load,
            });
        })
        .finally(() => clearTimeout(timer));
      return () => {
        active = false;
        clearTimeout(timer);
        controller.abort();
      };
    }, [load, revision]),
  );
  if (state.request !== load || !load)
    return {
      data: undefined,
      loading: !!load,
      error: null,
      notFound: false,
      refresh,
    };
  return { ...state, refresh };
}
