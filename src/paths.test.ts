import assert from "node:assert/strict";
import { test } from "node:test";
import { isAbsolutePath, parentDirectory } from "./paths";

test("isAbsolutePath recognizes Windows and POSIX roots", () => {
	assert.equal(isAbsolutePath("E:\\Software\\upgit.exe"), true);
	assert.equal(isAbsolutePath("/usr/local/bin/upgit"), true);
	assert.equal(isAbsolutePath("upgit.exe"), false);
	assert.equal(isAbsolutePath("./upgit"), false);
});

test("parentDirectory keeps the drive root", () => {
	assert.equal(parentDirectory("E:\\Software\\upgit.exe"), "E:\\Software");
	assert.equal(parentDirectory("/usr/local/bin/upgit"), "/usr/local/bin");
	assert.equal(parentDirectory("upgit.exe"), ".");
});
