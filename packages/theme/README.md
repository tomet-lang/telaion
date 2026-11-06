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

Every token is a utility, named after it with the `tln-` prefix (`--tln-fg-muted` is `text-tln-fg-muted`; the shadows are `shadow-tln-*`, the radius `rounded-tln`, the fonts `font-tln-sans` and `font-tln-mono`, the sizes `text-tln-xs`, `text-tln-sm` and `text-tln-md`). The utilities read the token itself, so a subtree with `data-theme` or an overridden token keeps working. Tailwind's own color palette, shadows, radii and font families are emptied, so a class such as `bg-stone-800`, `shadow-lg` or `rounded-md` does not exist: the tokens are the only ones. Layout, box sizes, weights and arbitrary values are untouched. Two utilities are more than a value: `outline-tln-focus`, the focus outline of every control, and `transition-tln`, the transition of the design, off for a person who asks for less motion.

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

