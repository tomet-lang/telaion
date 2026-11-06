<script lang="ts" module>
  // The gap to the anchor and the margin to the viewport are token sizes, written in CSS. Registered
  // as lengths, the browser resolves them to pixels, so the placement can read them back.
  if (typeof CSS !== "undefined" && "registerProperty" in CSS) {
    for (const name of ["--tln-float-gap", "--tln-float-margin"]) {
      try {
        CSS.registerProperty({ name, syntax: "<length>", inherits: false, initialValue: "0px" });
      } catch {
        // Already registered: another copy of this module got there first.
      }
    }
  }
</script>

<script lang="ts">
  /*
   * Internal. The surface that Popover, ContextMenu and Tooltip share: a panel in the browser's top
   * layer (so no ancestor's `overflow: hidden` or transform can clip or move it), placed next to an
   * anchor and kept in view. It knows nothing about when to open or close; its users decide that.
   */
  import { untrack, type Snippet } from "svelte";
  import type { HTMLAttributes } from "svelte/elements";
  import { place, type Placement } from "./position.js";
  import "./looks.css";

  type Anchor = Element | { x: number; y: number };

  type Props = Omit<HTMLAttributes<HTMLDivElement>, "class" | "style" | "children"> & {
    open: boolean;
    /** What to float next to: an element, or a point in viewport coordinates. Read at every placement. */
    anchor: () => Anchor | null;
    placement?: Placement;
    /** At least as wide as the anchor: a dropdown under its button. */
    matchWidth?: boolean;
    /** The padding and type size. dialog: any content. menu: a list of rows. tip: a line of text. */
    kind?: "dialog" | "menu" | "tip";
    /** Render the content while closed too, for text that something refers to by `aria-describedby`. */
    keepMounted?: boolean;
    panel?: HTMLDivElement;
    children: Snippet;
  };

  let {
    open,
    anchor,
    placement = "bottom-start",
    matchWidth = false,
    kind = "dialog",
    keepMounted = false,
    panel = $bindable(),
    children,
    ...rest
  }: Props = $props();

  function reposition() {
    const target = anchor();
    if (!panel || !target) return;
    const rect =
      target instanceof Element
        ? target.getBoundingClientRect()
        : { left: target.x, top: target.y, width: 0, height: 0 };

    // Measure the panel as it wants to be, not as an earlier placement shaped it.
    panel.style.maxHeight = "";
    panel.style.minWidth = matchWidth ? `${rect.width}px` : "";
    const computed = getComputedStyle(panel);
    // A point has no edge to keep clear of: a context menu's corner is at the pointer, as a native one is.
    const gap = target instanceof Element ? parseFloat(computed.getPropertyValue("--tln-float-gap")) || 0 : 0;
    const margin = parseFloat(computed.getPropertyValue("--tln-float-margin")) || 0;
    const root = document.documentElement;
    const placed = place(
      rect,
      { width: panel.offsetWidth, height: panel.offsetHeight },
      placement,
      { width: root.clientWidth, height: root.clientHeight },
      gap,
      margin,
    );

    panel.style.left = `${placed.left}px`;
    panel.style.top = `${placed.top}px`;
    panel.style.maxHeight = placed.maxHeight === undefined ? "" : `${placed.maxHeight}px`;
    panel.dataset.side = placed.side;
  }

  $effect(() => {
    if (!open || !panel) return;
    const element = panel;
    element.showPopover();

    const observer = new ResizeObserver(reposition);
    observer.observe(element);
    const target = untrack(anchor);
    if (target instanceof Element) observer.observe(target);
    // Any ancestor may scroll, and a scroll does not bubble: listen in the capture phase.
    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", reposition);
      if (element.matches(":popover-open")) element.hidePopover();
    };
  });

  // Reads the anchor and the placement, so it places again when either changes while open.
  $effect(() => {
    if (open && panel) reposition();
  });
</script>

<!-- manual: this component closes it. The browser's own light dismiss cannot tell a click on the trigger from one elsewhere. -->
<div bind:this={panel} class="tln-float tln-floating" popover="manual" data-kind={kind} {...rest}>
  {#if open || keepMounted}
    {@render children()}
  {/if}
</div>

<style>
  /* What it looks like (content tone, radius, float shadow) is .tln-float in looks.css, shared with Modal. */
  .tln-floating {
    --tln-float-gap: calc(var(--tln-space) * 1.5);
    --tln-float-margin: calc(var(--tln-space) * 2);

    /* Undo what the browser gives a popover (centered, inset: 0, framed), and any reset's opinion. */
    position: fixed;
    inset: auto;
    margin: 0;
    border: 0;
    box-sizing: border-box;
    width: max-content;
    height: auto;
    max-width: calc(100% - var(--tln-float-margin) * 2);
    overflow: auto;

    font-family: var(--tln-font-sans);
    font-size: var(--tln-text-sm);
    line-height: var(--tln-leading);
    text-align: left;
    white-space: normal;
  }

  /* Only while open: `display` on a closed popover would show it. */
  .tln-floating:popover-open {
    display: block;
  }

  .tln-floating[data-kind="dialog"] {
    padding: calc(var(--tln-space) * 3);
  }
  .tln-floating[data-kind="menu"] {
    padding: var(--tln-space);
  }
  .tln-floating[data-kind="tip"] {
    max-width: min(calc(var(--tln-space) * 80), calc(100% - var(--tln-float-margin) * 2));
    padding: var(--tln-space) calc(var(--tln-space) * 2);
    font-size: var(--tln-text-xs);
    overflow-wrap: anywhere;
  }

  /* A panel that is focused as a whole (nothing inside it to focus) has no ring: it is not a control. */
  .tln-floating:focus {
    outline: none;
  }
</style>
