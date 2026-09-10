import type {
	LlmQueryBudget,
	LlmQueryBudgetPreset,
	LlmQueryRequest,
	LlmQueryResult,
	NormalizedLlmQueryRequest,
	RlmWorkspace,
} from "./types.js";
export declare const BUDGET_PRESETS: Record<LlmQueryBudgetPreset, LlmQueryBudget>;
export declare function normalizeLlmQueryInput(input: LlmQueryRequest): NormalizedLlmQueryRequest;
type BuildChildPromptContext = {
	workspace?: RlmWorkspace | null;
};
export declare function buildChildPrompt(input: NormalizedLlmQueryRequest, context?: BuildChildPromptContext): string;
export declare function parseChildResult(text: string, input: NormalizedLlmQueryRequest, turns: number): LlmQueryResult;
//# sourceMappingURL=llm-query.d.ts.map
