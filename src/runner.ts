import { chunkToString, platformName, spawnProcess } from "./node-host";
import { isAbsolutePath, parentDirectory } from "./paths";
import { buildUpgitArgs, parseExtraArgs, parseUpgitUrl, redactSecrets } from "./upgit";

const WINDOWS_DEFAULT = "E:\\Software\\upgit_win_amd64\\upgit.exe";

export class UpgitError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "UpgitError";
	}
}

export function candidateExecutables(configuredPath: string): string[] {
	const trimmed = configuredPath.trim();
	if (trimmed.length > 0) {
		return [trimmed];
	}
	if (platformName() === "win32") {
		return [WINDOWS_DEFAULT, "upgit.exe"];
	}
	return ["upgit"];
}

export function applicationPathFor(executable: string): string | null {
	if (!isAbsolutePath(executable)) {
		return null;
	}
	return parentDirectory(executable);
}

export async function uploadWithUpgit(options: {
	configuredPath: string;
	filePath: string;
	extraArgs: string;
	deleteLocalAfterUpload: boolean;
}): Promise<string> {
	const extra = parseExtraArgs(options.extraArgs);
	const executables = candidateExecutables(options.configuredPath);
	let lastFailure: Error | null = null;
	for (const executable of executables) {
		const args = buildUpgitArgs(
			options.filePath,
			applicationPathFor(executable),
			extra,
			options.deleteLocalAfterUpload,
		);
		try {
			return await runUpgit(executable, args);
		} catch (failure) {
			lastFailure =
				failure instanceof Error ? failure : new Error(String(failure));
		}
	}
	throw lastFailure ?? new UpgitError("No Upgit executable found.");
}

function runUpgit(executable: string, args: readonly string[]): Promise<string> {
	return new Promise((resolve, reject) => {
		let stdout = "";
		let stderr = "";
		let settled = false;

		const child = spawnProcess(executable, args);

		const finish = (result: Error | string) => {
			if (settled) {
				return;
			}
			settled = true;
			if (typeof result === "string") {
				resolve(result);
				return;
			}
			reject(result);
		};

		child.stdout?.on("data", (chunk) => {
			stdout += chunkToString(chunk);
		});
		child.stderr?.on("data", (chunk) => {
			stderr += chunkToString(chunk);
		});
		child.on("error", (err) => {
			finish(
				new UpgitError(
					`Failed to start Upgit (${executable}): ${err.message}`,
				),
			);
		});
		child.on("close", (code) => {
			const url = parseUpgitUrl(stdout);
			if (code === 0 && url !== null) {
				finish(url);
				return;
			}
			const detail = redactSecrets((stderr || stdout).trim());
			if (code !== 0) {
				finish(
					new UpgitError(
						detail.length > 0
							? `Upgit exited with code ${String(code)}: ${detail}`
							: `Upgit exited with code ${String(code)}.`,
					),
				);
				return;
			}
			finish(
				new UpgitError(
					detail.length > 0
						? `Upgit did not print a URL. Output: ${detail}`
						: "Upgit did not print a URL.",
				),
			);
		});
	});
}
