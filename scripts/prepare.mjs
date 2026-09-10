// Runs from the `prepare` lifecycle script, which fires on every `npm install`
// — including pi's git install flow, which runs `npm install --omit=dev`.
//
// pi resolves @earendil-works/* and typebox imports to host modules at runtime
// (loader aliases), so installed copies must not install or rebuild against
// those packages. The prebuilt `dist/` is committed instead.
//
// We only build when dev dependencies (typescript) are actually present, i.e.
// in a local development checkout after a full `npm install`.
import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

if (!existsSync(join(root, "node_modules", "typescript"))) {
	console.log("prepare: typescript not installed; skipping build (using committed dist/)");
	process.exit(0);
}

const result = spawnSync("npm", ["run", "build"], { cwd: root, stdio: "inherit" });
process.exit(result.status ?? 1);
