import type { ExtensionContext } from "@earendil-works/pi-coding-agent";
import type { LlmQueryRole, RuntimeSnapshot, RlmWorkspace } from "./types.js";
export declare const RLM_RUNTIME_TYPE = "rlm-runtime";
export declare const RLM_WORKSPACE_TYPE = "rlm-workspace";
export declare function getSessionRuntimeKey(ctx: ExtensionContext): string;
export declare function findLatestSnapshotInBranch(branch: unknown[]): RuntimeSnapshot | undefined;
export declare function findLatestSnapshot(ctx: ExtensionContext): RuntimeSnapshot | undefined;
export declare function findLatestWorkspaceInBranch(branch: unknown[]): RlmWorkspace | null | undefined;
export declare function findLatestWorkspace(ctx: ExtensionContext): RlmWorkspace | null | undefined;
export declare function buildChildArtifactFromBranch(
	branch: unknown[],
	options: {
		childId: string;
		role: LlmQueryRole;
		depth: number;
		turns: number;
		status: "ok" | "error" | "budget_exhausted";
	},
): {
	version: 1;
	childId: string;
	role: LlmQueryRole;
	depth: number;
	turns: number;
	status: "ok" | "error" | "budget_exhausted";
	snapshot?: RuntimeSnapshot;
	workspace?: RlmWorkspace | null;
};
export declare function composeRuntimeSnapshot(
	snapshot: RuntimeSnapshot | undefined,
	workspace: RlmWorkspace | null | undefined,
): RuntimeSnapshot;
export declare function findBootstrapSnapshot(ctx: ExtensionContext): RuntimeSnapshot | undefined;
//# sourceMappingURL=restore.d.ts.map
