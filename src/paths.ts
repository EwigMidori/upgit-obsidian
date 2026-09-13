export function isAbsolutePath(filePath: string): boolean {
	return /^(?:[a-zA-Z]:[\\/]|\\\\|\/)/.test(filePath);
}

export function parentDirectory(filePath: string): string {
	const normalized = filePath.replace(/[/\\]+$/, "");
	const slash = Math.max(normalized.lastIndexOf("/"), normalized.lastIndexOf("\\"));
	if (slash <= 0) {
		return normalized.startsWith("/") ? "/" : ".";
	}
	if (slash === 2 && /^[a-zA-Z]:\\/.test(normalized)) {
		return normalized.slice(0, 3);
	}
	return normalized.slice(0, slash);
}
