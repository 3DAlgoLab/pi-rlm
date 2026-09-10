export function parseRlmCommandAction(input) {
	const value = input.trim().toLowerCase();
	if (!value) return { type: "toggle" };
	if (value === "balanced" || value === "coordinator" || value === "aggressive") {
		return { type: "set-mode", mode: value };
	}
	if (value === "inspect") return { type: "inspect" };
	if (value === "reset") return { type: "reset" };
	return { type: "invalid", value };
}
//# sourceMappingURL=rlm-command.js.map
