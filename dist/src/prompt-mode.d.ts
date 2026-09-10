import type { ExtensionContext } from "@earendil-works/pi-coding-agent";
import type { RlmPromptMode } from "./types.js";
export declare const RLM_PROMPT_MODE_TYPE = "rlm-prompt-mode";
export declare const DEFAULT_RLM_PROMPT_MODE: RlmPromptMode;
export declare function isRlmPromptMode(value: string): value is RlmPromptMode;
export declare function getRlmPromptModeLabel(mode: RlmPromptMode): string;
export declare function buildRlmModeAppendix(mode: RlmPromptMode): string;
export declare function findRlmPromptMode(ctx: ExtensionContext): RlmPromptMode;
//# sourceMappingURL=prompt-mode.d.ts.map
