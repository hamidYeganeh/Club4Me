export type RequestObservation = {
  category: "discovery" | "reservation" | "payment";
  status: number;
  duration_ms: number;
};
let observer: ((value: RequestObservation) => void) | undefined;
export function observeProductRequests(
  callback: (value: RequestObservation) => void,
) {
  observer = callback;
}
export function reportProductRequest(
  url: string | undefined,
  status: number,
  startedAt?: number,
) {
  if (!observer || !url || !startedAt || /telemetry|admin|business\//.test(url))
    return;
  const category = /commerce|payment/.test(url)
    ? "payment"
    : /reservation/.test(url)
      ? "reservation"
      : /discovery|public\/(clubs|coaches|classes)/.test(url)
        ? "discovery"
        : null;
  if (!category) return;
  try {
    observer({
      category,
      status,
      duration_ms: Math.max(0, Math.min(120000, Date.now() - startedAt)),
    });
  } catch {
    /* Observability cannot affect a request. */
  }
}
