import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { adaptNativePage } from "./native/page-adapter";

const app = fileURLToPath(new URL(".", import.meta.url));
export default defineConfig(({ mode }) => {
  const env = {
    ...loadEnv(mode, app, "NEXT_PUBLIC_"),
    ...Object.fromEntries(
      Object.entries(process.env).filter(([key]) =>
        key.startsWith("NEXT_PUBLIC_"),
      ),
    ),
  };
  return {
    root: resolve(app, "native"),
    publicDir: resolve(app, "public"),
    plugins: [
      {
        name: "gym4me-native-pages",
        enforce: "pre",
        transform(source, id) {
          if (
            id.replace(/\\/g, "/").includes("/application/app/") &&
            id.endsWith("/page.tsx")
          )
            return adaptNativePage(source, id);
          if (
            source.includes('from "next-intl/server"') &&
            id.includes("/modules/")
          )
            throw new Error(`Server-only screen in native bundle: ${id}`);
        },
      },
      react(),
    ],
    define: {
      "process.env": JSON.stringify({
        ...env,
        NODE_ENV: mode === "production" ? "production" : "development",
      }),
    },
    resolve: {
      alias: [
        {
          find: /^next\/navigation$/,
          replacement: resolve(app, "native/navigation.tsx"),
        },
        { find: /^next\/link$/, replacement: resolve(app, "native/link.tsx") },
        {
          find: /^next\/image$/,
          replacement: resolve(app, "native/image.tsx"),
        },
        { find: /^@\//, replacement: `${app}/` },
        { find: /^@modules\//, replacement: `${app}/modules/` },
        {
          find: /^@api$/,
          replacement: resolve(app, "../../packages/api/src/index.ts"),
        },
        {
          find: "@api/provider",
          replacement: resolve(
            app,
            "../../packages/api/src/query/provider.tsx",
          ),
        },
        ...["account", "business", "discovery", "locations"].map((name) => ({
          find: `@api/${name}`,
          replacement: resolve(
            app,
            `../../packages/api/src/domains/${name}/index.ts`,
          ),
        })),
        {
          find: /^@api\//,
          replacement: `${resolve(app, "../../packages/api/src")}/`,
        },
        {
          find: /^@ui\//,
          replacement: `${resolve(app, "../../packages/ui/src")}/`,
        },
        {
          find: "@theme/provider",
          replacement: resolve(
            app,
            "../../packages/theme/src/theme-provider.tsx",
          ),
        },
        {
          find: /^@theme\//,
          replacement: `${resolve(app, "../../packages/theme/src")}/`,
        },
        {
          find: "@i18n/messages",
          replacement: resolve(
            app,
            "../../packages/i18n/src/locales/fa/messages.ts",
          ),
        },
      ],
    },
    css: { postcss: app },
    build: {
      outDir: resolve(app, "out"),
      emptyOutDir: true,
      target: "es2020",
      sourcemap: false,
    },
    server: { host: "127.0.0.1", port: 7091, strictPort: true },
    preview: { host: "127.0.0.1", port: 7091, strictPort: true },
  };
});
