<script lang="ts">
  import type { HTMLInputAttributes } from "svelte/elements";
  import "./looks.css";

  type Props = Omit<HTMLInputAttributes, "class" | "style" | "type" | "value" | "min" | "max" | "step" | "children"> & {
    value?: number;
    min?: number;
    max?: number;
    step?: number;
    /** What is being set. Shown before the slider and the name of it for assistive technology. */
    label: string;
    /** Shows the value after the slider. */
    showValue?: boolean;
    /** How the value is written when it is shown: add a unit, round it. */
    format?: (value: number) => string;
  };

  let {
    value = $bindable(0),
    min = 0,
    max = 100,
    step = 1,
    label,
    showValue = false,
    format = String,
    disabled = false,
    ...rest
  }: Props = $props();

  const uid = $props.id();
  const inputId = $derived(rest.id ?? `${uid}-input`);

  // Where the thumb is, from 0 to 1.
  const fraction = $derived(max > min ? (Math.min(Math.max(value, min), max) - min) / (max - min) : 0);
</script>

<div class="tln-slider" data-disabled={disabled ? "true" : undefined}>
  <label class="tln-slider-label" for={inputId}>{label}</label>
  <div class="tln-slider-body" style:--tln-fraction={fraction}>
    <!-- The native input is the control and lies, invisible, over the drawing below it. -->
    <input class="tln-slider-input" {...rest} id={inputId} type="range" {min} {max} {step} {disabled} bind:value />
    <span class="tln-well tln-slider-track"><span class="tln-slider-fill"></span></span>
    <span class="tln-slider-thumb"></span>
  </div>
  {#if showValue}
    <output class="tln-slider-value" for={inputId}>{format(value)}</output>
  {/if}
</div>

<style>
  .tln-slider {
    --tln-thumb-size: calc(var(--tln-space) * 5);
    --tln-track-height: calc(var(--tln-space) * 2);
    display: flex;
    align-items: center;
    gap: calc(var(--tln-space) * 2);
    font-size: var(--tln-text-sm);
    line-height: var(--tln-leading);
    color: var(--tln-fg);
  }
  .tln-slider[data-disabled] {
    color: var(--tln-fg-muted);
  }

  .tln-slider-value {
    min-width: 4ch;
    color: var(--tln-fg-muted);
    font-variant-numeric: tabular-nums;
  }

  .tln-slider-body {
    position: relative;
    flex: 1 1 auto;
    min-width: calc(var(--tln-space) * 30);
    height: var(--tln-thumb-size);
  }

  /* The input takes the pointer and the keys. Its own thumb is as wide as the drawn one, so that the pointer meets it. */
  .tln-slider-input {
    position: absolute;
    inset: 0;
    z-index: 1;
    width: 100%;
    height: 100%;
    margin: 0;
    opacity: 0;
    appearance: none;
    background: transparent;
    cursor: pointer;
  }
  .tln-slider-input::-webkit-slider-thumb {
    appearance: none;
    width: var(--tln-thumb-size);
    height: var(--tln-thumb-size);
  }
  .tln-slider-input::-moz-range-thumb {
    width: var(--tln-thumb-size);
    height: var(--tln-thumb-size);
    border: 0;
  }
  .tln-slider-input:disabled {
    cursor: not-allowed;
  }

  /* The track is a well, the fill is the value, in accent, and the thumb is an action standing in it. */
  .tln-slider-track {
    position: absolute;
    top: 50%;
    right: 0;
    left: 0;
    height: var(--tln-track-height);
    translate: 0 -50%;
    border-radius: min(var(--tln-radius), calc(var(--tln-track-height) / 2));
  }

  /* The fill reaches to the middle of the thumb. It lies over the well, so it casts the well's own
   * inward shadow again, on its own edges. */
  .tln-slider-fill {
    position: absolute;
    inset: 0 auto 0 0;
    width: calc(var(--tln-thumb-size) / 2 + var(--tln-fraction) * (100% - var(--tln-thumb-size)));
    border-radius: inherit;
    background: var(--tln-accent);
    box-shadow:
      inset var(--tln-cut-sun) var(--tln-shade),
      inset var(--tln-cut-lamp) var(--tln-shade-soft);
  }

  .tln-slider-thumb {
    position: absolute;
    top: 0;
    left: calc(var(--tln-fraction) * (100% - var(--tln-thumb-size)));
    width: var(--tln-thumb-size);
    height: var(--tln-thumb-size);
    border-radius: min(var(--tln-radius), calc(var(--tln-thumb-size) / 2));
    background: var(--tln-action);
    box-shadow: var(--tln-shadow-action);
    pointer-events: none;
    transition: box-shadow var(--tln-track);
  }

  .tln-slider-input:enabled:hover ~ .tln-slider-thumb {
    box-shadow: var(--tln-shadow-action-hover);
    background: var(--tln-action-hover);
  }
  .tln-slider-input:enabled:active ~ .tln-slider-thumb {
    box-shadow: var(--tln-shadow-action-active);
  }
  .tln-slider-input:focus-visible ~ .tln-slider-thumb {
    outline: var(--tln-focus-ring);
    outline-offset: 2px;
  }

  /* Disabled: nothing to set. The well and the thumb go flat, the fill loses its colour. */
  .tln-slider-input:disabled ~ .tln-slider-track {
    box-shadow: none;
  }
  .tln-slider-input:disabled ~ .tln-slider-track .tln-slider-fill {
    background: var(--tln-border);
    box-shadow: none;
  }
  .tln-slider-input:disabled ~ .tln-slider-thumb {
    background: var(--tln-tint);
    box-shadow: none;
  }
</style>
