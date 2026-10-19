import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

/** Repository root: packages/pipeline/src/lib is four levels down. REPO_ROOT overrides it (Docker). */
export const ROOT = process.env.REPO_ROOT ?? resolve(fileURLToPath(new URL(".", import.meta.url)), "../../../..");

export const P = {
  root: ROOT,
  config: resolve(ROOT, "config.toml"),
  env: resolve(ROOT, ".env"),
  registry: resolve(ROOT, "sources/registry.yaml"),
  inbox: resolve(ROOT, "inbox"),
  raw: resolve(ROOT, "raw"),
  queue: resolve(ROOT, "queue"),
  pending: resolve(ROOT, "queue/pending"),
  answers: (run: 1 | 2) => resolve(ROOT, `queue/answers/run${run}`),
  prompts: resolve(ROOT, "prompts"),
  schema: resolve(ROOT, "schema"),
  rules: resolve(ROOT, "rules"),
  review: resolve(ROOT, "review"),
  releases: resolve(ROOT, "releases"),
  reports: resolve(ROOT, "reports"),
  gold: resolve(ROOT, "gold"),
  data: resolve(ROOT, "data"),
};

export const monthDir = (month: string) => resolve(P.raw, month);
