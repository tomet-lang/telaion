<script lang="ts">
  import type { Snippet } from "svelte";

  type Direction = "horizontal" | "vertical";

  let {
    direction = "horizontal",
    ratio = $bindable(0.5),
    min = 0.1,
    max = 0.9,
    disabled = false,
    label = "Resize split",
    primary,
    secondary,
  }: {
    /** horizontal splits side-by-side (left/right); vertical splits stacked (top/bottom). */
    direction?: Direction;
    /** Fraction of total size given to the primary pane (between 0.0 and 1.0). */
    ratio?: number;
    /** Minimum fraction for the primary pane (e.g. 0.1 for 10%). */
    min?: number;
    /** Maximum fraction for the primary pane (e.g. 0.9 for 90%). */
    max?: number;
    disabled?: boolean;
    /** Accessible label for the separator handle. */
    label?: string;
    primary: Snippet;
    secondary: Snippet;
  } = $props();

  let container: HTMLElement | undefined = $state();
  let dragging = $state(false);

  function clamp(val: number): number {
    return Math.max(min, Math.min(max, val));
  }

  function updateRatioFromPointer(clientX: number, clientY: number) {
    if (!container) return;
    const rect = container.getBoundingClientRect();
    if (direction === "horizontal") {
      const width = rect.width;
      if (width <= 0) return;
      const offset = clientX - rect.left;
      ratio = clamp(offset / width);
    } else {
      const height = rect.height;
      if (height <= 0) return;
      const offset = clientY - rect.top;
      ratio = clamp(offset / height);
    }
  }

  function handlePointerDown(e: PointerEvent) {
    if (disabled || e.button !== 0) return;
    dragging = true;
    e.preventDefault();

    const onPointerMove = (moveEvent: PointerEvent) => {
      updateRatioFromPointer(moveEvent.clientX, moveEvent.clientY);
    };

    const onPointerUp = () => {
      dragging = false;
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
  }

  const STEP = 0.02; // 2% per arrow key press
  const BIG_STEP = 0.1; // 10% per Shift+arrow

  function handleKeyDown(e: KeyboardEvent) {
    if (disabled) return;
    const step = e.shiftKey ? BIG_STEP : STEP;

    if (direction === "horizontal") {
      if (e.key === "ArrowLeft") {
        ratio = clamp(ratio - step);
        e.preventDefault();
      } else if (e.key === "ArrowRight") {
        ratio = clamp(ratio + step);
        e.preventDefault();
      }
    } else {
      if (e.key === "ArrowUp") {
        ratio = clamp(ratio - step);
        e.preventDefault();
      } else if (e.key === "ArrowDown") {
        ratio = clamp(ratio + step);
        e.preventDefault();
      }
    }

    if (e.key === "Home") {
      ratio = min;
      e.preventDefault();
    } else if (e.key === "End") {
      ratio = max;
      e.preventDefault();
    }
  }

  // Ensure ratio stays within [min, max] when props change
  $effect(() => {
    if (ratio < min) ratio = min;
    else if (ratio > max) ratio = max;
  });
</script>

<div
  bind:this={container}
  class="tln-split-pane"
  data-direction={direction}
  data-dragging={dragging || undefined}
>
  <div class="tln-split-primary" style:flex-basis="{ratio * 100}%">
    {@render primary()}
  </div>

  <!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
  <div
    role="separator"
    tabindex={disabled ? -1 : 0}
    class="tln-split-resizer"
    aria-label={label}
    aria-orientation={direction === "horizontal" ? "vertical" : "horizontal"}
    aria-valuenow={Math.round(ratio * 100)}
    aria-valuemin={Math.round(min * 100)}
    aria-valuemax={Math.round(max * 100)}
    aria-disabled={disabled || undefined}
    onpointerdown={handlePointerDown}
    onkeydown={handleKeyDown}
  >
    <div class="tln-split-resizer-line"></div>
  </div>

  <div class="tln-split-secondary">
    {@render secondary()}
  </div>
</div>

<style>
  .tln-split-pane {
    display: flex;
    width: 100%;
    height: 100%;
    min-width: 0;
    min-height: 0;
    overflow: hidden;
  }

  .tln-split-pane[data-direction="horizontal"] {
    flex-direction: row;
  }

  .tln-split-pane[data-direction="vertical"] {
    flex-direction: column;
  }

  /* When dragging, prevent text selection across all children */
  .tln-split-pane[data-dragging] {
    user-select: none;
    -webkit-user-select: none;
  }

  .tln-split-primary {
    flex-grow: 0;
    flex-shrink: 0;
    min-width: 0;
    min-height: 0;
    overflow: auto;
  }

  .tln-split-secondary {
    flex-grow: 1;
    flex-shrink: 1;
    flex-basis: 0%;
    min-width: 0;
    min-height: 0;
    overflow: auto;
  }

  /* Resizer handle (accessible separator) */
  .tln-split-resizer {
    position: relative;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    touch-action: none;
    outline: none;
    z-index: 2;
  }

  .tln-split-pane[data-direction="horizontal"] > .tln-split-resizer {
    width: calc(var(--tln-space) * 2);
    cursor: col-resize;
    margin: 0 calc(var(--tln-space) * -1);
  }

  .tln-split-pane[data-direction="vertical"] > .tln-split-resizer {
    height: calc(var(--tln-space) * 2);
    cursor: row-resize;
    margin: calc(var(--tln-space) * -1) 0;
  }

  /* Visual 1px divider line inside the wider touch/drag area */
  .tln-split-resizer-line {
    background: var(--tln-border);
    transition: background-color var(--tln-transition);
  }

  .tln-split-pane[data-direction="horizontal"] .tln-split-resizer-line {
    width: 1px;
    height: 100%;
  }

  .tln-split-pane[data-direction="vertical"] .tln-split-resizer-line {
    height: 1px;
    width: 100%;
  }

  /* Hover, drag, and focus states highlight the separator */
  .tln-split-resizer:hover:not([aria-disabled="true"]) .tln-split-resizer-line,
  .tln-split-pane[data-dragging] > .tln-split-resizer .tln-split-resizer-line {
    background: var(--tln-accent);
  }

  .tln-split-resizer:focus-visible {
    outline: var(--tln-focus-ring);
    outline-offset: -1px;
  }

  .tln-split-resizer[aria-disabled="true"] {
    cursor: default;
  }
</style>
