type DataListener = (chunk: Uint8Array | string) => void;

export interface SpawnedProcess {
	stdout: { on(event: "data", listener: DataListener): void } | null;
	stderr: { on(event: "data", listener: DataListener): void } | null;
	on(event: "error", listener: (err: { message: string }) => void): void;
	on(event: "close", listener: (code: number | null) => void): void;
}

type SpawnFn = (
	command: string,
	args: readonly string[],
	options: { windowsHide: boolean },
) => SpawnedProcess;

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

function nodeRequire(moduleId: string): unknown {
	const req = (window as unknown as { require?: (id: string) => unknown })
		.require;
	if (typeof req !== "function") {
		throw new Error("This plugin requires the Obsidian desktop app.");
	}
	return req(moduleId);
}

export function spawnProcess(
	command: string,
	args: readonly string[],
): SpawnedProcess {
	const loaded = nodeRequire("child_process");
	if (!isRecord(loaded) || typeof loaded.spawn !== "function") {
		throw new Error("child_process.spawn is not available.");
	}
	const spawn = loaded.spawn as SpawnFn;
	return spawn(command, args, { windowsHide: true });
}

export function platformName(): string {
	const proc = (window as unknown as { process?: unknown }).process;
	if (isRecord(proc) && typeof proc.platform === "string") {
		return proc.platform;
	}
	return "";
}

export function chunkToString(chunk: Uint8Array | string): string {
	if (typeof chunk === "string") {
		return chunk;
	}
	return new TextDecoder().decode(chunk);
}
