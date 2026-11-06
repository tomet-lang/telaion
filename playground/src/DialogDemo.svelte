<script lang="ts">
  // The dialogs that are built on Modal: Modal's own options, ConfirmDialog and CommandPalette.
  // (Modal's plain states, guarded and full-screen, are in the Modal section of App.svelte.)
  import {
    Button,
    CommandPalette,
    ConfirmDialog,
    Kbd,
    Modal,
    type PaletteItem,
  } from "@telaion/primitives";
  import { File, FileText, Moon, Palette, Settings, Terminal } from "@telaion/primitives/icons";

  let outcome = $state("none");
  // How often the destructive dialog reported a cancel: it must be once, however it was dismissed.
  let cancels = $state(0);

  // Modal's options.
  let untitledOpen = $state(false);
  let topOpen = $state(false);
  let wideOpen = $state(false);

  // ConfirmDialog, in each of its states.
  let infoOpen = $state(false);
  let okOpen = $state(false);
  let warnOpen = $state(false);
  let deleteOpen = $state(false);
  let richOpen = $state(false);
  let unsavedOpen = $state(false);
  let longOpen = $state(false);

  // CommandPalette: the application filters; the palette only shows and drives.
  interface Entry extends PaletteItem {
    path?: string;
  }
  const entries: Entry[] = [
    { id: "readme", label: "readme.tmt", detail: "docs/readme.tmt", icon: FileText },
    { id: "idea", label: "idea.tmt", detail: "notes/idea.tmt", icon: FileText },
    { id: "config", label: "config.toml", detail: "config.toml", icon: Settings },
    { id: "locked", label: "secrets.tmt", detail: "Locked by another person", icon: File, disabled: true },
    { id: "theme", label: "Switch to dark theme", hint: "Ctrl+K T", icon: Moon },
    { id: "colors", label: "Show design tokens", icon: Palette },
    { id: "term", label: "Open a terminal in this folder", hint: "Ctrl+`", icon: Terminal },
    ...Array.from({ length: 24 }, (_, n) => ({
      id: `note-${n}`,
      label: `note-${String(n + 1).padStart(2, "0")}.tmt`,
      detail: `notes/archive/note-${String(n + 1).padStart(2, "0")}.tmt`,
      icon: FileText,
    })),
  ];
  let paletteOpen = $state(false);
  let query = $state("");
  const shown = $derived(
    entries.filter((entry) => `${entry.label} ${entry.detail ?? ""}`.toLowerCase().includes(query.trim().toLowerCase())),
  );
</script>

<div class="row">
  <Button onclick={() => (untitledOpen = true)}>Modal without a title</Button>
  <Button onclick={() => (topOpen = true)}>Modal at the top</Button>
  <Button onclick={() => (wideOpen = true)}>Modal, lg</Button>
</div>
<div class="row">
  <Button onclick={() => (infoOpen = true)}>Confirm: info</Button>
  <Button onclick={() => (okOpen = true)}>Confirm: ok</Button>
  <Button onclick={() => (warnOpen = true)}>Confirm: warn</Button>
  <Button onclick={() => (deleteOpen = true)}>Confirm: destructive</Button>
  <Button onclick={() => (richOpen = true)}>Confirm: snippet message</Button>
  <Button onclick={() => (unsavedOpen = true)}>Confirm: three answers</Button>
  <Button onclick={() => (longOpen = true)}>Confirm: long name</Button>
</div>
<div class="row">
  <Button variant="primary" onclick={() => (paletteOpen = true)}>Open the command palette</Button>
  <span class="muted">dialog outcome: <span aria-label="dialog outcome">{outcome}</span>, delete cancels: <span aria-label="delete cancels">{cancels}</span></span>
</div>

<Modal bind:open={untitledOpen} title="Preview" hideTitle size="sm">
  <p>A modal with no header. Its title, "Preview", is only its accessible name. Escape or the backdrop closes it.</p>
</Modal>

<Modal bind:open={topOpen} title="At the top" placement="top">
  <p>The box hangs near the top edge instead of the middle.</p>
  {#snippet footer()}
    <Button onclick={() => (topOpen = false)}>Close</Button>
  {/snippet}
</Modal>

<Modal bind:open={wideOpen} title="Wide" size="lg" closeButton={false}>
  <p>The lg size, and no close button in the header.</p>
  {#snippet footer()}
    <Button onclick={() => (wideOpen = false)}>Done</Button>
  {/snippet}
</Modal>

<ConfirmDialog
  bind:open={infoOpen}
  title="Reload the page?"
  message="The page changed on disk since you opened it. Reloading shows the new version."
  confirm="Reload"
  onconfirm={() => (outcome = "reloaded")}
  oncancel={() => (outcome = "reload cancelled")}
/>

<ConfirmDialog
  bind:open={okOpen}
  title="Publish"
  tone="ok"
  message="All checks passed. Publish the page now?"
  confirm="Publish"
  onconfirm={() => (outcome = "published")}
  oncancel={() => (outcome = "publish cancelled")}
/>

<ConfirmDialog
  bind:open={warnOpen}
  title="Leave without saving?"
  tone="warn"
  message="You have edits that are not saved yet."
  confirm="Leave"
  onconfirm={() => (outcome = "left")}
  oncancel={() => (outcome = "leave cancelled")}
/>

<ConfirmDialog
  bind:open={deleteOpen}
  title="Delete file"
  destructive
  message="Delete idea.tmt? This cannot be undone."
  confirm="Delete"
  onconfirm={() => (outcome = "deleted")}
  oncancel={() => {
    cancels++;
    outcome = "delete cancelled";
  }}
/>

{#snippet folderMessage()}
  <p class="para">Delete <code>drafts</code> and everything in it?</p>
  <p class="para muted">All files and subfolders are removed for good.</p>
{/snippet}
<ConfirmDialog
  bind:open={richOpen}
  title="Delete folder"
  destructive
  message={folderMessage}
  confirm="Delete folder"
  onconfirm={() => (outcome = "folder deleted")}
  oncancel={() => (outcome = "folder delete cancelled")}
/>

<ConfirmDialog
  bind:open={unsavedOpen}
  title="Unsaved changes"
  tone="warn"
  message="Save the changes to readme.tmt before closing?"
  confirm="Save"
  alternative="Don't save"
  alternativeVariant="danger"
  onconfirm={() => (outcome = "saved")}
  onalternative={() => (outcome = "discarded")}
  oncancel={() => (outcome = "close cancelled")}
/>

<ConfirmDialog
  bind:open={longOpen}
  title="Delete file"
  destructive
  message="Delete notes/archive/2024/a-very-long-name-without-any-place-to-break-it-at-all-so-the-line-has-to-give.tmt?"
  confirm="Delete"
  onconfirm={() => (outcome = "long deleted")}
  oncancel={() => (outcome = "long cancelled")}
/>

<CommandPalette
  bind:open={paletteOpen}
  bind:query
  items={shown}
  label="Quick open"
  placeholder="Search files and commands"
  empty="Nothing matches"
  onselect={(item) => (outcome = `selected ${item.id}`)}
>
  {#snippet footer()}
    <span><Kbd keys={["↑"]} /> <Kbd keys={["↓"]} /> move</span>
    <span><Kbd keys={["Enter"]} /> open</span>
    <span><Kbd keys={["Esc"]} /> close</span>
    <span class="count">{shown.length} items</span>
  {/snippet}
</CommandPalette>

<style>
  .row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: calc(var(--tln-space) * 2);
    margin-bottom: calc(var(--tln-space) * 2);
  }

  .muted {
    color: var(--tln-fg-muted);
  }

  .para {
    margin: 0;
  }

  code {
    font-family: var(--tln-font-mono);
  }

  .count {
    margin-left: auto;
  }
</style>
