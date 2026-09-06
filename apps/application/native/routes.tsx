import {
  lazy,
  Suspense,
  useEffect,
  type ComponentType,
  type ReactNode,
} from "react";
import { useLocation } from "./navigation";
import { matchRoute, routePath, routeSpecificity } from "./route-matcher";
import { RouteLoadingSkeleton } from "@/components/loading-skeletons";
import { startLiveUpdates } from "@/lib/live-updates";

type PageProps = {
  params: Record<string, string>;
  searchParams: Record<string, string>;
};
type PageModule = { default: ComponentType<PageProps> };
type LayoutModule = { default: ComponentType<{ children: ReactNode }> };
const pages = import.meta.glob("../app/**/page.tsx") as Record<
  string,
  () => Promise<PageModule>
>;
const layouts = import.meta.glob([
  "../app/**/layout.tsx",
  "!../app/layout.tsx",
]) as Record<string, () => Promise<LayoutModule>>;
const routes = Object.entries(pages)
  .map(([file, load]) => {
    const path = routePath(file);
    const wrappers = Object.entries(layouts)
      .filter(([layout]) => {
        const prefix = routePath(layout);
        return path === prefix || path.startsWith(`${prefix}/`);
      })
      .sort(([a], [b]) => routePath(a).length - routePath(b).length);
    const Page = lazy(async () => {
      const [page, ...loadedLayouts] = await Promise.all([
        load(),
        ...wrappers.map(([, loader]) => loader()),
      ]);
      const Screen = page!.default as ComponentType<PageProps>;
      return {
        default: (props: PageProps) =>
          loadedLayouts.reduceRight<ReactNode>(
            (child, layout) => {
              const Layout = layout!.default as ComponentType<{
                children: ReactNode;
              }>;
              return <Layout>{child}</Layout>;
            },
            <Screen {...props} />,
          ),
      };
    });
    return { path, Page };
  })
  .sort((a, b) => routeSpecificity(b.path) - routeSpecificity(a.path));

export function NativeRoutes() {
  const location = new URL(useLocation());
  const route = routes.find((item) => matchRoute(item.path, location.pathname));
  if (!route)
    return (
      <main className="app-page">
        <p>این صفحه در دسترس نیست.</p>
        <a href="/discovery">بازگشت به کشف</a>
      </main>
    );
  const { Page } = route;
  return (
    <Suspense fallback={<RouteLoadingSkeleton />}>
      <Page
        key={location.pathname}
        params={matchRoute(route.path, location.pathname)!}
        searchParams={Object.fromEntries(location.searchParams)}
      />
      <UpdateReady />
    </Suspense>
  );
}

function UpdateReady() {
  useEffect(() => {
    void startLiveUpdates();
  }, []);
  return null;
}
