import { type ExtensionContext, type ExtensionFactory } from "@earendil-works/pi-coding-agent";
import { BUDGET_PRESETS, buildChildPrompt, normalizeLlmQueryInput, parseChildResult } from "./llm-query.js";
import { buildChildArtifactFromBranch } from "./restore.js";
import type { LlmQueryRequest, LlmQueryResult, RlmChildArtifact, RlmChildProgressEvent } from "./types.js";
type ChildArtifactBase = ReturnType<typeof buildChildArtifactFromBranch>;
type ChildArtifact = RlmChildArtifact & ChildArtifactBase;
export { BUDGET_PRESETS, buildChildPrompt, normalizeLlmQueryInput, parseChildResult };
export declare function buildForcedFinalizePrompt(args: {
    prompt: string;
    artifact: ChildArtifact;
    outputMode: "text" | "json";
    schema?: Record<string, string>;
}): string;
export declare function runChildQuery(input: LlmQueryRequest, ctx: ExtensionContext, options: {
    depth: number;
    maxDepth: number;
    extensionFactory: ExtensionFactory;
    parentActiveTools: string[];
    onProgress?: (event: RlmChildProgressEvent) => void;
}): Promise<LlmQueryResult>;
//# sourceMappingURL=recursion.d.ts.map