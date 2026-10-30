<script lang="ts">
  import type { Snippet } from "svelte";
  import Icon from "./Icon.svelte";
  import IconButton from "./IconButton.svelte";
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

<div class="tln-alert" data-tone={tone} {role}>
  <span class="tln-alert-icon"><Icon icon={icons[tone]} /></span>
  <div class="tln-alert-body">{@render children()}</div>
  {#if onDismiss}
    <IconButton icon={X} label="Dismiss" onclick={onDismiss} />
  {/if}
</div>

<style>
  .tln-alert {
    display: flex;
    align-items: flex-start;
    gap: calc(var(--tln-space) * 3);
    padding: calc(var(--tln-space) * 3);
    font-size: var(--tln-text-sm);
    line-height: var(--tln-leading);
    color: var(--tln-fg);
    background: var(--tln-accent-soft);
    border: 1px solid var(--tln-accent);
    border-radius: var(--tln-radius);
  }

  .tln-alert-icon {
    display: inline-flex;
    padding-top: var(--tln-space);
    font-size: var(--tln-text-md);
    color: var(--tln-accent);
  }

  .tln-alert-body {
    flex: 1;
    min-width: 0;
  }

  .tln-alert[data-tone="ok"] {
    background: var(--tln-ok-soft);
    border-color: var(--tln-ok);
  }
  .tln-alert[data-tone="ok"] .tln-alert-icon {
    color: var(--tln-ok);
  }

  .tln-alert[data-tone="warn"] {
    background: var(--tln-warn-soft);
    border-color: var(--tln-warn);
  }
  .tln-alert[data-tone="warn"] .tln-alert-icon {
    color: var(--tln-warn);
  }

  .tln-alert[data-tone="danger"] {
    background: var(--tln-danger-soft);
    border-color: var(--tln-danger);
  }
  .tln-alert[data-tone="danger"] .tln-alert-icon {
    color: var(--tln-danger);
  }
</style>
