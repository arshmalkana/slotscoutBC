/** Writes apps/web/public/sitemap.xml so rule pages are indexable ("Can I shoot at Stave Lake?", PRD 9.4). */
import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { RULES } from "@slotscout/engine";

const SITE = process.env.SITE_URL ?? "https://slotscout.ca";
const pages = ["/", "/about", "/rules", "/sources", "/ranges", "/terms", ...RULES.filter((r) => r.group !== "system").map((r) => `/rules/${r.id}`)];
const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map((p) => `  <url><loc>${SITE}${p}</loc></url>`).join("\n")}
</urlset>
`;
await writeFile(fileURLToPath(new URL("../apps/web/public/sitemap.xml", import.meta.url)), xml);
console.log(`sitemap.xml: ${pages.length} pages`);
