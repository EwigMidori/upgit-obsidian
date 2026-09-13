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

export class UpgitSettingTab extends PluginSettingTab {
	plugin: UpgitPlugin;

	constructor(app: App, plugin: UpgitPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName("Upgit executable")
			.setDesc(
				"Absolute path to the Upgit binary. Leave empty to use PATH, or E:\\Software\\upgit_win_amd64\\upgit.exe when that file exists.",
			)
			.addText((text) =>
				text
					.setPlaceholder("E:\\Software\\upgit_win_amd64\\upgit.exe")
					.setValue(this.plugin.settings.executablePath)
					.onChange(async (value) => {
						this.plugin.settings.executablePath = value;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName("Extra arguments")
			.setDesc("Optional extra CLI flags, split on whitespace.")
			.addText((text) =>
				text
					.setPlaceholder("--clean")
					.setValue(this.plugin.settings.extraArgs)
					.onChange(async (value) => {
						this.plugin.settings.extraArgs = value;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName("Replace links in the active note")
			.setDesc(
				"After a successful upload, replace the local image in the active Markdown note with the remote URL.",
			)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.replaceInActiveNote)
					.onChange(async (value) => {
						this.plugin.settings.replaceInActiveNote = value;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName("Copy URL to clipboard")
			.setDesc("Copy the uploaded URL after a successful upload.")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.copyUrlToClipboard)
					.onChange(async (value) => {
						this.plugin.settings.copyUrlToClipboard = value;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName("Delete local file after upload")
			.setDesc(
				"Pass --clean to upgit so the local file is deleted after a successful upload. Off by default.",
			)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.deleteLocalAfterUpload)
					.onChange(async (value) => {
						this.plugin.settings.deleteLocalAfterUpload = value;
						await this.plugin.saveSettings();
					}),
			);
	}
}
