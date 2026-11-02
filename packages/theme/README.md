<!-- Generated from tmtroot/packages/theme.tmt. Edit that, then `tomet export .`. -->

# @telaion/theme

Design tokens, layer semantics, physical shadow models, and Tailwind preset for Tomet and Telaion editors.

## Install

```bash
pnpm add @telaion/theme
```

## Use

### Design tokens

Import `tokens.css` into your root stylesheet or application entry point:

```css
@import "@telaion/theme/tokens.css";
```

### Tailwind CSS (v4)

If using Tailwind CSS v4, also import `tailwind.css` to enable `@theme` mappings (such as `bg-tln-canvas`, `text-tln-fg`, `border-tln-border`, etc.):

```css
@import "tailwindcss";
@import "@telaion/theme/tokens.css";
@import "@telaion/theme/tailwind.css";
```

### TypeScript utilities

```ts
import { applyTheme, getEffectiveTheme } from "@telaion/theme";

// Switch between "system", "light", and "dark"
applyTheme(document.documentElement, "dark");
```

## Five Layers

- `well` -- What is typed into (inputs, CodeMirror editors). Inward shadow.
- `canvas` -- Ground surface. No shadow.
- `content` -- What is read (cards, sidebars). Outward content shadow.
- `action` -- What acts (buttons, tabs). One layer above what holds it.
- `float` -- What floats above the page (modals, dialogs, popovers). Scrim and float shadow.

## License

Licensed under either of MIT or Apache-2.0, at your option.

