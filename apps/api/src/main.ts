import { config } from "./config.js";
import { loadData, reloadIfChanged } from "./data.js";
import { buildApp } from "./server.js";

await loadData();
const app = await buildApp({ logger: true });
await app.listen({ port: config.port, host: config.host });

// The pipeline writes rules/ and sources/ in place (bind-mounted under Docker); pick up new files.
const reload = setInterval(() => void reloadIfChanged((m) => app.log.info(m)), config.reloadMs);
reload.unref();

for (const sig of ["SIGINT", "SIGTERM"] as const) {
  process.on(sig, () => {
    app.close().then(() => process.exit(0));
  });
}
