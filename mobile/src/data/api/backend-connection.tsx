import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { AppState } from "react-native";

import { checkBackendConnection, getRequestTimeoutMs } from "./locations";
import { refreshDueResources } from "./resource-cache";

type ConnectionState =
  | { status: "checking"; error: null }
  | { status: "connected"; error: null }
  | { status: "unavailable"; error: string };

type BackendConnection = ConnectionState & { retry: () => void };
const BackendConnectionContext = createContext<BackendConnection | null>(null);

export function BackendConnectionProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [state, setState] = useState<ConnectionState>({
    status: "checking",
    error: null,
  });
  const [revision, setRevision] = useState(0);
  const retry = useCallback(() => {
    setState({ status: "checking", error: null });
    setRevision((value) => value + 1);
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (status) => {
      if (status === "active") refreshDueResources();
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    const timer = setTimeout(() => controller.abort(), getRequestTimeoutMs());
    checkBackendConnection(controller.signal)
      .then(() => {
        if (active && !controller.signal.aborted)
          setState({ status: "connected", error: null });
      })
      .catch((reason: unknown) => {
        if (!active) return;
        setState({
          status: "unavailable",
          error: controller.signal.aborted
            ? "Connection timed out. Render may still be waking up. Please retry."
            : reason instanceof Error
              ? reason.message
              : "Unable to connect to the backend.",
        });
      })
      .finally(() => clearTimeout(timer));

    return () => {
      active = false;
      clearTimeout(timer);
      controller.abort();
    };
  }, [revision]);

  return (
    <BackendConnectionContext value={{ ...state, retry }}>
      {children}
    </BackendConnectionContext>
  );
}

export function useBackendConnection() {
  const connection = useContext(BackendConnectionContext);
  if (!connection)
    throw new Error("useBackendConnection requires BackendConnectionProvider.");
  return connection;
}
