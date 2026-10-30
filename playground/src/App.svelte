<script lang="ts">
  import { Icon } from "@telaion/ui";
  import { Check, TriangleAlert, X } from "@telaion/ui/icons";

  type Theme = "system" | "light" | "dark";

  let theme = $state<Theme>("system");

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
    <h2>Icon</h2>
    <div class="row">
      <span class="sample"><Icon icon={X} label="Close" /> decorative off, labelled</span>
      <span class="sample"><Icon icon={Check} /> decorative</span>
      <span class="sample" style:color="var(--tln-warn)"><Icon icon={TriangleAlert} /> follows the text color</span>
    </div>
  </section>
</main>

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
    gap: calc(var(--tln-space) * 6);
  }

  .sample {
    display: inline-flex;
    align-items: center;
    gap: calc(var(--tln-space) * 2);
  }
</style>
