export function parseExtraArgs(raw: string): string[] {
	const trimmed = raw.trim();
	if (trimmed.length === 0) {
		return [];
	}
	return trimmed.split(/\s+/);
}

export function buildUpgitArgs(
	filePath: string,
	applicationPath: string | null,
	extraArgs: string[],
	deleteLocalAfterUpload: boolean,
): string[] {
	const args = [filePath, "--output", "stdout", "--format", "url"];
	if (applicationPath !== null) {
		args.push("--application-path", applicationPath);
	}
	args.push(...extraArgs);
	if (deleteLocalAfterUpload && !args.includes("--clean") && !args.includes("-C")) {
		args.push("--clean");
	}
	return args;
}

export function parseUpgitUrl(stdout: string): string | null {
	const lines = stdout
		.split(/\r?\n/)
		.map((line) => line.trim())
		.filter((line) => line.length > 0);

	for (let i = lines.length - 1; i >= 0; i--) {
		const line = lines[i];
		if (line === undefined) {
			continue;
		}
		if (/^https?:\/\//i.test(line)) {
			return line;
		}
		const markdown = line.match(/]\((https?:\/\/[^)\s]+)\)/i);
		const markdownUrl = markdown?.[1];
		if (markdownUrl !== undefined) {
			return markdownUrl;
		}
	}

	return null;
}

export function redactSecrets(text: string): string {
	return text
		.replace(/ghp_[A-Za-z0-9_]+/g, "ghp_***")
		.replace(/github_pat_[A-Za-z0-9_]+/g, "github_pat_***")
		.replace(/gho_[A-Za-z0-9_]+/g, "gho_***");
}
