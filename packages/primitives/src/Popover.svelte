<script lang="ts" module>
  /** What the trigger needs. Spread it on the one element that opens the popover: `<Button {...trigger}>`. */
  export interface PopoverTriggerProps {
    "aria-haspopup": "dialog" | "menu";
    "aria-expanded": boolean;
    "aria-controls": string | undefined;
    onclick: () => void;
    /** Only for a menu: the arrow keys open it, as the menu button pattern asks. */
    onkeydown: ((event: KeyboardEvent) => void) | undefined;
  }

  const tabbable = ["a[href]", "button", "input", "select", "textarea", "[tabindex]"]
    .map((selector) => `${selector}:not([disabled]):not([tabindex="-1"])`)
    .join(", ");
</script>

<script lang="ts">
  import type { Snippet } from "svelte";
  import Floating from "./Floating.svelte";
  import { pushLayer } from "./layers.js";
  import { setPopoverContext } from "./popover-context.js";
  import type { Placement } from "./position.js";

  let {
    open = $bindable(false),
    label,
    role = "dialog",
    placement = "bottom-start",
    anchor,
    matchWidth = false,
    closeOnScroll = false,
    onclose,
    trigger,
    children,
  }: {
    open?: boolean;
    /** The accessible name of the popover. A Menu inside it takes this as its own. */
    label: string;
    /**
     * What the popover is. dialog: any content, a form, a panel; it is named by `label`. menu: it
     * holds a Menu, which has the role; this only tells the trigger what it opens.
     */
    role?: "dialog" | "menu";
    /** A side (`top`, `bottom`, `left`, `right`), and where along it (`-start`, `-end`; centered without). Flips if there is no room. */
    placement?: Placement;
    /**
     * What to float next to when it is not the trigger: an element elsewhere, or a point in
     * viewport coordinates. Without it the popover floats next to the element the `trigger` renders.
     */
    anchor?: Element | { x: number; y: number } | null;
    /** At least as wide as what it is anchored to: a dropdown under its button. */
    matchWidth?: boolean;
    /** Close when the page scrolls, as a context menu does. Otherwise the popover follows its anchor. */
    closeOnScroll?: boolean;
    /** Called whenever it closes, however it was closed. */
    onclose?: () => void;
    /**
     * The element that opens it. Spread the `trigger` argument on that one element, usually a
     * Button: it carries `aria-expanded`, `aria-controls` and the click that toggles the popover.
     */
    trigger?: Snippet<[PopoverTriggerProps]>;
    /** The content. It is only rendered while the popover is open. */
    children: Snippet;
  } = $props();

  const uid = $props.id();
  const panelId = `${uid}-popover`;
  let wrapper = $state<HTMLSpanElement>();
  let panel = $state<HTMLDivElement>();

  // The wrapper has no box of its own (display: contents), so the trigger is what it holds.
  const anchorTarget = () => anchor ?? wrapper?.firstElementChild ?? null;
  const triggerElement = () => {
    const target = anchorTarget();
    return target instanceof HTMLElement ? target : null;
  };

  /**
   * Close it. `restoreFocus` says whether the focus goes back to the trigger: yes when the person
   * asked for the close from inside (Escape, a chosen item), no when they clicked or tabbed away,
   * as the focus is then going where they put it.
   */
  let restoreFocus = true;
  function close(restore: boolean) {
    if (!open) return;
    restoreFocus = restore;
    open = false;
  }

  setPopoverContext({
    close: () => close(true),
    get label() {
      return label;
    },
  });

  // The focus returns before the content is removed, or it would be lost to the page on the way.
  let opener: HTMLElement | null = null;
  let wasOpen = false;
  $effect.pre(() => {
    if (open && !wasOpen) {
      opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    } else if (!open && wasOpen) {
      if (restoreFocus && panel?.contains(document.activeElement)) {
        (triggerElement() ?? opener)?.focus({ preventScroll: true });
      }
      restoreFocus = true;
      onclose?.();
    }
    wasOpen = open;
  });

  // The browser has shown the panel by now: the effect inside Floating runs before this one.
  $effect(() => {
    if (!open || !panel) return;
    const element = panel;
    const first = element.querySelector<HTMLElement>("[autofocus]") ?? element.querySelector<HTMLElement>(tabbable);
    (first ?? element).focus({ preventScroll: true });

    const removeLayer = pushLayer(() => close(true));

    // A click on the trigger is the trigger's to handle: it toggles. Anywhere else outside closes.
    const handlePointerdown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (element.contains(target)) return;
      const anchored = anchorTarget();
      if (anchored instanceof Element && anchored.contains(target)) return;
      close(false);
    };
    const handleScroll = (event: Event) => {
      if (event.target instanceof Node && element.contains(event.target)) return;
      close(false);
    };
    document.addEventListener("pointerdown", handlePointerdown, true);
    if (closeOnScroll) window.addEventListener("scroll", handleScroll, true);

    return () => {
      removeLayer();
      document.removeEventListener("pointerdown", handlePointerdown, true);
      window.removeEventListener("scroll", handleScroll, true);
    };
  });

  // Tabbing out of the popover leaves it behind; it does not stay open over the next control.
  function handleFocusout(event: FocusEvent) {
    const next = event.relatedTarget;
    if (!(next instanceof Node) || panel?.contains(next) || triggerElement()?.contains(next)) return;
    close(false);
  }

  const triggerProps = $derived<PopoverTriggerProps>({
    "aria-haspopup": role,
    "aria-expanded": open,
    "aria-controls": open ? panelId : undefined,
    onclick: () => (open ? close(true) : (open = true)),
    onkeydown:
      role === "menu"
        ? (event) => {
            if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
            event.preventDefault();
            open = true;
          }
        : undefined,
  });
</script>

{#if trigger}
  <span class="tln-popover-anchor" bind:this={wrapper}>
    {@render trigger(triggerProps)}
  </span>
{/if}

<Floating
  bind:panel
  {open}
  anchor={anchorTarget}
  {placement}
  {matchWidth}
  kind={role === "menu" ? "menu" : "dialog"}
  id={panelId}
  role={role === "dialog" ? "dialog" : undefined}
  aria-label={role === "dialog" ? label : undefined}
  tabindex={-1}
  onfocusout={handleFocusout}
>
  {@render children()}
</Floating>

<style>
  /* No box of its own: the trigger sits in the page exactly as if it were not wrapped. */
  .tln-popover-anchor {
    display: contents;
  }
</style>
