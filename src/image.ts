export const IMAGE_EXTENSIONS = new Set([
	"avif",
	"bmp",
	"gif",
	"ico",
	"jpeg",
	"jpg",
	"png",
	"svg",
	"tif",
	"tiff",
	"webp",
]);

export function fileExtension(path: string): string {
	const base = path.split(/[\\/]/).pop() ?? "";
	const withoutQuery = (base.split("?")[0] ?? "").split("#")[0] ?? "";
	const dot = withoutQuery.lastIndexOf(".");
	if (dot <= 0) {
		return "";
	}
	return withoutQuery.slice(dot + 1).toLowerCase();
}

export function isImagePath(path: string): boolean {
	return IMAGE_EXTENSIONS.has(fileExtension(path));
}

export function isRemoteUrl(path: string): boolean {
	return /^(https?:)?\/\//i.test(path.trim());
}
