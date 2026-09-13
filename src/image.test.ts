import assert from "node:assert/strict";
import { test } from "node:test";
import { fileExtension, isImagePath, isRemoteUrl } from "./image";

test("fileExtension reads the last extension", () => {
	assert.equal(fileExtension("Pasted image.png"), "png");
	assert.equal(fileExtension("folder/pic.JPEG"), "jpeg");
	assert.equal(fileExtension("C:\\\\tmp\\\\a.webp"), "webp");
});

test("isImagePath accepts common image types", () => {
	assert.equal(isImagePath("a.png"), true);
	assert.equal(isImagePath("a.md"), false);
	assert.equal(isImagePath("noext"), false);
});

test("isRemoteUrl detects http(s) links", () => {
	assert.equal(isRemoteUrl("https://example.com/a.png"), true);
	assert.equal(isRemoteUrl("//cdn.example.com/a.png"), true);
	assert.equal(isRemoteUrl("Pasted image.png"), false);
});
