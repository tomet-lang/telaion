<script lang="ts">
  import { Button, IconButton } from "@telaion/primitives";
  import {
    ChevronDown,
    Code,
    FilePlus,
    Lightbulb,
    OctagonX,
    Plus,
    RefreshCw,
    Rocket,
    Save,
    Trash,
    TriangleAlert,
    X,
  } from "@telaion/primitives/icons";

  const variants = ["primary", "secondary", "danger", "danger-fill", "quiet"] as const;
  const tones = ["accent", "ok", "warn", "danger"] as const;

  let inserted = $state("nothing yet");
</script>

<div class="demo">
  <h3>Variants by size</h3>
  <div class="card" aria-label="sizes">
    {#each ["md", "sm"] as const as size}
      <div class="row">
        {#each variants as variant}
          <Button {variant} {size}>{variant}</Button>
        {/each}
        <Button variant="soft" {size}>soft</Button>
        <span class="muted">{size}</span>
      </div>
      <div class="row">
        {#each variants as variant}
          <Button {variant} {size} disabled>{variant}</Button>
        {/each}
        <Button variant="soft" {size} disabled>soft</Button>
        <span class="muted">{size}, disabled</span>
      </div>
    {/each}
  </div>

  <h3>Icons</h3>
  <div class="card" aria-label="icons">
    <div class="row">
      <Button variant="primary" icon={Save}>Save</Button>
      <Button icon={Plus}>New page</Button>
      <Button iconEnd={ChevronDown}>Vault</Button>
      <Button icon={FilePlus} iconEnd={ChevronDown}>Both</Button>
      <Button variant="danger" icon={Trash}>Delete</Button>
      <Button variant="quiet" icon={RefreshCw}>Reload</Button>
      <Button variant="soft" tone="ok" icon={Save}>Soft</Button>
      <Button icon={Save} disabled>Disabled</Button>
    </div>
    <div class="row">
      <Button size="sm" variant="primary" icon={Save}>Save</Button>
      <Button size="sm" icon={Plus}>New page</Button>
      <Button size="sm" iconEnd={ChevronDown}>Vault</Button>
      <Button size="sm" icon={FilePlus} iconEnd={ChevronDown}>Both</Button>
      <Button size="sm" variant="danger" icon={Trash}>Delete</Button>
      <Button size="sm" variant="quiet" icon={RefreshCw}>Reload</Button>
      <Button size="sm" variant="soft" tone="ok" icon={Save}>Soft</Button>
      <Button size="sm" icon={Save} disabled>Disabled</Button>
    </div>
  </div>

  <h3>Soft tones</h3>
  <div class="card" aria-label="insert bar">
    <div class="row">
      <span class="muted">Insert block:</span>
      <Button size="sm" variant="soft" tone="accent" icon={Lightbulb} onclick={() => (inserted = "note")}>Note</Button>
      <Button size="sm" variant="soft" tone="ok" icon={Rocket} onclick={() => (inserted = "tip")}>Tip</Button>
      <Button size="sm" variant="soft" tone="warn" icon={TriangleAlert} onclick={() => (inserted = "warning")}>
        Warning
      </Button>
      <Button size="sm" variant="soft" tone="danger" icon={OctagonX} onclick={() => (inserted = "danger")}>Danger</Button>
      <Button size="sm" icon={Code} onclick={() => (inserted = "code")}>Code block</Button>
      <span class="muted">inserted: <span aria-label="inserted">{inserted}</span></span>
    </div>
    <div class="row">
      {#each tones as tone}
        <Button variant="soft" {tone} icon={Lightbulb}>{tone}</Button>
      {/each}
      <Button variant="soft">no tone</Button>
      {#each tones as tone}
        <Button variant="soft" {tone} disabled>{tone}</Button>
      {/each}
    </div>
  </div>

  <h3>IconButton</h3>
  <div class="card" aria-label="icon buttons">
    {#each ["md", "sm"] as const as size}
      <div class="row">
        <IconButton icon={RefreshCw} label="Reload (quiet)" {size} />
        <IconButton icon={Plus} label="Add (secondary)" variant="secondary" {size} />
        {#each tones as tone}
          <IconButton icon={X} label="Remove ({tone})" variant="soft" {tone} {size} />
        {/each}
        <IconButton icon={RefreshCw} label="Reload (disabled)" {size} disabled />
        <IconButton icon={Plus} label="Add (disabled)" variant="secondary" {size} disabled />
        <span class="muted">{size}</span>
      </div>
    {/each}
  </div>
</div>

<style>
  .demo {
    display: grid;
    gap: calc(var(--tln-space) * 3);
  }

  h3 {
    margin: 0;
    font-size: var(--tln-text-sm);
    color: var(--tln-fg-muted);
  }

  /* A surface that only holds controls is content. */
  .card {
    display: grid;
    gap: calc(var(--tln-space) * 3);
    padding: calc(var(--tln-space) * 4);
    background: var(--tln-content);
    border-radius: var(--tln-radius);
    box-shadow: var(--tln-shadow-content);
  }

  .row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: calc(var(--tln-space) * 3);
  }

  .muted {
    font-size: var(--tln-text-sm);
    color: var(--tln-fg-muted);
  }
</style>
