// Runs from the `prepare` lifecycle script, which fires on every `npm install`
// — including pi's git install flow, which runs `npm install --omit=dev`.
//
// pi resolves @earendil-works/* and typebox imports to host modules at runtime
// (loader aliases), so those packages are NOT available here and must not be
// type-checked against. We transpile only (`noCheck`): types are erased in the
// emitted JS, and `typescript` is a real dependency so it is always present.
//
// Local development: `npm run build` / `npm run typecheck` for the full
// type-checked output.
import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

if (!existsSync(join(root, "node_modules", "typescript"))) {
	console.error("prepare: typescript (a production dependency) is missing from node_modules — install failed?");
	process.exit(1);
}

const result = spawnSync("npx", ["--no-install", "tsc", "-p", "tsconfig.install.json"], {
	cwd: root,
	stdio: "inherit",
});
process.exit(result.status ?? 1);
