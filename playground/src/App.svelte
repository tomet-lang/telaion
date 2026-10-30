<script lang="ts">
  import { Button, Field, Icon, IconButton, Input, Modal } from "@telaion/ui";
  import { Check, Plus, Trash, TriangleAlert, X } from "@telaion/ui/icons";

  type Theme = "system" | "light" | "dark";

  let theme = $state<Theme>("system");
  let clicks = $state(0);

  let modalOpen = $state(false);
  let fullOpen = $state(false);
  let closedCount = $state(0);
  let newPath = $state("");

  let path = $state("notes/idea.tmt");
  let token = $state("");
  // A path must end in .tmt; the error appears as soon as the value is wrong.
  const pathError = $derived(path.endsWith(".tmt") ? undefined : "The path must end with .tmt");

  // data-theme on <html> overrides the operating system; removing it follows the system again.
  $effect(() => {
    const root = document.documentElement;
    if (theme === "system") root.removeAttribute("data-theme");
    else root.setAttribute("data-theme", theme);
  });

  const swatches = [
    "bg",
    "bg-subtle",
    "bg-sunken",
    "fg",
    "fg-muted",
    "border",
    "border-strong",
    "accent",
    "accent-soft",
    "ok",
    "warn",
    "danger",
  ];
</script>

<header class="bar">
  <h1>Telaion playground</h1>
  <div class="themes" role="group" aria-label="Theme">
    {#each ["system", "light", "dark"] as const as t}
      <button type="button" aria-pressed={theme === t} onclick={() => (theme = t)}>{t}</button>
    {/each}
  </div>
</header>

<main>
  <section>
    <h2>Tokens</h2>
    <div class="swatches">
      {#each swatches as name}
        <div class="swatch">
          <i style:background="var(--tln-{name})"></i>
          <span>{name}</span>
        </div>
      {/each}
    </div>
  </section>

  <section>
    <h2>Button</h2>
    <div class="row">
      <Button variant="primary" onclick={() => clicks++}>Save</Button>
      <Button onclick={() => clicks++}>Cancel</Button>
      <Button variant="danger" onclick={() => clicks++}>
        <Icon icon={Trash} /> Delete
      </Button>
      <Button variant="quiet" onclick={() => clicks++}>
        <Icon icon={Plus} /> New page
      </Button>
      <span class="muted">clicked {clicks} times</span>
    </div>
    <div class="row">
      <Button variant="primary" disabled>Save</Button>
      <Button disabled>Cancel</Button>
      <Button variant="danger" disabled>Delete</Button>
      <Button variant="quiet" disabled>New page</Button>
      <span class="muted">disabled</span>
    </div>
  </section>

  <section>
    <h2>Field and Input</h2>
    <div class="form">
      <Field label="Path" hint="Relative to the vault root." error={pathError}>
        <Input bind:value={path} placeholder="notes/idea.tmt" />
      </Field>
      <Field label="Personal access token" hint="Needs repository content write permission.">
        <Input type="password" bind:value={token} placeholder="ghp_..." />
      </Field>
      <Field label="Read-only">
        <Input value="docs/readme.tmt" disabled />
      </Field>
      <Input type="search" placeholder="Input on its own, without a Field" aria-label="Search" />
      <p class="muted">path = <code>{path}</code> · token length = {token.length}</p>
    </div>
  </section>

  <section>
    <h2>Modal</h2>
    <div class="row">
      <Button variant="primary" onclick={() => (modalOpen = true)}>Open modal</Button>
      <Button onclick={() => (fullOpen = true)}>Open full-screen</Button>
      <span class="muted">closed {closedCount} times</span>
    </div>
  </section>

  <section>
    <h2>IconButton</h2>
    <div class="row">
      <IconButton icon={X} label="Close" />
      <IconButton icon={Plus} label="Add" variant="secondary" />
      <IconButton icon={Trash} label="Delete" disabled />
    </div>
  </section>

  <section>
    <h2>Icon</h2>
    <div class="row">
      <span class="sample"><Icon icon={X} label="Close" /> decorative off, labelled</span>
      <span class="sample"><Icon icon={Check} /> decorative</span>
      <span class="sample" style:color="var(--tln-warn)"><Icon icon={TriangleAlert} /> follows the text color</span>
    </div>
  </section>
</main>

<Modal bind:open={modalOpen} title="New page" onclose={() => closedCount++}>
  <Field label="Path" hint="Relative to the vault root.">
    <Input bind:value={newPath} autofocus placeholder="notes/idea.tmt" />
  </Field>
  {#snippet footer()}
    <Button onclick={() => (modalOpen = false)}>Cancel</Button>
    <Button variant="primary" onclick={() => (modalOpen = false)}>Create</Button>
  {/snippet}
</Modal>

<Modal bind:open={fullOpen} title="Editor" size="full" onclose={() => closedCount++}>
  <p>A full-screen modal, like the editing overlay of the wiki.</p>
</Modal>

<style>
  .bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: calc(var(--tln-space) * 4);
    padding: calc(var(--tln-space) * 3) calc(var(--tln-space) * 6);
    background: var(--tln-bg-subtle);
    border-bottom: 1px solid var(--tln-border);
  }

  h1 {
    margin: 0;
    font-size: var(--tln-text-md);
  }

  h2 {
    margin: 0 0 calc(var(--tln-space) * 3);
    font-size: var(--tln-text-sm);
    color: var(--tln-fg-muted);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  main {
    display: grid;
    gap: calc(var(--tln-space) * 8);
    padding: calc(var(--tln-space) * 6);
    max-width: 960px;
  }

  .themes {
    display: flex;
    gap: var(--tln-space);
  }

  .themes button {
    font: inherit;
    font-size: var(--tln-text-sm);
    padding: var(--tln-space) calc(var(--tln-space) * 3);
    background: var(--tln-bg);
    color: var(--tln-fg);
    border: 1px solid var(--tln-border-strong);
    border-radius: var(--tln-radius);
    cursor: pointer;
  }

  .themes button[aria-pressed="true"] {
    background: var(--tln-accent);
    color: var(--tln-accent-fg);
    border-color: var(--tln-accent);
  }

  .swatches {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
    gap: calc(var(--tln-space) * 2);
  }

  .swatch {
    border: 1px solid var(--tln-border);
    border-radius: var(--tln-radius);
    overflow: hidden;
    font-size: var(--tln-text-xs);
  }

  .swatch i {
    display: block;
    height: 32px;
  }

  .swatch span {
    display: block;
    padding: var(--tln-space) calc(var(--tln-space) * 2);
    color: var(--tln-fg-muted);
  }

  .row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: calc(var(--tln-space) * 3);
    margin-bottom: calc(var(--tln-space) * 3);
  }

  .form {
    display: grid;
    gap: calc(var(--tln-space) * 4);
    max-width: 420px;
  }

  code {
    font-family: var(--tln-font-mono);
  }

  .muted {
    color: var(--tln-fg-muted);
    font-size: var(--tln-text-sm);
  }

  .sample {
    display: inline-flex;
    align-items: center;
    gap: calc(var(--tln-space) * 2);
  }
</style>
