import type { AgentMessage } from "@earendil-works/pi-agent-core";
import type { RlmRetentionMetrics, RlmRetentionPolicy, RlmWorkspace } from "./types.js";
export declare const RLM_RETENTION_TYPE = "rlm-retention";
export declare const DEFAULT_RLM_RETENTION_POLICY: RlmRetentionPolicy;
export type RlmRetentionResult = {
	messages: AgentMessage[];
	metrics: RlmRetentionMetrics;
};
export declare function buildRetentionCompactionSummary(
	workspace: RlmWorkspace | null | undefined,
	preparation: {
		messagesToSummarize: AgentMessage[];
		turnPrefixMessages: AgentMessage[];
		previousSummary?: string;
		tokensBefore: number;
		firstKeptEntryId: string;
	},
): string;
export declare function applyRetentionPolicy(
	messages: AgentMessage[],
	options?: {
		workspace?: RlmWorkspace | null;
		policy?: Partial<RlmRetentionPolicy>;
		currentTurnIndex?: number;
	},
): RlmRetentionResult;
//# sourceMappingURL=context-retention.d.ts.map
