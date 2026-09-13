import {
	Editor,
	FileSystemAdapter,
	MarkdownFileInfo,
	MarkdownView,
	Menu,
	Notice,
	Plugin,
	TAbstractFile,
	TFile,
} from "obsidian";
import { isImagePath, isRemoteUrl } from "./image";
import {
	findImageAtCursor,
	findImageRefs,
	pathsPointToSameFile,
	renderImageMarkdown,
	replaceImageRef,
	type ImageRef,
} from "./markdown";
import { resolveUpgitExecutable, uploadWithUpgit, UpgitError } from "./runner";
import {
	DEFAULT_SETTINGS,
	UpgitSettingTab,
	type UpgitSettings,
} from "./settings";

export default class UpgitPlugin extends Plugin {
	settings!: UpgitSettings;

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new UpgitSettingTab(this.app, this));

		this.addCommand({
			id: "upload-image-under-cursor",
			name: "Upload image from the editor",
			editorCheckCallback: (checking, editor, ctx) => {
				const file = this.fileFromCtx(ctx);
				const ref = this.imageRefAtEditor(editor);
				if (ref === null || file === null) {
					return false;
				}
				if (!checking) {
					void this.uploadEditorImage(editor, file, ref);
				}
				return true;
			},
		});

		this.registerEvent(
			this.app.workspace.on("file-menu", (menu, file) => {
				this.addFileMenuItems(menu, [file]);
			}),
		);

		this.registerEvent(
			this.app.workspace.on(
				"files-menu",
				(menu, files: TAbstractFile[]) => {
					this.addFileMenuItems(menu, files);
				},
			),
		);

		this.registerEvent(
			this.app.workspace.on("editor-menu", (menu, editor, ctx) => {
				const file = this.fileFromCtx(ctx);
				const ref = this.imageRefAtEditor(editor);
				if (file === null || ref === null) {
					return;
				}
				menu.addItem((item) => {
					item.setTitle("Upload with upgit")
						.setIcon("upload")
						.onClick(() => {
							void this.uploadEditorImage(editor, file, ref);
						});
				});
			}),
		);
	}

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			(await this.loadData()) as Partial<UpgitSettings>,
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	private addFileMenuItems(menu: Menu, files: TAbstractFile[]) {
		const images = files.filter(
			(file): file is TFile =>
				file instanceof TFile && isImagePath(file.path),
		);
		if (images.length === 0) {
			return;
		}
		const title =
			images.length === 1
				? "Upload with upgit"
				: `Upload ${images.length} images with upgit`;
		menu.addItem((item) => {
			item.setTitle(title)
				.setIcon("upload")
				.onClick(() => {
					void this.uploadVaultFiles(images);
				});
		});
	}

	private fileFromCtx(ctx: MarkdownView | MarkdownFileInfo): TFile | null {
		if (ctx.file instanceof TFile) {
			return ctx.file;
		}
		return this.app.workspace.getActiveFile();
	}

	private imageRefAtEditor(editor: Editor): ImageRef | null {
		const cursor = editor.posToOffset(editor.getCursor());
		return findImageAtCursor(editor.getValue(), cursor);
	}

	private async uploadEditorImage(
		editor: Editor,
		note: TFile,
		ref: ImageRef,
	) {
		if (isRemoteUrl(ref.path)) {
			new Notice("This image is already a remote URL.");
			return;
		}
		const vaultFile = this.app.metadataCache.getFirstLinkpathDest(
			ref.path,
			note.path,
		);
		if (!(vaultFile instanceof TFile) || !isImagePath(vaultFile.path)) {
			new Notice(`Could not find a local image for "${ref.path}".`);
			return;
		}
		const url = await this.uploadOne(vaultFile);
		if (url === null) {
			return;
		}
		if (this.settings.replaceInActiveNote) {
			editor.replaceRange(
				renderImageMarkdown(ref, url),
				editor.offsetToPos(ref.from),
				editor.offsetToPos(ref.to),
			);
		}
		await this.afterSuccess(url);
	}

	private async uploadVaultFiles(files: TFile[]) {
		const urls: string[] = [];
		for (let i = 0; i < files.length; i++) {
			const file = files[i];
			if (file === undefined) {
				continue;
			}
			new Notice(`Uploading ${i + 1}/${files.length}: ${file.name}`);
			const url = await this.uploadOne(file);
			if (url !== null) {
				urls.push(url);
				if (this.settings.replaceInActiveNote) {
					this.replaceInActiveNote(file, url);
				}
			}
		}
		if (urls.length === 1) {
			const only = urls[0];
			if (only !== undefined) {
				await this.afterSuccess(only);
			}
		} else if (urls.length > 1) {
			new Notice(`Uploaded ${urls.length} images.`);
			if (this.settings.copyUrlToClipboard) {
				await navigator.clipboard.writeText(urls.join("\n"));
			}
		}
	}

	private replaceInActiveNote(file: TFile, url: string) {
		const view = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (view === null) {
			return;
		}
		const editor = view.editor;
		const text = editor.getValue();
		const refs = findImageRefs(text).filter((ref) =>
			pathsPointToSameFile(ref.path, file.path, file.name),
		);
		if (refs.length === 0) {
			return;
		}
		let next = text;
		for (let i = refs.length - 1; i >= 0; i--) {
			const ref = refs[i];
			if (ref === undefined) {
				continue;
			}
			next = replaceImageRef(next, ref, url);
		}
		editor.setValue(next);
	}

	private async uploadOne(file: TFile): Promise<string | null> {
		const abs = this.absolutePath(file);
		if (abs === null) {
			new Notice("Upgit needs a local vault on desktop.");
			return null;
		}
		const executable = resolveUpgitExecutable(
			this.settings.executablePath,
		);
		try {
			return await uploadWithUpgit({
				executable,
				filePath: abs,
				extraArgs: this.settings.extraArgs,
				deleteLocalAfterUpload: this.settings.deleteLocalAfterUpload,
			});
		} catch (error) {
			const message =
				error instanceof UpgitError
					? error.message
					: error instanceof Error
						? error.message
						: String(error);
			new Notice(message);
			return null;
		}
	}

	private absolutePath(file: TFile): string | null {
		const adapter = this.app.vault.adapter;
		if (adapter instanceof FileSystemAdapter) {
			return adapter.getFullPath(file.path);
		}
		return null;
	}

	private async afterSuccess(url: string) {
		new Notice(`Uploaded: ${url}`);
		if (this.settings.copyUrlToClipboard) {
			await navigator.clipboard.writeText(url);
		}
	}
}
