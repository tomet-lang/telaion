<!-- Generated from tmtroot/packages/views.tmt. Edit that, then `tomet export .`. -->

# @telaion/views

Standalone composite views for Tomet and general editing workspaces. These views are self-contained, themeless, and completely decoupled from Tomet engines or document storage.

## Install

```bash
pnpm add @telaion/views
```

Svelte 5 is a peer dependency. Also import the design tokens of `@telaion/theme` once, for example `import "@telaion/theme/tokens.css"`.

## Use

```svelte
<script>
  import { Kanban, TreeExplorer } from "@telaion/views";

  let columns = $state([
    {
      id: "todo",
      title: "To Do",
      items: [{ id: "1", title: "Write documentation" }]
    },
    {
      id: "done",
      title: "Done",
      items: []
    }
  ]);
</script>

<Kanban bind:columns />
```

## Components

- `Kanban` -- Card and column board with drag-and-drop reordering, keyboard accessibility, and custom card templates
- `TreeExplorer` -- Hierarchical file and folder tree navigation with expansion, selection, and keyboard navigation

## License

Licensed under either of MIT or Apache-2.0, at your option.

