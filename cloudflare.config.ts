import { bindings, defineConfig, defineWorker } from "cf/config";

const SITE_URL = "https://reactpress-theme-starter.bjwlzxg.workers.dev";

export default defineConfig({
  accountId: "20e5b7a6bcb2f37d0263f310e387352c",
  worker: defineWorker({
    name: "reactpress-theme-starter",
    entrypoint: "vinext/server/fetch-handler",
    compatibilityDate: "2026-11-12",
    assets: {
      htmlHandling: "none",
      notFoundHandling: "none",
      runWorkerFirst: ["/*", "!/_next/static/*", "!/*/_next/static/*"],
    },
    env: {
      ASSETS: bindings.assets(),
      VINEXT_KV_CACHE: bindings.kv({ id: "26761a360fd041e9ad0298a447af34ea" }),
      REACTPRESS_MOCK_API: bindings.text("1"),
      REACTPRESS_BUNDLE_ADMIN: bindings.text("1"),
      REACTPRESS_API_URL: bindings.text(`${SITE_URL}/api`),
      NEXT_PUBLIC_REACTPRESS_API_URL: bindings.text("/api"),
      NEXT_PUBLIC_REACTPRESS_ADMIN_URL: bindings.text("/admin"),
      CLIENT_SITE_URL: bindings.text(SITE_URL),
    },
  }),
});
