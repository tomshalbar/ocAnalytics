import { useEffect, useSyncExternalStore } from "react";
import { getRequestTimeoutMs } from "./locations";
import { getCachedResource } from "./resource-cache";

const emptySnapshot = {
  data: undefined,
  loading: false,
  error: null,
  notFound: false,
};
const subscribeEmpty = () => () => {};
const getEmptySnapshot = () => emptySnapshot;

// Cache by request identity across screen mounts; navigation never refreshes it.
export function useApiResource<T>(
  load: ((signal: AbortSignal) => Promise<T>) | null,
  key: string,
) {
  const resource = load
    ? getCachedResource(key, load, getRequestTimeoutMs())
    : null;
  const state = useSyncExternalStore(
    resource?.subscribe ?? subscribeEmpty,
    resource?.getSnapshot ?? getEmptySnapshot,
    resource?.getSnapshot ?? getEmptySnapshot,
  );
  useEffect(() => {
    void resource?.ensureLoaded();
  }, [resource]);
  return {
    ...state,
    refresh: resource?.refresh ?? (() => {}),
  };
}
