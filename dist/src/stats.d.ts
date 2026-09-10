import type { ExtensionContext } from "@earendil-works/pi-coding-agent";
import type { RlmSessionStats, RuntimeSnapshot } from "./types.js";
export declare function collectRlmSessionStats(
	ctx: ExtensionContext,
	options: {
		depth: number;
		maxDepth: number;
	},
	runtimeSnapshot?: RuntimeSnapshot,
): RlmSessionStats;
//# sourceMappingURL=stats.d.ts.map
