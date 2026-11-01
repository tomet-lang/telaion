<script lang="ts">
  import type { Snippet } from "svelte";
  import Icon from "./Icon.svelte";
  import IconButton from "./IconButton.svelte";
  import "./looks.css";
  import { CircleAlert, CircleCheck, Info, TriangleAlert, X } from "./icons.generated.js";

  let {
    tone,
    onDismiss,
    children,
  }: {
    tone: "ok" | "warn" | "danger" | "info";
    /** Shows a dismiss button when given. */
    onDismiss?: () => void;
    children: Snippet;
  } = $props();

  const icons = { ok: CircleCheck, warn: TriangleAlert, danger: CircleAlert, info: Info };

  // warn and danger interrupt a screen reader; ok and info wait their turn.
  const role = $derived(tone === "warn" || tone === "danger" ? "alert" : "status");
</script>

<div class="tln-alert tln-tone" data-tone={tone} {role}>
  <span class="tln-alert-icon"><Icon icon={icons[tone]} /></span>
  <div class="tln-alert-body">{@render children()}</div>
  {#if onDismiss}
    <IconButton icon={X} label="Dismiss" onclick={onDismiss} />
  {/if}
</div>

<style>
  /* The color of each tone is in looks.css, shared with Badge. */
  .tln-alert {
    display: flex;
    align-items: flex-start;
    gap: calc(var(--tln-space) * 3);
    padding: calc(var(--tln-space) * 3);
    font-size: var(--tln-text-sm);
    line-height: var(--tln-leading);
    color: var(--tln-fg);
    background: var(--tln-tone-soft);
    border: 1px solid var(--tln-tone);
    border-radius: var(--tln-radius);
  }

  .tln-alert-icon {
    display: inline-flex;
    padding-top: var(--tln-space);
    font-size: var(--tln-text-md);
    color: var(--tln-tone);
  }

  .tln-alert-body {
    flex: 1;
    min-width: 0;
  }
</style>
