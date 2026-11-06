<script lang="ts">
  import type { Snippet } from "svelte";
  import { onMount } from "svelte";

  let {
    label,
    orientation = "horizontal",
    children,
  }: {
    /** Names the toolbar for assistive technology. */
    label: string;
    /** Which arrow keys move between the controls, and which way they are laid out. */
    orientation?: "horizontal" | "vertical";
    /** The controls. They keep their own look: the bar only holds them. */
    children: Snippet;
  } = $props();

  let bar: HTMLDivElement;

  /*
   * ROVING FOCUS. A toolbar is one stop in the Tab order; the arrow keys move inside it. The
   * controls are the buttons, links and checkboxes in the bar, and they are given tabindex here,
   * because the application's controls are not ours to wrap. Three kinds of control are not part of
   * it and keep their own behaviour: those that use the arrow keys themselves (text fields, selects,
   * and widgets such as SegmentedControl or Tabs, which stay a stop of their own in the Tab order).
   */
  const OWN_KEYS = '[role="radiogroup"], [role="tablist"], [role="listbox"], [role="menu"], [role="menubar"], [role="grid"], [role="tree"], [role="slider"], [role="spinbutton"]';
  const TEXTUAL =
    'textarea, select, [contenteditable], input:not([type="button"], [type="submit"], [type="reset"], [type="checkbox"], [type="image"])';

  function controls(): HTMLElement[] {
    return [...bar.querySelectorAll<HTMLElement>("button, a[href], input, summary, [tabindex], [data-tln-roving]")].filter(
      (el) =>
        !el.matches(":disabled, " + TEXTUAL) &&
        !el.closest(OWN_KEYS) &&
        !el.closest("[hidden], [inert]") &&
        (el.hasAttribute("data-tln-roving") || el.getAttribute("tabindex") !== "-1") &&
        el.checkVisibility(),
    );
  }

  /** Makes `active` the one control in the Tab order; with none given, the one that was, or the first. */
  function rove(active?: HTMLElement) {
    const list = controls();
    const keep = active && list.includes(active) ? active : (list.find((el) => el.tabIndex === 0 && el.hasAttribute("data-tln-roving")) ?? list[0]);
    for (const el of list) {
      el.dataset.tlnRoving = "";
      el.tabIndex = el === keep ? 0 : -1;
    }
  }

  onMount(() => {
    rove();
    // Controls come and go, and become disabled: the one stop has to stay on a control that can be reached.
    const observer = new MutationObserver(() => rove());
    observer.observe(bar, { childList: true, subtree: true, attributes: true, attributeFilter: ["disabled", "hidden", "inert"] });
    return () => observer.disconnect();
  });

  function handleFocusin(event: FocusEvent) {
    const target = event.target as HTMLElement;
    if (target.hasAttribute("data-tln-roving")) rove(target);
  }

  function handleKeydown(event: KeyboardEvent) {
    // A widget that uses the key has already taken it.
    if (event.defaultPrevented) return;
    const list = controls();
    const from = list.indexOf(event.target as HTMLElement);
    if (from < 0) return;
    const [back, forward] = orientation === "vertical" ? ["ArrowUp", "ArrowDown"] : ["ArrowLeft", "ArrowRight"];
    let to: number;
    if (event.key === forward) to = (from + 1) % list.length;
    else if (event.key === back) to = (from - 1 + list.length) % list.length;
    else if (event.key === "Home") to = 0;
    else if (event.key === "End") to = list.length - 1;
    else return;
    event.preventDefault();
    list[to].focus();
  }
</script>

<!-- The arrow keys are handled for the controls inside; the bar itself is not a control. -->
<!-- svelte-ignore a11y_interactive_supports_focus -->
<div
  class="tln-toolbar"
  role="toolbar"
  aria-label={label}
  aria-orientation={orientation}
  data-orientation={orientation}
  bind:this={bar}
  onkeydown={handleKeydown}
  onfocusin={handleFocusin}
>
  {@render children()}
</div>

<style>
  /*
   * A surface that only holds controls is content; the controls on it are actions, one above,
   * and keep their own look. The bar does not restyle them.
   */
  .tln-toolbar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: calc(var(--tln-space) * 2);
    padding: calc(var(--tln-space) * 2);
    color: var(--tln-fg);
    background: var(--tln-content);
    border-radius: var(--tln-radius);
    box-shadow: var(--tln-shadow-content);
  }

  /* A text field fills the width of its container; in a bar it is one control among others, so it takes a share. */
  .tln-toolbar > :global(.tln-field-control) {
    flex: 0 1 calc(var(--tln-space) * 40);
    width: auto;
  }

  .tln-toolbar[data-orientation="vertical"] {
    flex-direction: column;
    align-items: stretch;
    width: max-content;
  }
</style>
