import type { Code, Html, Root } from "mdast";
import type { Plugin } from "unified";
import { visit } from "unist-util-visit";
import { getFileTreeIcon } from "./icons";

export type FileTreeIconThemeMode = "theme" | "light" | "dark";

export type RemarkFileTreeOptions = {
	iconThemeMode?: FileTreeIconThemeMode;
};

const escapeHtml = (value: string): string =>
	value
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&#39;");

const FILE_TREE_ICON_THEME_MODES = new Set<FileTreeIconThemeMode>([
	"theme",
	"light",
	"dark",
]);

const resolveIconThemeMode = (
	iconThemeMode: RemarkFileTreeOptions["iconThemeMode"],
): FileTreeIconThemeMode => {
	if (iconThemeMode === undefined) {
		return "theme";
	}

	if (FILE_TREE_ICON_THEME_MODES.has(iconThemeMode)) {
		return iconThemeMode;
	}

	throw new TypeError(
		`Invalid iconThemeMode: "${String(iconThemeMode)}". Expected "theme", "light", or "dark".`,
	);
};

const resolveIconColors = (
	lightColor: string,
	darkColor: string,
	iconThemeMode: FileTreeIconThemeMode,
) => {
	if (iconThemeMode === "light") {
		return { lightColor, darkColor: lightColor };
	}
	if (iconThemeMode === "dark") {
		return { lightColor: darkColor, darkColor };
	}
	return { lightColor, darkColor };
};

const getIconNerdFont = (
	fileName: string,
	iconThemeMode: FileTreeIconThemeMode,
	isOpenDirectory = false,
): string => {
	const icon = getFileTreeIcon(fileName, isOpenDirectory);
	const colors = resolveIconColors(
		icon.lightColor,
		icon.darkColor,
		iconThemeMode,
	);
	return `<span class="tree-icon remark-file-tree__icon-glyph" style="--tree-icon-light:${colors.lightColor};--tree-icon-dark:${colors.darkColor};">${icon.text}</span>`;
};

const getTreeDepth = (prefix: string): number => {
	const normalizedPrefix = prefix.replace(/\t/g, "    ");
	const ancestorDepth = normalizedPrefix.match(/(?:│ {3}| {4})/g)?.length ?? 0;
	const currentBranchDepth = /[├└]/.test(normalizedPrefix) ? 1 : 0;
	return ancestorDepth + currentBranchDepth;
};

const remarkFileTree: Plugin<[RemarkFileTreeOptions?], Root> = (
	options = {},
) => {
	const iconThemeMode = resolveIconThemeMode(options.iconThemeMode);

	return (tree) => {
		visit(tree, "code", (node: Code, index, parent) => {
			if (node.lang !== "tree" || typeof index !== "number" || !parent) {
				return;
			}

			const lines = node.value.trim().split("\n");

			const treeHtml = lines
				.map((line, i) => {
					const match = new RegExp(/^([│\s├└─\t]+)/).exec(line);
					const prefix = match ? match[0] : "";
					const depth = getTreeDepth(prefix);
					const contentPart = line.replace(/^[│\s├└─\t]+/, "");
					const [namePart, ...commentParts] = contentPart.split("#");
					const comment = commentParts.join("#").trim();
					const fileName = (namePart ?? "").trim();

					if (!fileName) return "";

					const isDirectory = fileName.endsWith("/");
					let isOpenDirectory = false;

					if (isDirectory) {
						const nextLine = lines[i + 1];
						if (nextLine) {
							const nextPrefixMatch = new RegExp(/^([│\s├└─\t]+)/).exec(
								nextLine,
							);
							const nextPrefix = nextPrefixMatch
								? nextPrefixMatch[0].replace(/\t/g, "  ")
								: "";
							if (nextPrefix.length > prefix.replace(/\t/g, "  ").length) {
								isOpenDirectory = true;
							}
						}
					}

					const icon = getIconNerdFont(
						fileName,
						iconThemeMode,
						isOpenDirectory,
					);

					return `
<div class="tree-line remark-file-tree__line" data-depth="${depth}" style="--tree-depth:${depth};">
  <span class="tree-icon-wrapper remark-file-tree__icon">${icon}</span>
  <span class="tree-name remark-file-tree__name">${escapeHtml(fileName)}</span>
  ${comment ? `<span class="tree-comment remark-file-tree__comment">${escapeHtml(comment)}</span>` : ""}
</div>`.trim();
				})
				.filter(Boolean)
				.join("");

			const containerHtml: Html = {
				type: "html",
				value: `<div class="file-tree-container remark-file-tree">
  <div class="file-tree-content remark-file-tree__content">
    ${treeHtml}
  </div>
</div>`,
			};

			parent.children[index] = containerHtml;
		});
	};
};

export default remarkFileTree;
