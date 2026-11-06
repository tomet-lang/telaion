/**
 * The floating layers that are open, innermost last.
 *
 * Escape closes the innermost one only: a menu inside a popover closes before the popover does,
 * and neither takes the Escape that a modal underneath is waiting for. The listener is on the
 * document, in the capture phase, so it sees the key before anything inside a layer does.
 */

type Layer = { dismiss: () => void };

const stack: Layer[] = [];

function handleKeydown(event: KeyboardEvent) {
  if (event.key !== "Escape" || event.isComposing || stack.length === 0) return;
  event.preventDefault();
  event.stopPropagation();
  stack[stack.length - 1].dismiss();
}

/** Register an open layer. Returns the function that removes it again. */
export function pushLayer(dismiss: () => void): () => void {
  const layer: Layer = { dismiss };
  if (stack.length === 0) document.addEventListener("keydown", handleKeydown, true);
  stack.push(layer);
  return () => {
    const index = stack.indexOf(layer);
    if (index >= 0) stack.splice(index, 1);
    if (stack.length === 0) document.removeEventListener("keydown", handleKeydown, true);
  };
}
