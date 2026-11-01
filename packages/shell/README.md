<!-- Generated from tmtroot/packages/shell.tmt. Edit that, then `tomet export .`. -->

# @telaion/shell

Workspace frame and pane split system for Tomet editors. It carries the structure for multi-pane layouts, resizable splits, and workspace shells.

## Install

```bash
pnpm add @telaion/shell
```

Svelte 5 is a peer dependency. Also import the design tokens of `@telaion/primitives` once, for example `import "@telaion/primitives/tokens.css"`.

## Use

```svelte
<script>
  import { SplitPane } from "@telaion/shell";

  let sidebarRatio = $state(0.25);
</script>

<SplitPane direction="horizontal" bind:ratio={sidebarRatio} min={0.15} max={0.85}>
  {#snippet primary()}
    <div>Sidebar</div>
  {/snippet}
  {#snippet secondary()}
    <div>Main content</div>
  {/snippet}
</SplitPane>
```

## Components

- `SplitPane` -- Two-pane resizable split (horizontal or vertical) with drag bar and keyboard accessibility
- `PaneGroup`, `Pane`, `PaneResizer` -- Flexible multi-pane layouts

## License

Licensed under either of MIT or Apache-2.0, at your option.

