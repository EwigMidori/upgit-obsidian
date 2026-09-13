import assert from "node:assert/strict";
import { test } from "node:test";
import {
	findImageAtCursor,
	pathsPointToSameFile,
	replaceImageRef,
} from "./markdown";

const note = [
	"# Title",
	"",
	"See ![[Pasted image 1.png]] here.",
	"And ![alt](folder/pic.jpg) too.",
	'<img src="other.webp">',
].join("\n");

test("findImageAtCursor detects a wikilink image", () => {
	const cursor = note.indexOf("Pasted") + 3;
	const ref = findImageAtCursor(note, cursor);
	assert.ok(ref);
	assert.equal(ref.kind, "wiki");
	assert.equal(ref.path, "Pasted image 1.png");
});

test("findImageAtCursor detects a markdown image", () => {
	const cursor = note.indexOf("folder/pic");
	const ref = findImageAtCursor(note, cursor);
	assert.ok(ref);
	assert.equal(ref.kind, "md");
	assert.equal(ref.path, "folder/pic.jpg");
	assert.equal(ref.alt, "alt");
});

test("replaceImageRef turns a wikilink into a markdown URL", () => {
	const ref = findImageAtCursor(note, note.indexOf("Pasted") + 1);
	assert.ok(ref);
	const next = replaceImageRef(note, ref, "https://cdn.example/a.png");
	assert.equal(next.includes("![](https://cdn.example/a.png)"), true);
	assert.equal(next.includes("![[Pasted image 1.png]]"), false);
});

test("pathsPointToSameFile matches filename and vault path", () => {
	assert.equal(
		pathsPointToSameFile("Pasted image 1.png", "img/Pasted image 1.png", "Pasted image 1.png"),
		true,
	);
	assert.equal(
		pathsPointToSameFile("img/Pasted%20image%201.png", "img/Pasted image 1.png", "Pasted image 1.png"),
		true,
	);
	assert.equal(
		pathsPointToSameFile("other.png", "img/Pasted image 1.png", "Pasted image 1.png"),
		false,
	);
});
