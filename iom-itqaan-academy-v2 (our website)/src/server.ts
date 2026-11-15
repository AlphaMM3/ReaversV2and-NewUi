import { createStore } from "./db.js";
import { createApp } from "./app.js";
const store = createStore();
if (
  process.env.NODE_ENV === "production" &&
  process.env.ACADEMY_SECURE_COOKIES !== "1"
)
  throw new Error("HTTPS-only cookies required");
// LiteSpeed's lsnode loader uses require(). Keep the ESM graph free of top-level await.
async function start() {
  await store.read((c) => c.execute("SELECT 1 FROM users LIMIT 1"));
  const server = createApp(store, {
    secureCookies: process.env.ACADEMY_SECURE_COOKIES !== "0",
  }).listen(Number(process.env.PORT || 3000), "0.0.0.0", () =>
    console.log("Academy staging server started"),
  );
  for (const signal of ["SIGINT", "SIGTERM"])
    process.on(signal, () => {
      server.close(() => {
        void store.pool.end().then(() => process.exit(0));
      });
      setTimeout(() => process.exit(1), 10000).unref();
    });
}
void start().catch((error) => {
  console.error("Academy startup failed", { code: error.code || error.name });
  void store.pool.end().finally(() => process.exit(1));
});
