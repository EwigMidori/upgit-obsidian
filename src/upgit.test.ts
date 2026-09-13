import assert from "node:assert/strict";
import { test } from "node:test";
import {
	buildUpgitArgs,
	parseExtraArgs,
	parseUpgitUrl,
	redactSecrets,
} from "./upgit";

test("parseUpgitUrl uses the last http(s) line", () => {
	const stdout = ["ignored", "https://cdn.example/a.png", ""].join("\n");
	assert.equal(parseUpgitUrl(stdout), "https://cdn.example/a.png");
});

test("parseUpgitUrl unwraps markdown output", () => {
	assert.equal(
		parseUpgitUrl("![x](https://cdn.example/a.png)"),
		"https://cdn.example/a.png",
	);
});

test("parseUpgitUrl returns null when empty", () => {
	assert.equal(parseUpgitUrl("\n"), null);
});

test("parseExtraArgs splits on whitespace", () => {
	assert.deepEqual(parseExtraArgs("  --uploader github  "), ["--uploader", "github"]);
	assert.deepEqual(parseExtraArgs(""), []);
});

test("buildUpgitArgs forces stdout url output", () => {
	const args = buildUpgitArgs(
		"C:\\a.png",
		"C:\\upgit",
		["--uploader", "github"],
		true,
	);
	assert.deepEqual(args.slice(0, 7), [
		"C:\\a.png",
		"--output",
		"stdout",
		"--format",
		"url",
		"--application-path",
		"C:\\upgit",
	]);
	assert.equal(args.includes("--clean"), true);
	assert.equal(args.includes("--uploader"), true);
});

test("redactSecrets hides GitHub tokens", () => {
	const hidden = redactSecrets("token ghp_abc123XYZ and github_pat_11AA_bb");
	assert.equal(hidden.includes("ghp_abc123XYZ"), false);
	assert.equal(hidden.includes("github_pat_11AA_bb"), false);
});
