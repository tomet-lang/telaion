<script lang="ts">
  import { DocumentSession, Editor } from "@telaion/editor";
  import { onMount } from "svelte";
  import ConfirmDelete from "./ConfirmDelete.svelte";
  import ConfirmUnsaved from "./ConfirmUnsaved.svelte";
  import { MemoryAdapter } from "./memory-adapter.js";
  import ExtensionsDemo from "./ExtensionsDemo.svelte";
  import NewPageDialog from "./NewPageDialog.svelte";
  import ConflictDemo from "./ConflictDemo.svelte";
  import TometHighlightDemo from "./TometHighlightDemo.svelte";
  import preflight from "tailwindcss/preflight.css?inline";
  import {
    Alert,
    Badge,
    Button,
    Field,
    Icon,
    IconButton,
    Input,
    Modal,
    Select,
    Spinner,
    Tabs,
  } from "@telaion/ui";
  import { Check, Plus, Trash, TriangleAlert, X } from "@telaion/ui/icons";

  type Theme = "system" | "light" | "dark";

  let theme = $state<Theme>("system");

  // Conditions of a real application, to see what changes: Tailwind's own reset, as it loads it
  // (inside @layer base), and the wide letter spacing that ordiola uses. Remembered per browser so
  // that the browser tests can run the whole page under them.
  const remembered = (key: string) => {
    try {
      return localStorage.getItem(key) === "1";
    } catch {
      return false;
    }
  };
  let reset = $state(remembered("playground-reset"));
  let spaced = $state(remembered("playground-spaced"));

  $effect(() => {
    document.getElementById("playground-reset")?.remove();
    if (reset) {
      const style = document.createElement("style");
      style.id = "playground-reset";
      style.textContent = `@layer base {\n${preflight}\n}`;
      document.head.append(style);
    }
    try {
      localStorage.setItem("playground-reset", reset ? "1" : "0");
    } catch {}
  });

  $effect(() => {
    document.documentElement.toggleAttribute("data-spaced", spaced);
    try {
      localStorage.setItem("playground-spaced", spaced ? "1" : "0");
    } catch {}
  });
  let clicks = $state(0);

  let modalOpen = $state(false);
  let fullOpen = $state(false);
  let closedCount = $state(0);
  // A modal that can refuse to close, as an editor with unsaved changes does.
  let guardedOpen = $state(false);
  let guarding = $state(true);
  let refused = $state(0);
  let newPath = $state("");

  let alertVisible = $state(true);
  let language = $state("en");
  const languages = [
    { value: "en", label: "English" },
    { value: "ja", label: "日本語" },
  ];

  let tabItems = $state([
    { id: "readme", label: "readme.tmt", closable: true, dirty: true },
    { id: "idea", label: "idea.tmt", closable: true },
    { id: "config", label: "config.tmt" },
  ]);
  let activeTab = $state("readme");
  let closedTab = $state("none");
  function closeTab(id: string) {
    closedTab = id;
    tabItems = tabItems.filter((item) => item.id !== id);
    if (activeTab === id) activeTab = tabItems[0]?.id ?? "";
  }

  const editorPath = "notes/idea.tmt";
  let stored = $state({ saves: 0, last: "" });
  const adapter = new MemoryAdapter({ [editorPath]: "=[ Idea ]\n\nA first line.\n" }, 150, (_path, content) => {
    stored.saves++;
    stored.last = content;
  });
  const session = new DocumentSession(adapter, editorPath);
  let editorReadOnly = $state(false);
  onMount(() => {
    session.load();
  });

  let deleting = $state<{ name: string; is_dir: boolean } | null>(null);
  let closingTab = $state<string | null>(null);
  let outcome = $state("nothing yet");

  let newPageOpen = $state(false);
  let created = $state("");
  let cancelled = $state(0);

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
    "well",
    "canvas",
    "content",
    "action",
    "tint",
    "fg",
    "fg-muted",
    "border",
    "accent",
    "accent-soft",
    "ok",
    "warn",
    "danger",
  ];
</script>

<header class="bar">
  <h1>Telaion playground</h1>
  <div class="conditions">
    <label><input type="checkbox" bind:checked={reset} /> Tailwind reset</label>
    <label><input type="checkbox" bind:checked={spaced} /> Wide letter spacing</label>
  </div>
  <div class="themes" role="group" aria-label="Theme">
    {#each ["system", "light", "dark"] as const as t}
      <button type="button" aria-pressed={theme === t} onclick={() => (theme = t)}>{t}</button>
    {/each}
  </div>
</header>

<main>
  <section>
    <h2>Layers</h2>
    <div class="layer-content">
      <p>Canvas is the ground under this card. The card is content: what is read.</p>
      <div class="layer-well">Well: what is typed into. Cut into the surface, the opposite of a button.</div>
      <div class="layer-row">
        <span>Action: what acts, one above the content it is on.</span>
        <Button variant="primary">Primary</Button>
        <Button>Secondary</Button>
        <Button variant="quiet">Quiet</Button>
      </div>
      <p>Float, the fifth layer, is the Modal below: content lifted in front of the page.</p>
    </div>
  </section>

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
      <Button variant="danger-fill" onclick={() => clicks++}>Delete</Button>
      <Button variant="quiet" onclick={() => clicks++}>
        <Icon icon={Plus} /> New page
      </Button>
      <span class="muted">clicked {clicks} times</span>
    </div>
    <div class="row">
      <Button variant="primary" disabled>Save</Button>
      <Button disabled>Cancel</Button>
      <Button variant="danger" disabled>Delete</Button>
      <Button variant="danger-fill" disabled>Delete</Button>
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
      <Field label="Language">
        <Select bind:value={language} options={languages} />
      </Field>
      <Field label="Read-only">
        <Input value="docs/readme.tmt" disabled />
      </Field>
      <Input type="search" placeholder="Input on its own, without a Field" aria-label="Search" />
      <p class="muted">
        path = <code>{path}</code> · token length = {token.length} · language = <code>{language}</code>
      </p>
    </div>
  </section>

  <section>
    <h2>Editor</h2>
    <div class="row">
      <Button onclick={() => adapter.remoteEdit(editorPath, "=[ Idea ]\n\nSomeone else wrote this.\n")}>
        Simulate a remote change
      </Button>
      <Button onclick={() => (adapter.failNextSave = true)}>Fail the next save</Button>
      <Button onclick={() => (editorReadOnly = !editorReadOnly)}>
        {editorReadOnly ? "Make editable" : "Make read-only"}
      </Button>
      <span class="muted">stored <span aria-label="saves">{stored.saves}</span> times</span>
    </div>
    <div class="editor-frame"><Editor {session} readOnly={editorReadOnly} /></div>
    <pre class="result" aria-label="stored text">{stored.last}</pre>
  </section>

  <section>
    <h2>CodeEditor extensions</h2>
    <ExtensionsDemo />
  </section>

  <section>
    <h2>Tomet highlighting (through TometServices)</h2>
    <TometHighlightDemo />
  </section>

  <section>
    <h2>Conflict resolver (through TometServices)</h2>
    <ConflictDemo />
  </section>

  <section>
    <h2>Tabs</h2>
    <Tabs items={tabItems} bind:value={activeTab} onclose={closeTab} />
    <p class="muted">selected = <code>{activeTab}</code> · last closed = <code>{closedTab}</code></p>
  </section>

  <section>
    <h2>Badge</h2>
    <div class="row">
      <Badge>neutral</Badge>
      <Badge tone="accent">draft</Badge>
      <Badge tone="ok">saved</Badge>
      <Badge tone="warn">conflict</Badge>
      <Badge tone="danger">failed</Badge>
    </div>
  </section>

  <section>
    <h2>Alert</h2>
    <div class="stack">
      <Alert tone="info">Telaion is a frame; the look comes from the tokens.</Alert>
      <Alert tone="ok">Saved to the repository.</Alert>
      <Alert tone="warn">The remote changed since you started editing.</Alert>
      {#if alertVisible}
        <Alert tone="danger" onDismiss={() => (alertVisible = false)}>
          Could not save: the token has no write permission.
        </Alert>
      {:else}
        <Button onclick={() => (alertVisible = true)}>Show the dismissed alert again</Button>
      {/if}
    </div>
  </section>

  <section>
    <h2>Spinner</h2>
    <div class="row">
      <Spinner />
      <span class="muted">Loading document from GitHub...</span>
    </div>
  </section>

  <section>
    <h2>Trial: the wiki New Page dialog, rebuilt on Telaion</h2>
    <div class="row">
      <Button variant="primary" onclick={() => (newPageOpen = true)}>Open the New Page dialog</Button>
      <span class="muted">cancelled {cancelled} times</span>
    </div>
    {#if created}<pre class="result" aria-label="created">{created}</pre>{/if}
  </section>

  <section>
    <h2>Trial: the ordiola confirmations, rebuilt on Telaion</h2>
    <div class="row">
      <Button onclick={() => (deleting = { name: "idea.tmt", is_dir: false })}>Delete a file</Button>
      <Button onclick={() => (deleting = { name: "drafts", is_dir: true })}>Delete a folder</Button>
      <Button onclick={() => (closingTab = "readme.tmt")}>Close an unsaved tab</Button>
    </div>
    <p class="muted">outcome: <span aria-label="outcome">{outcome}</span></p>
  </section>

  <section>
    <h2>Modal</h2>
    <div class="row">
      <Button variant="primary" onclick={() => (modalOpen = true)}>Open modal</Button>
      <Button onclick={() => (fullOpen = true)}>Open full-screen</Button>
      <Button onclick={() => (guardedOpen = true)}>Open guarded modal</Button>
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

{#if deleting}
  <ConfirmDelete
    entry={deleting}
    onConfirm={() => {
      outcome = "deleted " + deleting!.name;
      deleting = null;
    }}
    onCancel={() => {
      outcome = "delete cancelled";
      deleting = null;
    }}
  />
{/if}

{#if closingTab}
  <ConfirmUnsaved
    title={closingTab}
    onSave={() => {
      outcome = "saved and closed " + closingTab;
      closingTab = null;
    }}
    onDiscard={() => {
      outcome = "discarded " + closingTab;
      closingTab = null;
    }}
    onCancel={() => {
      outcome = "close cancelled";
      closingTab = null;
    }}
  />
{/if}

{#if newPageOpen}
  <NewPageDialog
    onCreate={(newPath, content) => {
      created = newPath + "\n---\n" + content;
      newPageOpen = false;
    }}
    onCancel={() => {
      cancelled++;
      newPageOpen = false;
    }}
  />
{/if}

<Modal bind:open={modalOpen} title="New page" onclose={() => closedCount++}>
  <Field label="Path" hint="Relative to the vault root.">
    <Input bind:value={newPath} autofocus placeholder="notes/idea.tmt" />
  </Field>
  {#snippet footer()}
    <Button onclick={() => (modalOpen = false)}>Cancel</Button>
    <Button variant="primary" onclick={() => (modalOpen = false)}>Create</Button>
  {/snippet}
</Modal>

<Modal
  bind:open={guardedOpen}
  title="Unsaved work"
  size="sm"
  onclose={() => closedCount++}
  onrequestclose={() => {
    if (!guarding) return;
    refused++;
    return false;
  }}
>
  <p>Closing is refused while the guard is on. <span class="muted">refused <span aria-label="refused">{refused}</span> times</span></p>
  {#snippet footer()}
    <Button onclick={() => (guarding = !guarding)}>{guarding ? "Lift the guard" : "Put the guard back"}</Button>
    <Button variant="primary" onclick={() => (guardedOpen = false)}>Close from the application</Button>
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
    background: var(--tln-content);
    box-shadow: var(--tln-shadow-content);
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

  .conditions {
    display: flex;
    gap: calc(var(--tln-space) * 4);
    margin-left: auto;
    font-size: var(--tln-text-sm);
  }

  .conditions label {
    display: inline-flex;
    align-items: center;
    gap: calc(var(--tln-space) * 2);
    cursor: pointer;
  }

  .themes {
    display: flex;
    gap: var(--tln-space);
  }

  .themes button {
    font: inherit;
    font-size: var(--tln-text-sm);
    padding: var(--tln-space) calc(var(--tln-space) * 3);
    background: var(--tln-action);
    color: var(--tln-fg);
    border: 1px solid transparent;
    border-radius: var(--tln-radius);
    box-shadow: var(--tln-shadow-action);
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

  .editor-frame {
    height: calc(var(--tln-space) * 80);
    margin-bottom: calc(var(--tln-space) * 3);
  }

  .result {
    margin: 0;
    padding: calc(var(--tln-space) * 3);
    font-family: var(--tln-font-mono);
    font-size: var(--tln-text-sm);
    background: var(--tln-well);
    border-radius: var(--tln-radius);
    box-shadow: var(--tln-shadow-well);
    white-space: pre-wrap;
  }

  .layer-content {
    display: grid;
    gap: calc(var(--tln-space) * 4);
    padding: calc(var(--tln-space) * 5);
    background: var(--tln-content);
    border-radius: var(--tln-radius);
    box-shadow: var(--tln-shadow-content);
  }

  .layer-content p {
    margin: 0;
  }

  .layer-well {
    padding: calc(var(--tln-space) * 3);
    font-size: var(--tln-text-sm);
    color: var(--tln-fg-muted);
    background: var(--tln-well);
    border-radius: var(--tln-radius);
    box-shadow: var(--tln-shadow-well);
  }

  .layer-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: calc(var(--tln-space) * 3);
  }

  .stack {
    display: grid;
    gap: calc(var(--tln-space) * 3);
    max-width: 560px;
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
