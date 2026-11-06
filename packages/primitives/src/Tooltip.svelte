<script lang="ts" module>
  /** What the tooltip gives the element it describes. Spread it on that element: `<Button {...describe}>`. */
  export interface TooltipTargetProps {
    "aria-describedby": string;
  }

  // Moving from one tooltip to the next should not make the person wait again.
  let lastHidden = 0;
  const grace = 300;
</script>

<script lang="ts">
  import type { Snippet } from "svelte";
  import Floating from "./Floating.svelte";
  import { pushLayer } from "./layers.js";
  import type { Placement } from "./position.js";

  let {
    text,
    placement = "top",
    delay = 500,
    children,
  }: {
    /** What it says. Text only: a tooltip is a hint, and cannot be reached to click in it. */
    text: string;
    placement?: Placement;
    /** Milliseconds of hovering or focus before it shows. Waived right after another tooltip was shown. */
    delay?: number;
    /** The element it describes. Spread the argument on it so that assistive technology reads the text with it. */
    children: Snippet<[TooltipTargetProps]>;
  } = $props();

  const uid = $props.id();
  const tipId = `${uid}-tip`;
  let wrapper = $state<HTMLSpanElement>();
  let visible = $state(false);
  let timer: ReturnType<typeof setTimeout> | undefined;

  function show() {
    clearTimeout(timer);
    if (visible) return;
    const wait = Date.now() - lastHidden < grace ? 0 : delay;
    timer = setTimeout(() => (visible = true), wait);
  }

  function hide(wait = 0) {
    clearTimeout(timer);
    if (wait === 0) visible = false;
    else timer = setTimeout(() => (visible = false), wait);
  }

  // A tooltip is not a place to go: leaving the element for it keeps it, and leaving both hides it.
  const hoverLeaveGrace = 100;

  $effect(() => {
    if (!visible) return;
    const removeLayer = pushLayer(() => hide());
    return () => {
      removeLayer();
      lastHidden = Date.now();
    };
  });

  // Touch has no hover: the tooltip would appear for a moment after every tap.
  const hoverable = (event: PointerEvent) => event.pointerType !== "touch";

  function handlePointerover(event: PointerEvent) {
    if (hoverable(event)) show();
  }
  function handlePointerout(event: PointerEvent) {
    if (hoverable(event) && !wrapper?.contains(event.relatedTarget as Node | null)) hide(hoverLeaveGrace);
  }
  // Only focus from the keyboard shows it. A click focuses the element too, and the tooltip would
  // then cover what the person just pressed.
  function handleFocusin(event: FocusEvent) {
    if ((event.target as Element).matches(":focus-visible")) show();
  }
</script>

<span
  class="tln-tooltip-target"
  role="presentation"
  bind:this={wrapper}
  onpointerover={handlePointerover}
  onpointerout={handlePointerout}
  onpointerdown={() => hide()}
  onfocusin={handleFocusin}
  onfocusout={() => hide()}
>
  {@render children({ "aria-describedby": tipId })}
</span>

<!-- Rendered while hidden too: the element it describes refers to the text, and the text must be there when the focus arrives. -->
<Floating
  open={visible}
  anchor={() => wrapper?.firstElementChild ?? null}
  {placement}
  kind="tip"
  keepMounted
  id={tipId}
  role="tooltip"
  onpointerenter={() => clearTimeout(timer)}
  onpointerleave={() => hide(hoverLeaveGrace)}
>
  {text}
</Floating>

<style>
  /* No box of its own: the element it describes sits in the page exactly as if it were not wrapped. */
  .tln-tooltip-target {
    display: contents;
  }
</style>
