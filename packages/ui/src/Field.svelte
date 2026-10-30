<script lang="ts">
  import type { Snippet } from "svelte";
  import { setFieldContext } from "./field-context.ts";

  let {
    label,
    hint,
    error,
    children,
  }: {
    label: string;
    /** Help shown under the control. Replaced by `error` while there is one. A snippet allows markup such as <code>. */
    hint?: string | Snippet;
    error?: string;
    /** The control: an Input or a Select. It picks up its id and messages from this Field. */
    children: Snippet;
  } = $props();

  const uid = $props.id();
  const controlId = `${uid}-control`;
  const hintId = `${uid}-hint`;
  const errorId = `${uid}-error`;

  setFieldContext({
    get id() {
      return controlId;
    },
    get describedby() {
      return error ? errorId : hint ? hintId : undefined;
    },
    get invalid() {
      return Boolean(error);
    },
  });
</script>

<div class="tln-field">
  <label class="tln-label" for={controlId}>{label}</label>
  {@render children()}
  {#if error}
    <p class="tln-message tln-error" id={errorId} role="alert">{error}</p>
  {:else if hint}
    <p class="tln-message" id={hintId}>
      {#if typeof hint === "string"}{hint}{:else}{@render hint()}{/if}
    </p>
  {/if}
</div>

<style>
  .tln-field {
    display: grid;
    gap: var(--tln-space);
  }

  .tln-label {
    font-size: var(--tln-text-sm);
    color: var(--tln-fg);
  }

  .tln-message {
    margin: 0;
    font-size: var(--tln-text-xs);
    color: var(--tln-fg-muted);
  }

  .tln-error {
    color: var(--tln-danger);
  }
</style>
