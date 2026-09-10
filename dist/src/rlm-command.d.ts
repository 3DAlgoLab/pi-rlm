import type { RlmPromptMode } from "./types.js";
export type RlmCommandAction = {
    type: "toggle";
} | {
    type: "set-mode";
    mode: RlmPromptMode;
} | {
    type: "inspect";
} | {
    type: "reset";
} | {
    type: "invalid";
    value: string;
};
export declare function parseRlmCommandAction(input: string): RlmCommandAction;
//# sourceMappingURL=rlm-command.d.ts.map