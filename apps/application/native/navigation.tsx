import { useMemo, useSyncExternalStore } from "react";

const EVENT = "gym4me:navigation";
function subscribe(listener: () => void) {
  window.addEventListener("popstate", listener);
  window.addEventListener(EVENT, listener);
  return () => {
    window.removeEventListener("popstate", listener);
    window.removeEventListener(EVENT, listener);
  };
}
export function useLocation() {
  return useSyncExternalStore(
    subscribe,
    () => window.location.href,
    () => "http://localhost/",
  );
}
export function navigate(href: string, replace = false, scroll = true) {
  const url = new URL(href, window.location.href);
  if (!["http:", "https:"].includes(url.protocol)) return;
  if (url.origin !== window.location.origin) {
    window.location.assign(url.href);
    return;
  }
  if (url.href === window.location.href) return;
  window.history[replace ? "replaceState" : "pushState"](
    {},
    "",
    `${url.pathname}${url.search}${url.hash}`,
  );
  window.dispatchEvent(new Event(EVENT));
  if (scroll) document.querySelector(".app-scroll-root")?.scrollTo({ top: 0 });
}
const router = {
  push: (href: string, options?: { scroll?: boolean }) =>
    navigate(href, false, options?.scroll),
  replace: (href: string, options?: { scroll?: boolean }) =>
    navigate(href, true, options?.scroll),
  back: () => window.history.back(),
  forward: () => window.history.forward(),
  refresh: () => window.location.reload(),
  prefetch: async () => {},
};
export function useRouter() {
  return router;
}
export function usePathname() {
  return new URL(useLocation()).pathname;
}
export function useSearchParams() {
  const location = useLocation();
  return useMemo(() => new URL(location).searchParams, [location]);
}
export function redirect(href: string): never {
  queueMicrotask(() => router.replace(href));
  return null as never;
}
