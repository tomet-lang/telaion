<script lang="ts">
  import Icon from "./Icon.svelte";
  import { LoaderCircle } from "./icons.generated.ts";

  let { label = "Loading" }: { label?: string } = $props();
</script>

<span class="tln-spinner" role="status" aria-label={label}>
  <Icon icon={LoaderCircle} />
</span>

<style>
  .tln-spinner {
    display: inline-flex;
    color: var(--tln-fg-muted);
    animation: tln-spin 1s linear infinite;
  }

  @keyframes tln-spin {
    to {
      transform: rotate(360deg);
    }
  }

  /* A still icon still says "busy"; the label carries the meaning. */
  @media (prefers-reduced-motion: reduce) {
    .tln-spinner {
      animation: none;
    }
  }
</style>
