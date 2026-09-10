<p align="center">
  <img src="https://raw.githubusercontent.com/3DAlgoLab/pi-rlm/main/assets/turtle.svg" alt="Fractal LLM turtle logo" width="160" />
</p>

# pi-turtle-rlm

**Recursive language model runtime for [Pi](https://github.com/earendil-works/pi)** — a persistent JS workspace inside the agent, with structured child calls via `llmQuery`, prompt modes, and session stats.

> **[Turtles all the way down](https://arxiv.org/abs/2512.24601)** — each turtle is an `llmQuery` call, each shell is `globalThis`, base case `maxDepth`, or just run out of tokens.

[![License](https://img.shields.io/badge/License-Apache--2.0-blue.svg)](./LICENSE)

## Install

**From git** (see [Pi packages](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/packages.md)):

```bash
pi install git:github.com/3DAlgoLab/pi-rlm
```

Pin a tag:

```bash
pi install git:github.com/3DAlgoLab/pi-rlm@v0.2.2
```

**From a local clone** (contributors or vendoring):

```bash
git clone https://github.com/3DAlgoLab/pi-rlm.git
cd pi-rlm
npm install
npm run build
pi install ./
# or one-off during development: pi -e ./index.ts
```

**Project-local Pi config** (`.pi/settings.json` or `pi install -l`):

```json
{
	"packages": ["git:github.com/3DAlgoLab/pi-rlm"]
}
```

After install, start Pi as usual from your repo; the extension loads from Pi’s package resolution. Use `/reload` after upgrading the package.

## Quick start

1. Turn RLM on: `/rlm`
2. Same command takes subcommands:
   - `/rlm balanced` | `/rlm coordinator` | `/rlm aggressive` — prompt mode
   - `/rlm inspect` — runtime globals
   - `/rlm reset` — clear runtime
   - prompt modes explained in [Prompt modes](./docs/prompt-modes.md) — what each mode does, how to switch, and how the choice persists

Or enable it from the CLI for one-shot runs. Pass the flag **after** the prompt, or with an explicit value — Pi's CLI otherwise consumes the next token as the flag's value:

```bash
pi -p --rlm-enabled=true "prompt"
pi -p "prompt" --rlm-enabled
```

When RLM is on you get a pink **RLM MODE** widget (with mode label) and footer stats: depth, `rlm_exec` count, child queries / turns, runtime variable count, and non-RLM tool calls (“leaf” count).

## Why RLM?

Large refactors need more room for context than a single chat transcript. This extension gives the model a persistent workspace to keep intermediate state, recurse with `llmQuery`, and avoid re-deriving the same context over and over.

## Tools

- `rlm_exec` — run JS in the persistent runtime
- `rlm_inspect` — inspect runtime globals
- `rlm_reset` — clear the runtime

Inside `rlm_exec` you can use:

- `inspectGlobals()`
- `final(value)`
- `await llmQuery(request)`

## Use in an extension

```ts
import rlmExtension from "pi-turtle-rlm";

export default rlmExtension;
```

Or configure defaults:

```ts
import { createRlmExtension } from "pi-turtle-rlm";

export default createRlmExtension({
	maxDepth: 3,
	promptMode: "coordinator",
});
```

## Safety

The worker uses `node:vm` with several globals stripped. It is **not** a security sandbox — treat it like running code in your user account.

## Advanced runtime usage

Inside `rlm_exec`, the runtime also exposes `llmQuery(...)` for recursive child calls.

```ts
await llmQuery({
	prompt: "Analyze the auth module",
	state: { files: globalThis.authFiles },
	tools: "read-only",
	budget: "medium",
});
```

## Inspiration

This project is inspired in part by AxLLM’s RLM ideas.

## Development

```bash
git clone https://github.com/3DAlgoLab/pi-rlm.git
cd pi-rlm
npm install
npm test
npm run build
npm run smoke
```

Install-time build: `dist/` is not committed. `pi install git:...` runs `npm install --omit=dev`, whose `prepare` step transpiles the sources with `tsc --noCheck` (types are erased; pi resolves the `@earendil-works/*` imports itself at runtime). For local work, `npm run build` / `npm run typecheck` give you the full type-checked output.

## License

Apache-2.0 — see [LICENSE](./LICENSE).
