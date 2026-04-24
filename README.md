# @suzuuuuu09/remark-file-tree

A Remark plugin that transforms `tree` code blocks into icon-enhanced file tree HTML.

## Installation

```bash
pnpm add @suzuuuuu09/remark-file-tree
```

## Usage

```ts
import { unified } from "unified";
import remarkFileTree from "@suzuuuuu09/remark-file-tree";

const processor = unified().use(remarkFileTree, {
	iconThemeMode: "theme",
});
```

````md
```tree
src/
├── index.ts # entry point
└── features/
```
````

## Styling

The plugin outputs generic class-based markup, so you can style it however you want.

```html
<div class="remark-file-tree">
  <div class="remark-file-tree__content">
    <div class="remark-file-tree__line" data-depth="1" style="--tree-depth:1;">
      <span class="remark-file-tree__icon">
        <span class="remark-file-tree__icon-glyph">…</span>
      </span>
      <span class="remark-file-tree__name">index.ts</span>
      <span class="remark-file-tree__comment">entry point</span>
    </div>
  </div>
</div>
```

### Font requirement (Nerd Fonts)

Icons are rendered as Nerd Font glyphs. For correct icon display, use a Nerd Font in your CSS (for example `Symbols Nerd Font Mono`).

If Nerd Fonts are not available in the user's environment, icons may appear as missing-glyph boxes.

Minimal CSS example:

```css
.remark-file-tree__line {
	padding-left: calc(var(--tree-depth) * 1.25rem);
	display: flex;
	gap: 0.5rem;
}

.remark-file-tree__icon-glyph {
	color: var(--tree-icon-light);
	font-family:
		"Symbols Nerd Font Mono", "JetBrainsMono Nerd Font", "Hack Nerd Font",
		monospace;
}

@media (prefers-color-scheme: dark) {
	.remark-file-tree__icon-glyph {
		color: var(--tree-icon-dark);
	}
}
```

## Options

### `iconThemeMode`

`"theme" | "light" | "dark"` (default: `"theme"`)

- `theme`: uses separate light and dark colors
- `light`: forces light colors
- `dark`: forces dark colors

An invalid value throws a `TypeError`.

## Scripts

```bash
pnpm run check
pnpm run build
pnpm run test
```
