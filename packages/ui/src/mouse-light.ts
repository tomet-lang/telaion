/**
 * Unified Two-Light Physical Model:
 * 1. Sun (Parallel Sunlight):
 *    Mouse position relative to viewport center sets the global sun angle (--tln-sun-shadow-x/y on :root).
 *    All elements across the document cast parallel sun shadows.
 *
 * 2. Lamp (Radial Ambient Light):
 *    Mouse cursor acts as a hand-held lamp hovering over the surface.
 *    Elements cast radial ambient shadows that flee outward from the cursor (--tln-lamp-shadow-x/y).
 */

interface LightTarget {
  node: HTMLElement;
  maxOffset: number;
}

const targets = new Set<LightTarget>();
let pointerX = -1000;
let pointerY = -1000;
let rafId: number | null = null;
let listening = false;

function update() {
  rafId = null;

  // 1. Calculate Global Sun (parallel sunlight across viewport)
  // Sun is opposite to mouse position: when cursor is at bottom-right (snx > 0, sny > 0),
  // the Sun sits at top-left, casting shadows toward bottom-right (+x, +y).
  const screenCx = window.innerWidth / 2;
  const screenCy = window.innerHeight / 2;
  const snx = Math.max(-1, Math.min(1, (pointerX - screenCx) / screenCx));
  const sny = Math.max(-1, Math.min(1, (pointerY - screenCy) / screenCy));
  const sunMax = 4; // px
  const sunX = (snx * sunMax).toFixed(1);
  const sunY = (sny * sunMax).toFixed(1);

  document.documentElement.style.setProperty("--tln-sun-shadow-x", `${sunX}px`);
  document.documentElement.style.setProperty("--tln-sun-shadow-y", `${sunY}px`);

  // 2. Calculate Hand-held Lamp (radial 360-degree point light per element)
  for (const target of targets) {
    const { node, maxOffset } = target;
    if (!node.isConnected) {
      targets.delete(target);
      continue;
    }

    const rect = node.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) {
      // Hidden or closed dialog
      continue;
    }

    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    const dx = cx - pointerX;
    const dy = cy - pointerY;
    const dist = Math.hypot(dx, dy);

    if (dist < 1) {
      node.style.setProperty("--tln-lamp-shadow-x", "0px");
      node.style.setProperty("--tln-lamp-shadow-y", "0px");
      continue;
    }

    const nx = dx / dist;
    const ny = dy / dist;

    // Ambient shadow flees outward from the hand-held lamp:
    // Centered when cursor is right above element, smoothly scaling to maxOffset
    const factor = Math.min(1, dist / 120);
    const lx = (nx * factor * maxOffset).toFixed(1);
    const ly = (ny * factor * maxOffset).toFixed(1);

    node.style.setProperty("--tln-lamp-shadow-x", `${lx}px`);
    node.style.setProperty("--tln-lamp-shadow-y", `${ly}px`);
  }
}

function onPointerMove(e: PointerEvent) {
  pointerX = e.clientX;
  pointerY = e.clientY;
  if (rafId === null) {
    rafId = requestAnimationFrame(update);
  }
}

function onPointerLeaveDoc() {
  if (rafId !== null) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
  // Restore calm defaults
  document.documentElement.style.removeProperty("--tln-sun-shadow-x");
  document.documentElement.style.removeProperty("--tln-sun-shadow-y");
  for (const t of targets) {
    t.node.style.removeProperty("--tln-lamp-shadow-x");
    t.node.style.removeProperty("--tln-lamp-shadow-y");
  }
}

function startListening() {
  if (listening || typeof window === "undefined") return;
  window.addEventListener("pointermove", onPointerMove, { passive: true });
  document.addEventListener("pointerleave", onPointerLeaveDoc);
  listening = true;
}

function stopListening() {
  if (!listening || typeof window === "undefined") return;
  window.removeEventListener("pointermove", onPointerMove);
  document.removeEventListener("pointerleave", onPointerLeaveDoc);
  if (rafId !== null) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
  listening = false;
}

export function mouseLight(node: HTMLElement, { maxOffset = 6 }: { maxOffset?: number } = {}) {
  const target: LightTarget = {
    node,
    maxOffset,
  };
  targets.add(target);
  startListening();

  return {
    update(newOptions?: { maxOffset?: number }) {
      if (newOptions?.maxOffset !== undefined) {
        target.maxOffset = newOptions.maxOffset;
      }
    },
    destroy() {
      targets.delete(target);
      node.style.removeProperty("--tln-lamp-shadow-x");
      node.style.removeProperty("--tln-lamp-shadow-y");
      if (targets.size === 0) {
        stopListening();
      }
    },
  };
}
