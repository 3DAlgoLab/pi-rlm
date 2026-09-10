import type {
	LlmQueryRole,
	RlmArtifactSummary,
	RlmChildArtifact,
	RlmConsolidationRef,
	RlmRetentionMetrics,
	RlmRetentionPolicy,
	RlmValueManifest,
	RlmWorkspace,
	RlmWorkspaceManifest,
} from "./types.js";
export declare const INTERNAL_LLM_QUERY_CONTEXT_KEY = "__rlmRuntimeContext";
export declare const MAX_WORKSPACE_ARTIFACTS = 24;
export declare function ensureWorkspaceShape(value: unknown): RlmWorkspace;
export declare function toArtifactSummary(artifact: RlmChildArtifact): RlmArtifactSummary;
export declare function recordArtifact(
	workspaceValue: unknown,
	artifactValue: RlmChildArtifact,
	maxArtifacts?: number,
): RlmWorkspace;
export declare function buildValueManifest(
	value: unknown,
	path: string,
	options?: {
		keyPreviewLimit?: number;
		arrayPreviewLimit?: number;
	},
): RlmValueManifest;
export declare function buildStateManifest(state: Record<string, unknown> | undefined): RlmValueManifest | undefined;
export declare function buildWorkspaceManifest(
	workspaceValue: unknown,
	options?: {
		sectionKeys?: string[];
		relevantArtifacts?: RlmArtifactSummary[];
		sectionLimit?: number;
	},
): RlmWorkspaceManifest | undefined;
export declare function buildWorkspaceWorkingSetSummary(workspaceValue: unknown): string | undefined;
export declare function recordRetentionLease(
	workspaceValue: unknown,
	input: {
		source: "assistant" | "tool";
		sourceName?: string;
		turnIndex: number;
		messageFingerprint: string;
		expiresAfterTurns?: number;
		consolidatedTo?: RlmConsolidationRef[];
	},
): RlmWorkspace | undefined;
export declare function recordRetentionMetrics(
	workspaceValue: unknown,
	latestMetrics: RlmRetentionMetrics,
	latestTurnIndex: number,
	policy?: Pick<RlmRetentionPolicy, "expireConsolidatedAfterTurns" | "keepLatestSurfaceSummary">,
): RlmWorkspace | undefined;
export declare function buildWorkspacePointerHints(workspaceValue: unknown): string | undefined;
export declare function selectRelevantArtifacts(
	workspaceValue: unknown,
	options?: {
		prompt: string;
		role: LlmQueryRole;
		limit?: number;
	},
): RlmArtifactSummary[];
export declare function selectRelevantWorkspaceSectionKeys(role: LlmQueryRole, workspaceValue: unknown): string[];
export declare function attachInternalLlmQueryContext<T>(
	input: T,
	context: {
		workspace?: RlmWorkspace | null;
	},
): T;
export declare function splitInternalLlmQueryContext(input: unknown): {
	publicInput: unknown;
	workspace?: RlmWorkspace | null;
};
//# sourceMappingURL=workspace.d.ts.map
