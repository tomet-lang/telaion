<!-- Generated from tmtroot/packages/primitives.tmt. Edit that, then `tomet export .`. -->

# @telaion/primitives

Themeless Svelte 5 primitives and design tokens for Tomet editors. It knows nothing about Tomet.

## Install

```bash
pnpm add @telaion/primitives
```

Svelte 5 is a peer dependency.

## Use

```svelte
<script>
  import "@telaion/theme/tokens.css";
  import { Button, Field, Icon, Input } from "@telaion/primitives";
  import { Plus } from "@telaion/primitives/icons";

  let name = $state("");
</script>

<Field label="Name" hint="Shown in the sidebar.">
  <Input bind:value={name} />
</Field>
<Button variant="primary"><Icon icon={Plus} /> Add</Button>
```

## Components

- `Button`, `IconButton`, `Input`, `Select`, `Field`
- `Modal`, `Tabs`, `Badge`, `Alert`, `Spinner`
- `Icon`

## Closing a Modal

A `Modal` closes on Escape, on its close button, and on a click on the backdrop. To ask first, for example about unsaved changes, pass `onrequestclose` and return `false` to refuse. It is asked before every close the person starts, and not when the application closes the modal by setting `open` itself.

```svelte
<Modal bind:open title="Editor" onrequestclose={() => !dirty || confirm("Close without saving?")}>
  ...
</Modal>
```

## Theming

Every color, font and size is a CSS custom property with the prefix `--tln-`, defined in `@telaion/theme`. Light and dark follow the operating system; set `data-theme="light"` or `data-theme="dark"` on any element to override it for that subtree. An application changes the look by overriding token values, not by styling components: the components accept neither `class` nor `style`.

## Icons

Each Lucide icon is its own export of `@telaion/primitives/icons`, so a bundler keeps only the icons that are imported. Pass the icon itself to `Icon`: `<Icon icon={Plus} />`. The icons are from Lucide (ISC license, see `vendor/lucide/LICENSE`).

## License

Licensed under either of MIT or Apache-2.0, at your option.

