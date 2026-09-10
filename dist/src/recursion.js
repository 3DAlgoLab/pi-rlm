import { createAgentSession, DefaultResourceLoader, getAgentDir, SessionManager, } from "@earendil-works/pi-coding-agent";
import { BUDGET_PRESETS, buildChildPrompt, normalizeLlmQueryInput, parseChildResult } from "./llm-query.js";
import { buildChildArtifactFromBranch, composeRuntimeSnapshot, RLM_RUNTIME_TYPE, RLM_WORKSPACE_TYPE } from "./restore.js";
import { buildWorkspacePointerHints, buildWorkspaceWorkingSetSummary, ensureWorkspaceShape, splitInternalLlmQueryContext } from "./workspace.js";
const BUILT_IN_TOOL_NAMES = ["read", "bash", "edit", "write", "grep", "find", "ls"];
const READ_ONLY_TOOL_NAMES = ["read", "grep", "find", "ls"];
const CODING_TOOL_NAMES = ["read", "bash", "edit", "write"];
function isBuiltInToolName(name) {
    return BUILT_IN_TOOL_NAMES.includes(name);
}
function resolveBuiltInToolNames(mode, parentActiveTools) {
    if (!mode || mode === "read-only")
        return [...READ_ONLY_TOOL_NAMES];
    if (mode === "coding")
        return [...CODING_TOOL_NAMES];
    if (mode === "same") {
        const filtered = parentActiveTools.filter(isBuiltInToolName);
        return filtered.length > 0 ? filtered : [...READ_ONLY_TOOL_NAMES];
    }
    const filtered = mode.filter(isBuiltInToolName);
    return filtered.length > 0 ? filtered : [...READ_ONLY_TOOL_NAMES];
}
function resolveBuiltInToolSet(names) {
    return Array.from(new Set(names));
}
export { BUDGET_PRESETS, buildChildPrompt, normalizeLlmQueryInput, parseChildResult };
function createChildId() {
    return `child-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
function buildPromptPreview(prompt) {
    const compact = prompt.trim().replace(/\s+/g, " ");
    return compact.length > 80 ? `${compact.slice(0, 79)}…` : compact;
}
function buildResumeSnapshot(artifact, state, workspace) {
    const base = artifact?.snapshot
        ? structuredClone(artifact.snapshot)
        : { version: 1, bindings: {}, entries: [] };
    const overlaid = composeRuntimeSnapshot(base, workspace ?? artifact?.workspace);
    const hasBindings = Object.keys(overlaid.bindings).length > 0 || overlaid.entries.length > 0;
    if (state && Object.keys(state).length > 0) {
        overlaid.bindings.input = structuredClone(state);
        overlaid.bindings.parentState = structuredClone(state);
        return overlaid;
    }
    return hasBindings ? overlaid : undefined;
}
function seedSessionManager(sessionManager, options) {
    const resumeSnapshot = buildResumeSnapshot(options.artifact, options.state, options.workspace);
    if (resumeSnapshot) {
        sessionManager.appendCustomEntry(RLM_RUNTIME_TYPE, { snapshot: resumeSnapshot });
    }
    const workspace = options.workspace ?? options.artifact?.workspace;
    if (workspace !== undefined) {
        sessionManager.appendCustomEntry(RLM_WORKSPACE_TYPE, { workspace });
    }
    if (!resumeSnapshot && options.state && Object.keys(options.state).length > 0) {
        sessionManager.appendCustomEntry("rlm-child-bootstrap", { state: options.state });
    }
}
function buildStateKeyHint(state) {
    if (!state)
        return undefined;
    const keys = Object.keys(state).filter((key) => typeof key === "string" && key.trim().length > 0);
    return keys.length > 0 ? keys.slice(0, 8).join(", ") : undefined;
}
export function buildForcedFinalizePrompt(args) {
    const sections = [];
    const workingSetPointers = buildWorkspacePointerHints(args.artifact.workspace);
    const workingSetSummary = buildWorkspaceWorkingSetSummary(args.artifact.workspace);
    const stateKeys = buildStateKeyHint(args.artifact.state);
    sections.push("You are a recursive RLM child node resuming from previously gathered child state.");
    sections.push("Runtime state access:");
    sections.push(workingSetPointers ?? "- Durable notebook: globalThis.workspace\n- Parent-provided local state: globalThis.parentState");
    sections.push("- Input alias: globalThis.input");
    if (workingSetSummary) {
        sections.push(`Restored working set:\n${workingSetSummary}`);
    }
    if (stateKeys) {
        sections.push(`Restored state keys: ${stateKeys}`);
    }
    if (args.artifact.summary) {
        sections.push(`Current child summary:\n${args.artifact.summary}`);
    }
    sections.push("Rules:");
    sections.push("- No tools are available in this finalization step.");
    sections.push("- Use the restored runtime state and recorded child artifacts only.");
    sections.push("- Inspect globalThis.workspace.activeContext first and use pointers instead of replaying transcript history.");
    sections.push("- If reusable findings already exist in runtime/workspace, preserve that structure and finalize from it.");
    sections.push("- Do not continue exploration or ask for more work.");
    sections.push("- Return the best final answer now.");
    if (args.outputMode === "json") {
        sections.push("- Return valid JSON only. Do not wrap it in markdown fences.");
        if (args.schema) {
            sections.push(`Requested JSON shape:\n${JSON.stringify(args.schema, null, 2)}`);
        }
    }
    else {
        sections.push("- Return only the final useful answer, without extra preamble.");
    }
    sections.push(`Original task:\n${args.prompt}`);
    return sections.join("\n\n");
}
async function runChildSession(args) {
    const loader = new DefaultResourceLoader({
        cwd: args.ctx.cwd,
        agentDir: getAgentDir(),
        extensionFactories: [args.extensionFactory],
    });
    await loader.reload();
    const createOptions = {
        cwd: args.ctx.cwd,
        sessionManager: args.sessionManager,
        resourceLoader: loader,
        tools: args.toolNames,
    };
    if (args.ctx.model)
        createOptions.model = args.ctx.model;
    const { session } = await createAgentSession(createOptions);
    let text = "";
    let turns = 0;
    let abortedByBudget = false;
    session.subscribe((event) => {
        if (event.type === "message_update" && event.assistantMessageEvent.type === "text_delta") {
            text += event.assistantMessageEvent.delta;
        }
        if (event.type === "message_end" && event.message.role === "assistant") {
            const content = event.message.content;
            if (typeof content === "string")
                text = content;
            else if (Array.isArray(content)) {
                text = content
                    .filter((block) => block.type === "text")
                    .map((block) => block.text)
                    .join("\n");
            }
        }
        if (event.type === "tool_execution_start") {
            args.onProgress?.({
                type: "tool_start",
                childId: args.childId,
                toolName: event.toolName,
            });
        }
        if (event.type === "tool_execution_end") {
            args.onProgress?.({
                type: "tool_end",
                childId: args.childId,
                toolName: event.toolName,
            });
        }
        if (event.type === "turn_end") {
            turns += 1;
            args.onProgress?.({ type: "turn_end", childId: args.childId, turns });
            if (turns >= args.maxTurns) {
                abortedByBudget = true;
                void session.abort();
            }
        }
    });
    try {
        await session.prompt(args.prompt);
    }
    catch (error) {
        if (!abortedByBudget)
            throw error;
    }
    return { text, turns, abortedByBudget };
}
function buildChildArtifact(sessionManager, options) {
    const base = buildChildArtifactFromBranch(sessionManager.getBranch(), {
        childId: options.childId,
        role: options.role || "general",
        depth: options.depth,
        turns: options.turns,
        status: options.status,
    });
    const workspace = options.workspace ?? base.workspace;
    const artifact = {
        ...base,
        id: options.childId,
        childId: options.childId,
        kind: "child-query",
        prompt: options.prompt,
        answer: options.answer,
        producedAt: new Date().toISOString(),
        ...(options.summary ? { summary: options.summary } : {}),
        ...(options.data ? { data: options.data } : {}),
        ...(options.error ? { error: options.error } : {}),
        ...(options.state ? { state: structuredClone(options.state) } : {}),
        ...(workspace === undefined ? {} : { workspace: workspace === null ? null : ensureWorkspaceShape(structuredClone(workspace)) }),
    };
    return artifact;
}
function attachChildArtifact(result, artifact) {
    return {
        ...result,
        __rlmInternal: {
            childArtifact: artifact,
        },
    };
}
export async function runChildQuery(input, ctx, options) {
    const { publicInput, workspace: inputWorkspace } = splitInternalLlmQueryContext(input);
    const normalized = normalizeLlmQueryInput(publicInput);
    const parentWorkspace = inputWorkspace === undefined ? undefined : inputWorkspace === null ? null : ensureWorkspaceShape(inputWorkspace);
    const maxDepth = normalized.budget.maxDepth ?? options.maxDepth;
    if (options.depth > maxDepth) {
        throw new Error(`Max recursion depth reached (${maxDepth})`);
    }
    const childId = createChildId();
    options.onProgress?.({
        type: "start",
        childId,
        role: normalized.role,
        promptPreview: buildPromptPreview(normalized.prompt),
    });
    try {
        const primarySessionManager = SessionManager.inMemory(ctx.cwd);
        seedSessionManager(primarySessionManager, { state: normalized.state, workspace: parentWorkspace });
        const builtInToolNames = resolveBuiltInToolSet(resolveBuiltInToolNames(normalized.tools, options.parentActiveTools));
        const maxTurns = normalized.budget.maxTurns ?? BUDGET_PRESETS.medium.maxTurns;
        const primary = await runChildSession({
            ctx,
            extensionFactory: options.extensionFactory,
            sessionManager: primarySessionManager,
            toolNames: builtInToolNames,
            prompt: buildChildPrompt(normalized, { workspace: parentWorkspace }),
            childId,
            maxTurns,
            onProgress: options.onProgress,
        });
        const parsedPrimary = parseChildResult(primary.text, normalized, primary.turns);
        if (!primary.abortedByBudget || parsedPrimary.ok) {
            if (parsedPrimary.ok) {
                const artifact = buildChildArtifact(primarySessionManager, {
                    childId,
                    role: normalized.role,
                    depth: options.depth,
                    turns: primary.turns,
                    status: "ok",
                    prompt: normalized.prompt,
                    answer: parsedPrimary.answer,
                    summary: parsedPrimary.summary,
                    data: parsedPrimary.data,
                    state: normalized.state,
                });
                options.onProgress?.({
                    type: "end",
                    childId,
                    ok: true,
                    turns: primary.turns,
                    summary: parsedPrimary.summary,
                });
                return attachChildArtifact(parsedPrimary, artifact);
            }
            const artifact = buildChildArtifact(primarySessionManager, {
                childId,
                role: normalized.role,
                depth: options.depth,
                turns: primary.turns,
                status: "error",
                prompt: normalized.prompt,
                answer: parsedPrimary.answer,
                summary: parsedPrimary.summary,
                data: parsedPrimary.data,
                error: parsedPrimary.error,
                state: normalized.state,
            });
            options.onProgress?.({
                type: "error",
                childId,
                error: parsedPrimary.error || "Child query failed",
            });
            return attachChildArtifact(parsedPrimary, artifact);
        }
        const artifact = buildChildArtifact(primarySessionManager, {
            childId,
            role: normalized.role,
            depth: options.depth,
            turns: primary.turns,
            status: "budget_exhausted",
            prompt: normalized.prompt,
            answer: primary.text.trim(),
            summary: primary.text.trim() || parsedPrimary.summary,
            data: parsedPrimary.data,
            error: parsedPrimary.error,
            state: normalized.state,
        });
        const finalizeSessionManager = SessionManager.inMemory(ctx.cwd);
        seedSessionManager(finalizeSessionManager, {
            artifact,
            state: normalized.state,
        });
        const finalize = await runChildSession({
            ctx,
            extensionFactory: options.extensionFactory,
            sessionManager: finalizeSessionManager,
            toolNames: [],
            prompt: buildForcedFinalizePrompt({
                prompt: normalized.prompt,
                artifact,
                outputMode: normalized.output.mode,
                schema: normalized.output.schema,
            }),
            childId,
            maxTurns: 1,
            onProgress: options.onProgress,
        });
        const totalTurns = primary.turns + finalize.turns;
        const parsedFinal = parseChildResult(finalize.text, normalized, totalTurns);
        if (parsedFinal.ok) {
            const finalizedArtifact = buildChildArtifact(finalizeSessionManager, {
                childId,
                role: normalized.role,
                depth: options.depth,
                turns: totalTurns,
                status: "ok",
                prompt: normalized.prompt,
                answer: parsedFinal.answer,
                summary: parsedFinal.summary,
                data: parsedFinal.data,
                state: normalized.state,
            });
            options.onProgress?.({
                type: "end",
                childId,
                ok: true,
                turns: totalTurns,
                summary: parsedFinal.summary,
            });
            return attachChildArtifact(parsedFinal, finalizedArtifact);
        }
        const fallbackAnswer = finalize.text.trim() || artifact.summary || primary.text.trim();
        const errorMessage = `Child query exceeded maxTurns (${maxTurns}) before producing a final answer`;
        const result = {
            ok: false,
            answer: fallbackAnswer,
            summary: fallbackAnswer || undefined,
            role: normalized.role,
            usage: { turns: totalTurns },
            error: errorMessage,
        };
        const finalizedArtifact = buildChildArtifact(finalizeSessionManager, {
            childId,
            role: normalized.role,
            depth: options.depth,
            turns: totalTurns,
            status: finalize.abortedByBudget ? "budget_exhausted" : "error",
            prompt: normalized.prompt,
            answer: fallbackAnswer,
            summary: fallbackAnswer || undefined,
            error: errorMessage,
            state: normalized.state,
        });
        options.onProgress?.({
            type: "error",
            childId,
            error: errorMessage,
        });
        return attachChildArtifact(result, finalizedArtifact);
    }
    catch (error) {
        options.onProgress?.({
            type: "error",
            childId,
            error: error instanceof Error ? error.message : String(error),
        });
        throw error;
    }
}
//# sourceMappingURL=recursion.js.map