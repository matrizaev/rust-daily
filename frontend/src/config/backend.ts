const LOCAL_BACKEND_URL = "http://127.0.0.1:8080";

declare global {
  interface Window {
    __RUST_DAILY_BACKEND_URL__?: string;
  }
}

const hasHttpScheme = (value: string) =>
  value.startsWith("http://") || value.startsWith("https://");

const usesLocalHost = (value: string) =>
  value.startsWith("localhost") ||
  value.startsWith("127.") ||
  value.startsWith("[::1]");

const addDefaultScheme = (value: string) =>
  hasHttpScheme(value)
    ? value
    : `${usesLocalHost(value) ? "http" : "https"}://${value}`;

const normalizeBackendUrl = (value: string) => {
  const withScheme = addDefaultScheme(value.trim()).replace(/\/+$/, "");

  try {
    const parsed = new URL(withScheme);

    return parsed.protocol === "http:" || parsed.protocol === "https:"
      ? withScheme
      : null;
  } catch {
    return null;
  }
};

const runtimeBackendUrl = () =>
  typeof window === "undefined" ? undefined : window.__RUST_DAILY_BACKEND_URL__;

const sameOriginBackendUrl = () =>
  typeof window === "undefined" ? "" : window.location.origin;

const defaultBackendUrl = () =>
  import.meta.env.DEV ? LOCAL_BACKEND_URL : sameOriginBackendUrl();

export const BACKEND_URL =
  normalizeBackendUrl(
    runtimeBackendUrl() ?? import.meta.env.VITE_RUST_DAILY_BACKEND_URL ?? "",
  ) ??
  defaultBackendUrl();
