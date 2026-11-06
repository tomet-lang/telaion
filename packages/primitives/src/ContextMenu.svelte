<script lang="ts">
  import type { Snippet } from "svelte";
  import Menu, { type MenuAction, type MenuItem } from "./Menu.svelte";
  import Popover from "./Popover.svelte";

  let {
    open = $bindable(false),
    x = $bindable(0),
    y = $bindable(0),
    items,
    label = "Context menu",
    item,
    onselect,
    onclose,
    children,
  }: {
    open?: boolean;
    /** Where it opens, in viewport coordinates (`clientX`, `clientY`). Set for you when `children` is used. */
    x?: number;
    y?: number;
    /**
     * The rows. A function is asked when the menu is about to open, with the element that was
     * clicked, so one ContextMenu around a whole tree can offer a different menu for each row. If it
     * returns no rows, nothing opens and the browser's own menu shows. Without `children` it is
     * called with `null` when the menu is drawn.
     */
    items: MenuItem[] | ((target: Element | null) => MenuItem[]);
    label?: string;
    /** Draw a row's content yourself. See Menu. */
    item?: Snippet<[MenuAction]>;
    onselect?: (action: MenuAction) => void;
    onclose?: () => void;
    /**
     * An area that opens the menu by right click, and by the keyboard: the Menu key, or Shift+F10,
     * on a focused element inside it. Without `children`, open it yourself with `open`, `x` and `y`.
     */
    children?: Snippet;
  } = $props();

  // What is shown: a function's answer is kept from the moment of opening, so it does not change under the pointer.
  let shown = $state<MenuItem[]>([]);
  const rows = $derived(typeof items !== "function" ? items : children ? shown : items(null));

  function openAt(clientX: number, clientY: number, target: Element | null): boolean {
    if (typeof items === "function") {
      shown = items(target);
      if (shown.length === 0) return false;
    }
    x = clientX;
    y = clientY;
    open = true;
    return true;
  }

  function handleContextmenu(event: MouseEvent) {
    if (event.defaultPrevented) return;
    const target = event.target instanceof Element ? event.target : null;
    if (openAt(event.clientX, event.clientY, target)) event.preventDefault();
  }

  // The keyboard has no pointer: the menu opens under the element that has the focus.
  function handleKeydown(event: KeyboardEvent) {
    if (event.defaultPrevented) return;
    if (event.key !== "ContextMenu" && !(event.key === "F10" && event.shiftKey)) return;
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;
    const box = target.getBoundingClientRect();
    if (openAt(box.left, box.bottom, target)) event.preventDefault();
  }
</script>

<!-- The area has no box of its own and no role: it only listens to what happens inside. -->
{#if children}
  <span class="tln-context-area" role="presentation" oncontextmenu={handleContextmenu} onkeydown={handleKeydown}>
    {@render children()}
  </span>
{/if}

<!-- A menu that is open on a window that loses the focus has nothing to do with the person any more. -->
<svelte:window onblur={() => (open = false)} />

<Popover bind:open {label} role="menu" placement="bottom-start" anchor={{ x, y }} closeOnScroll {onclose}>
  <Menu items={rows} {item} {onselect} />
</Popover>

<style>
  .tln-context-area {
    display: contents;
  }
</style>
