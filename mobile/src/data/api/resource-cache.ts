export const REFRESH_INTERVAL_MS = 10 * 60 * 1000;

type Snapshot<T> = {
  data: T | undefined;
  loading: boolean;
  error: string | null;
  notFound: boolean;
};

export class CachedResource<T> {
  private snapshot: Snapshot<T> = {
    data: undefined,
    loading: true,
    error: null,
    notFound: false,
  };
  private listeners = new Set<() => void>();
  private pending: Promise<void> | undefined;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private lastAttempt: number | undefined;

  constructor(
    private load: (signal: AbortSignal) => Promise<T>,
    private timeoutMs: number,
  ) {}

  getSnapshot = () => this.snapshot;

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  private update(snapshot: Snapshot<T>) {
    this.snapshot = snapshot;
    this.listeners.forEach((listener) => listener());
  }

  ensureLoaded = () => {
    if (this.lastAttempt === undefined) return this.refresh();
    return this.pending ?? Promise.resolve();
  };

  refreshIfDue = () => {
    if (
      this.lastAttempt !== undefined &&
      Date.now() - this.lastAttempt >= REFRESH_INTERVAL_MS
    )
      void this.refresh();
  };

  refresh = (): Promise<void> => {
    if (this.pending) return this.pending;
    clearTimeout(this.timer);
    this.lastAttempt = Date.now();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    this.update({
      ...this.snapshot,
      loading: true,
      error: null,
      notFound: false,
    });
    this.pending = Promise.resolve()
      .then(() => this.load(controller.signal))
      .then((data) => {
        if (controller.signal.aborted) throw new Error("Request timed out.");
        this.update({ data, loading: false, error: null, notFound: false });
      })
      .catch((reason: unknown) => {
        this.update({
          ...this.snapshot,
          loading: false,
          error: controller.signal.aborted
            ? "Request timed out. Please retry."
            : reason instanceof Error
              ? reason.message
              : "Unable to load data.",
          notFound:
            reason instanceof Error &&
            "status" in reason &&
            reason.status === 404,
        });
      })
      .finally(() => {
        clearTimeout(timeout);
        this.pending = undefined;
        this.timer = setTimeout(this.refresh, REFRESH_INTERVAL_MS);
      });
    return this.pending;
  };
}

const resources = new Map<string, CachedResource<unknown>>();

export function getCachedResource<T>(
  key: string,
  load: (signal: AbortSignal) => Promise<T>,
  timeoutMs: number,
): CachedResource<T> {
  let resource = resources.get(key);
  if (!resource) {
    resource = new CachedResource(load, timeoutMs);
    resources.set(key, resource);
  }
  return resource as CachedResource<T>;
}

export function refreshDueResources() {
  resources.forEach((resource) => resource.refreshIfDue());
}

export function refreshAllResources() {
  resources.forEach((resource) => void resource.refresh());
}
