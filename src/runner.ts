import { spawn } from "child_process";
import { dirname, isAbsolute } from "path";
import { existsSync, statSync } from "fs";
import { buildUpgitArgs, parseExtraArgs, parseUpgitUrl, redactSecrets } from "./upgit";

const WINDOWS_DEFAULT = "E:\\Software\\upgit_win_amd64\\upgit.exe";

export class UpgitError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "UpgitError";
	}
}

export function resolveUpgitExecutable(configuredPath: string): string {
	const trimmed = configuredPath.trim();
	if (trimmed.length > 0) {
		return trimmed;
	}
	if (existsSync(WINDOWS_DEFAULT) && statSync(WINDOWS_DEFAULT).isFile()) {
		return WINDOWS_DEFAULT;
	}
	return process.platform === "win32" ? "upgit.exe" : "upgit";
}

export function applicationPathFor(executable: string): string | null {
	if (!isAbsolute(executable)) {
		return null;
	}
	return dirname(executable);
}

export function uploadWithUpgit(options: {
	executable: string;
	filePath: string;
	extraArgs: string;
	deleteLocalAfterUpload: boolean;
}): Promise<string> {
	const executable = options.executable;
	const applicationPath = applicationPathFor(executable);

	const extra = parseExtraArgs(options.extraArgs);
	const args = buildUpgitArgs(
		options.filePath,
		applicationPath,
		extra,
		options.deleteLocalAfterUpload,
	);

	return new Promise((resolve, reject) => {
		let stdout = "";
		let stderr = "";
		let settled = false;

		const child = spawn(executable, args, {
			windowsHide: true,
		});

		child.stdout.on("data", (chunk: Buffer | string) => {
			stdout += chunk.toString();
		});
		child.stderr.on("data", (chunk: Buffer | string) => {
			stderr += chunk.toString();
		});
		child.on("error", (error: Error) => {
			if (settled) {
				return;
			}
			settled = true;
			reject(
				new UpgitError(
					`Failed to start Upgit (${executable}): ${error.message}`,
				),
			);
		});
		child.on("close", (code) => {
			if (settled) {
				return;
			}
			settled = true;
			const url = parseUpgitUrl(stdout);
			if (code === 0 && url !== null) {
				resolve(url);
				return;
			}
			const detail = redactSecrets((stderr || stdout).trim());
			if (code !== 0) {
				reject(
					new UpgitError(
						detail.length > 0
							? `Upgit exited with code ${code}: ${detail}`
							: `Upgit exited with code ${code}.`,
					),
				);
				return;
			}
			reject(
				new UpgitError(
					detail.length > 0
						? `Upgit did not print a URL. Output: ${detail}`
						: "Upgit did not print a URL.",
				),
			);
		});
	});
}
