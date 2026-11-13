import { bindings, defineConfig, defineWorker } from "cf/config";

const SITE_URL = "https://demo.reactpress.cc";

export default defineConfig({
  accountId: "20e5b7a6bcb2f37d0263f310e387352c",
  worker: defineWorker({
    name: "reactpress-theme-starter",
    entrypoint: "vinext/server/fetch-handler",
    compatibilityDate: "2026-11-12",
    // Same-zone SSR fetch (e.g. demo.reactpress.cc → /api) must loop back to this
    // Worker. Without the flag, Cloudflare sends those subrequests to the zone origin
    // and the mock /api routes are never hit — home feed + bootstrap stay empty.
    compatibilityFlags: ["global_fetch_strictly_public"],
    domains: ["demo.reactpress.cc"],
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
