import { config } from "./config.js";
import { loadData } from "./data.js";
import { buildApp } from "./server.js";

await loadData();
const app = await buildApp({ logger: true });
await app.listen({ port: config.port, host: config.host });

for (const sig of ["SIGINT", "SIGTERM"] as const) {
  process.on(sig, () => {
    app.close().then(() => process.exit(0));
  });
}
