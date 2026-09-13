import { App, PluginSettingTab, Setting } from "obsidian";
import type UpgitPlugin from "./main";

export interface UpgitSettings {
	executablePath: string;
	extraArgs: string;
	replaceInActiveNote: boolean;
	copyUrlToClipboard: boolean;
	deleteLocalAfterUpload: boolean;
}

export const DEFAULT_SETTINGS: UpgitSettings = {
	executablePath: "",
	extraArgs: "",
	replaceInActiveNote: true,
	copyUrlToClipboard: true,
	deleteLocalAfterUpload: false,
};

interface SettingDefinition {
	name: string;
	desc?: string;
	control: {
		type: "text" | "toggle";
		key: keyof UpgitSettings;
		placeholder?: string;
	};
}

export class UpgitSettingTab extends PluginSettingTab {
	plugin: UpgitPlugin;

	constructor(app: App, plugin: UpgitPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	getSettingDefinitions(): SettingDefinition[] {
		return [
			{
				name: "Upgit executable",
				desc: "Absolute path to the Upgit binary. Leave empty to use PATH, or E:\\Software\\upgit_win_amd64\\upgit.exe when that file exists.",
				control: {
					type: "text",
					key: "executablePath",
					placeholder: "E:\\Software\\upgit_win_amd64\\upgit.exe",
				},
			},
			{
				name: "Extra arguments",
				desc: "Optional extra CLI flags, split on whitespace.",
				control: {
					type: "text",
					key: "extraArgs",
					placeholder: "--clean",
				},
			},
			{
				name: "Replace links in the active note",
				desc: "After a successful upload, replace the local image in the active Markdown note with the remote URL.",
				control: {
					type: "toggle",
					key: "replaceInActiveNote",
				},
			},
			{
				name: "Copy URL to clipboard",
				desc: "Copy the uploaded URL after a successful upload.",
				control: {
					type: "toggle",
					key: "copyUrlToClipboard",
				},
			},
			{
				name: "Delete local file after upload",
				desc: "Pass --clean to upgit so the local file is deleted after a successful upload. Off by default.",
				control: {
					type: "toggle",
					key: "deleteLocalAfterUpload",
				},
			},
		];
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		for (const definition of this.getSettingDefinitions()) {
			this.renderDefinition(definition);
		}
	}

	private renderDefinition(definition: SettingDefinition): void {
		const setting = new Setting(this.containerEl)
			.setName(definition.name)
			.setDesc(definition.desc ?? "");
		const key = definition.control.key;

		if (definition.control.type === "text") {
			const placeholder = definition.control.placeholder ?? "";
			const textKey = key as "executablePath" | "extraArgs";
			setting.addText((text) =>
				text
					.setPlaceholder(placeholder)
					.setValue(this.plugin.settings[textKey])
					.onChange(async (value) => {
						this.plugin.settings[textKey] = value;
						await this.plugin.saveSettings();
					}),
			);
			return;
		}

		const toggleKey = key as
			| "replaceInActiveNote"
			| "copyUrlToClipboard"
			| "deleteLocalAfterUpload";
		setting.addToggle((toggle) =>
			toggle
				.setValue(this.plugin.settings[toggleKey])
				.onChange(async (value) => {
					this.plugin.settings[toggleKey] = value;
					await this.plugin.saveSettings();
				}),
		);
	}
}
