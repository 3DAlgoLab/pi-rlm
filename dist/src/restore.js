import { ensureWorkspaceShape } from "./workspace.js";
export const RLM_RUNTIME_TYPE = "rlm-runtime";
export const RLM_WORKSPACE_TYPE = "rlm-workspace";
function workspaceFromUnknown(value) {
	if (value === null) return null;
	if (value && typeof value === "object" && !Array.isArray(value)) return ensureWorkspaceShape(value);
	return undefined;
}
export function getSessionRuntimeKey(ctx) {
	return ctx.sessionManager.getSessionId();
}
export function findLatestSnapshotInBranch(branch) {
	for (let i = branch.length - 1; i >= 0; i--) {
		const entry = branch[i];
		if (entry?.type === "message") {
			const message = entry.message;
			if (message?.role !== "toolResult") continue;
			if (message.toolName !== "rlm_exec" && message.toolName !== "rlm_reset") continue;
			const details = message.details;
			if (details?.snapshot) return details.snapshot;
		}
		if (entry?.type === "custom" && entry.customType === RLM_RUNTIME_TYPE) {
			const data = entry.data;
			if (data?.snapshot) return data.snapshot;
		}
	}
	return undefined;
}
export function findLatestSnapshot(ctx) {
	return findLatestSnapshotInBranch(ctx.sessionManager.getBranch());
}
export function findLatestWorkspaceInBranch(branch) {
	for (let i = branch.length - 1; i >= 0; i--) {
		const entry = branch[i];
		if (entry?.type !== "custom" || entry.customType !== RLM_WORKSPACE_TYPE) continue;
		const data = entry.data;
		return workspaceFromUnknown(data?.workspace);
	}
	return undefined;
}
export function findLatestWorkspace(ctx) {
	return findLatestWorkspaceInBranch(ctx.sessionManager.getBranch());
}
export function buildChildArtifactFromBranch(branch, options) {
	const snapshot = findLatestSnapshotInBranch(branch);
	const latestWorkspace = findLatestWorkspaceInBranch(branch);
	const workspace = latestWorkspace ?? workspaceFromUnknown(snapshot?.bindings?.workspace);
	return {
		version: 1,
		childId: options.childId,
		role: options.role,
		depth: options.depth,
		turns: options.turns,
		status: options.status,
		...(snapshot ? { snapshot } : {}),
		...(workspace === undefined ? {} : { workspace }),
	};
}
export function composeRuntimeSnapshot(snapshot, workspace) {
	const next = snapshot ? structuredClone(snapshot) : { version: 1, bindings: {}, entries: [] };
	if (workspace === null) {
		delete next.bindings.workspace;
		return next;
	}
	if (workspace && typeof workspace === "object") {
		next.bindings.workspace = structuredClone(workspace);
	}
	return next;
}
export function findBootstrapSnapshot(ctx) {
	const branch = ctx.sessionManager.getBranch();
	for (let i = branch.length - 1; i >= 0; i--) {
		const entry = branch[i];
		if (entry.type !== "custom" || entry.customType !== "rlm-child-bootstrap") continue;
		const data = entry.data;
		if (!data?.state) return undefined;
		return {
			version: 1,
			bindings: {
				input: data.state,
				parentState: data.state,
			},
			entries: [],
		};
	}
	return undefined;
}
//# sourceMappingURL=restore.js.map
