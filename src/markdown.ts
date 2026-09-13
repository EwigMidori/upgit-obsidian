export type ImageRefKind = "wiki" | "md" | "html";

export interface ImageRef {
	from: number;
	to: number;
	path: string;
	kind: ImageRefKind;
	alt: string;
}

const WIKI_IMAGE = /!\[\[([^\]|#]+)(?:#[^\]|]*)?(?:\|([^\]]*))?\]\]/g;
const MD_IMAGE = /!\[([^\]]*)\]\(\s*<?([^>\s)]+)>?\s*\)/g;
const HTML_IMAGE = /<img\b[^>]*?\bsrc\s*=\s*["']([^"']+)["'][^>]*>/gi;

function collect(regex: RegExp, text: string, kind: ImageRefKind): ImageRef[] {
	const refs: ImageRef[] = [];
	regex.lastIndex = 0;
	let match: RegExpExecArray | null = regex.exec(text);
	while (match !== null) {
		const from = match.index;
		const to = from + match[0].length;
		if (kind === "wiki") {
			const path = match[1]?.trim() ?? "";
			const alt = match[2]?.trim() ?? "";
			if (path.length > 0) {
				refs.push({ from, to, path, kind, alt });
			}
		} else if (kind === "md") {
			const alt = match[1] ?? "";
			const path = match[2]?.trim() ?? "";
			if (path.length > 0) {
				refs.push({ from, to, path, kind, alt });
			}
		} else {
			const path = match[1]?.trim() ?? "";
			if (path.length > 0) {
				refs.push({ from, to, path, kind, alt: "" });
			}
		}
		match = regex.exec(text);
	}
	return refs;
}

export function findImageRefs(text: string): ImageRef[] {
	return [
		...collect(WIKI_IMAGE, text, "wiki"),
		...collect(MD_IMAGE, text, "md"),
		...collect(HTML_IMAGE, text, "html"),
	].sort((a, b) => a.from - b.from || a.to - b.to);
}

export function findImageAtCursor(text: string, cursor: number): ImageRef | null {
	const containing = findImageRefs(text).filter(
		(ref) => cursor >= ref.from && cursor <= ref.to,
	);
	if (containing.length === 0) {
		return null;
	}
	containing.sort((a, b) => a.to - a.from - (b.to - b.from));
	return containing[0] ?? null;
}

export function renderImageMarkdown(ref: ImageRef, url: string): string {
	if (ref.kind === "html") {
		return `<img src="${url}">`;
	}
	const alt = ref.alt.length > 0 ? ref.alt : "";
	return `![${alt}](${url})`;
}

export function replaceImageRef(text: string, ref: ImageRef, url: string): string {
	return text.slice(0, ref.from) + renderImageMarkdown(ref, url) + text.slice(ref.to);
}

export function pathsPointToSameFile(
	refPath: string,
	vaultPath: string,
	fileName: string,
): boolean {
	const normalizedRef = normalizeLinkPath(refPath);
	const normalizedVault = normalizeLinkPath(vaultPath);
	const normalizedName = normalizeLinkPath(fileName);
	return (
		normalizedRef === normalizedVault ||
		normalizedRef === normalizedName ||
		normalizedVault.endsWith("/" + normalizedRef)
	);
}

export function normalizeLinkPath(path: string): string {
	let value = path.trim().replace(/\\/g, "/");
	try {
		value = decodeURIComponent(value);
	} catch {
		// Keep the original path if it is not URI-encoded.
	}
	if (value.startsWith("./")) {
		value = value.slice(2);
	}
	return value;
}
