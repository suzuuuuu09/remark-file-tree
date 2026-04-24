import assert from "node:assert/strict";
import test from "node:test";
import remarkFileTree from "../dist/index.js";

const createTree = (value) => ({
	type: "root",
	children: [{ type: "code", lang: "tree", value }],
});

const transformAndReadHtml = (plugin, tree) => {
	plugin(tree);
	return tree.children[0];
};

test("transforms tree code block into file tree HTML", () => {
	const tree = createTree(`src/
├── index.ts # entry point
└── features/`);

	const transformedNode = transformAndReadHtml(remarkFileTree(), tree);

	assert.equal(transformedNode.type, "html");
	assert.match(transformedNode.value, /remark-file-tree/);
	assert.match(transformedNode.value, /remark-file-tree__line/);
	assert.match(transformedNode.value, /data-depth="1"/);
	assert.match(
		transformedNode.value,
		/tree-comment remark-file-tree__comment">entry point/,
	);
	assert.doesNotMatch(transformedNode.value, /PROJECT STRUCTURE/);
});

test("uses light colors for both variables in light mode", () => {
	const tree = createTree("index.ts");

	const transformedNode = transformAndReadHtml(
		remarkFileTree({ iconThemeMode: "light" }),
		tree,
	);

	assert.match(
		transformedNode.value,
		/--tree-icon-light:#36677c;--tree-icon-dark:#36677c;/,
	);
});

test("uses dark colors for both variables in dark mode", () => {
	const tree = createTree("index.ts");

	const transformedNode = transformAndReadHtml(
		remarkFileTree({ iconThemeMode: "dark" }),
		tree,
	);

	assert.match(
		transformedNode.value,
		/--tree-icon-light:#519aba;--tree-icon-dark:#519aba;/,
	);
});

test("throws a clear error for invalid iconThemeMode values", () => {
	assert.throws(
		() => remarkFileTree({ iconThemeMode: /** @type {any} */ ("invalid") }),
		(error) =>
			error instanceof TypeError &&
			error.message.includes("Invalid iconThemeMode"),
	);
});

test("escapes file and comment text in rendered HTML", () => {
	const tree = createTree(`<x>.ts # comment <unsafe> & "quoted"`);
	const transformedNode = transformAndReadHtml(remarkFileTree(), tree);

	assert.match(transformedNode.value, /&lt;x&gt;\.ts/);
	assert.match(
		transformedNode.value,
		/comment &lt;unsafe&gt; &amp; &quot;quoted&quot;/,
	);
});

test("keeps nested directories under their parent depth", () => {
	const tree = createTree(`src/
├── typst/
│   └── main.typ
└── java/
    └── Main.java`);
	const transformedNode = transformAndReadHtml(remarkFileTree(), tree);

	assert.match(
		transformedNode.value,
		/typst\/[\s\S]*?data-depth="2" style="--tree-depth:2;"[\s\S]*?main\.typ/,
	);
	assert.match(
		transformedNode.value,
		/java\/[\s\S]*?data-depth="2" style="--tree-depth:2;"[\s\S]*?Main\.java/,
	);
});

test("parses ASCII tree prefixes as nested depth", () => {
	const tree = createTree(`src/
|-- typst/
|   \`-- main.typ
\`-- java/
    \`-- HelloWorld.java`);
	const transformedNode = transformAndReadHtml(remarkFileTree(), tree);

	assert.match(
		transformedNode.value,
		/data-depth="1" style="--tree-depth:1;"[\s\S]*?typst\//,
	);
	assert.match(
		transformedNode.value,
		/typst\/[\s\S]*?data-depth="2" style="--tree-depth:2;"[\s\S]*?main\.typ/,
	);
	assert.match(
		transformedNode.value,
		/data-depth="1" style="--tree-depth:1;"[\s\S]*?java\//,
	);
	assert.match(
		transformedNode.value,
		/java\/[\s\S]*?data-depth="2" style="--tree-depth:2;"[\s\S]*?HelloWorld\.java/,
	);
});
