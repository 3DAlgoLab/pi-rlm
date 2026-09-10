# Prompt Modes

Prompt modes control how strongly the extension steers the agent to use the RLM runtime. When RLM is active, the extension appends a mode-specific section to the agent's system prompt (`src/prompt-mode.ts`, injected via `before_agent_start`). The active mode is shown in the pink **RLM MODE** widget and the footer status line (e.g. `BALANCED`, `COORDINATOR`, `AGGRESSIVE`).

The three modes form a strictness ladder — each mode includes everything the previous one says.

| Mode                 | Stance                                                                                                                                                                |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `balanced` (default) | RLM guidance is advisory. The model uses `rlm_exec` when it makes sense for multi-file or multi-step work.                                                            |
| `coordinator`        | Advisory + mandatory workspace structure. The model is required to keep structured state and treat prompt metadata as an index into runtime state.                    |
| `aggressive`         | Coordinator + default-on workspace policy. The RLM workspace is the default working set for any multi-step task, with pre-work and post-work checks on child queries. |

## What each mode adds

### `balanced` (default)

- Use `rlm_exec` as the persistent coordinator workspace for multi-file or multi-step tasks.
- Keep durable state in `globalThis.workspace` and `globalThis.workspace.activeContext`; short-lived scratch values go elsewhere.
- Child `llmQuery` artifacts live under `globalThis.workspace.childArtifacts` — review and reuse them before repeating child analysis.
- Use direct Pi tools as leaf actions, then return to the workspace to update state.

No enforced section layout and no mandatory pre-work.

### `coordinator`

Everything in `balanced`, plus:

- Track `goal`, `plan`, `files`, `findings`, `openQuestions`, `partialOutputs`, `childArtifacts`, and `activeContext` in `globalThis.workspace` when helpful.
- Treat prompt metadata as an **index** to runtime state, not a replacement for it.
- Inspect `globalThis.workspace.activeContext` first when you need the current working set.

### `aggressive`

Everything in `coordinator`, plus:

- Use the coordinator workspace as the **default** workspace for any multi-step task.
- Before launching new child work, review `globalThis.workspace.childArtifacts` and reuse or consolidate what is already known.
- After child work, consolidate the important parts into `workspace.findings` or `workspace.partialOutputs`.
- Batch related child work into fewer, larger `llmQuery` calls; avoid many tiny calls.

## How to switch

**During a session** (root agent only) via `/rlm` subcommands:

```text
/rlm                 # toggle RLM mode on/off
/rlm balanced        # set balanced mode
/rlm coordinator     # set coordinator mode
/rlm aggressive      # set aggressive mode
/rlm inspect         # inspect runtime globals
/rlm reset           # clear the runtime
```

The new mode takes effect from the next turn.

**In code** via the extension option, which sets the starting default:

```ts
import { createRlmExtension } from "pi-turtle-rlm";

export default createRlmExtension({
	promptMode: "coordinator",
});
```

There is no CLI flag for the mode; only `--rlm-enabled` exists.

## Persistence

- The active mode is stored in the session file as a custom entry (`rlm-prompt-mode`) each time you switch it with `/rlm`.
- It is restored on session start, session switch, tree, and fork — so the mode you set survives `/resume` and session switches within the same session.
- It does **not** carry over to new sessions. A fresh session starts with the `promptMode` option if given, otherwise `balanced`.

## Scope

- The mode section is appended to the system prompt of every RLM instance, so child sessions spawned by `llmQuery` inherit the mode that was active when they were created (children cannot switch it themselves; the `/rlm` command is only available to the root agent).
- The mode only changes what the model is told to do. It does not change tool availability, runtime behavior, `llmQuery` parameters, or stats.

## Source

Implementation and full prompt text: [`src/prompt-mode.ts`](../src/prompt-mode.ts). Default is `balanced` (`DEFAULT_RLM_PROMPT_MODE`).
