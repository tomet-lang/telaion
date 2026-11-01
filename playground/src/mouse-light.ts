/**
 * Unified Two-Light Physical Model (Playground demo utility):
 * 1. Sun (Parallel Sunlight):
 *    Mouse position relative to viewport center sets the global sun angle (--tln-sun-shadow-x/y on :root).
 *    All elements across the document cast parallel sun shadows.
 *
 * 2. Lamp (Radial Ambient Light):
 *    Mouse cursor acts as a hand-held lamp hovering over the surface.
 *    Elements cast radial ambient shadows that flee outward from the cursor (--tln-lamp-shadow-x/y).
 */

export interface MouseLightOptions {
  enabled?: boolean;
  maxOffset?: number;
  selector?: string;
}

const DEFAULT_SELECTOR = [
  ".tln-btn",
  ".tln-icon-btn",
  ".tln-input",
  ".tln-select-control",
  ".tln-modal[open]",
  ".tln-editor-bar",
  ".tln-editor-body",
  ".tln-conflict",
  ".tln-conflict-text",
  ".layer-content",
  ".layer-well",
  ".result",
  ".themes button",
  "[data-mouse-light]",
].join(", ");

interface LightTarget {
  node: HTMLElement;
  options: MouseLightOptions;
}

const activeTargets = new Set<LightTarget>();
const touchedNodes = new Set<HTMLElement>();

let pointerX = -1000;
let pointerY = -1000;
let rafId: number | null = null;
let listening = false;

function clearAllStyles() {
  if (typeof document !== "undefined") {
    document.documentElement.style.removeProperty("--tln-sun-shadow-x");
    document.documentElement.style.removeProperty("--tln-sun-shadow-y");
  }
  for (const node of touchedNodes) {
    node.style.removeProperty("--tln-lamp-shadow-x");
    node.style.removeProperty("--tln-lamp-shadow-y");
  }
  touchedNodes.clear();
}

function update() {
  rafId = null;

  const anyEnabled = [...activeTargets].some((t) => t.options.enabled !== false);
  if (!anyEnabled) {
    clearAllStyles();
    return;
  }

  // 1. Calculate Global Sun (parallel sunlight across viewport)
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
  const elements = new Map<HTMLElement, number>();

  for (const target of activeTargets) {
    if (target.options.enabled === false) continue;
    if (!target.node.isConnected) {
      activeTargets.delete(target);
      continue;
    }

    const { node, options } = target;
    const defaultOffset = options.maxOffset ?? 6;

    if (options.selector) {
      const matched = node.querySelectorAll<HTMLElement>(options.selector);
      for (const el of matched) {
        const offset = el.dataset.mouseLightOffset
          ? parseFloat(el.dataset.mouseLightOffset)
          : el.matches(".tln-modal")
            ? 12
            : defaultOffset;
        elements.set(el, offset);
      }
    } else {
      const matched = node.querySelectorAll<HTMLElement>(DEFAULT_SELECTOR);
      for (const el of matched) {
        const offset = el.dataset.mouseLightOffset
          ? parseFloat(el.dataset.mouseLightOffset)
          : el.matches(".tln-modal")
            ? 12
            : defaultOffset;
        elements.set(el, offset);
      }
      elements.set(node, defaultOffset);
    }
  }

  // Also include any open modals floating in the document top-layer
  if (typeof document !== "undefined") {
    const openModals = document.querySelectorAll<HTMLElement>(".tln-modal[open]");
    for (const modal of openModals) {
      elements.set(modal, 12);
    }
  }

  for (const [el, maxOffset] of elements) {
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) continue;

    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    const dx = cx - pointerX;
    const dy = cy - pointerY;
    const dist = Math.hypot(dx, dy);

    touchedNodes.add(el);

    if (dist < 1) {
      el.style.setProperty("--tln-lamp-shadow-x", "0px");
      el.style.setProperty("--tln-lamp-shadow-y", "0px");
      continue;
    }

    const nx = dx / dist;
    const ny = dy / dist;

    const factor = Math.min(1, dist / 120);
    const lx = (nx * factor * maxOffset).toFixed(1);
    const ly = (ny * factor * maxOffset).toFixed(1);

    el.style.setProperty("--tln-lamp-shadow-x", `${lx}px`);
    el.style.setProperty("--tln-lamp-shadow-y", `${ly}px`);
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
  clearAllStyles();
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
  clearAllStyles();
  listening = false;
}

export function mouseLight(node: HTMLElement, initialOptions: MouseLightOptions = {}) {
  const target: LightTarget = {
    node,
    options: { enabled: true, ...initialOptions },
  };
  activeTargets.add(target);

  if (target.options.enabled !== false) {
    startListening();
  }

  return {
    update(newOptions: MouseLightOptions = {}) {
      const prevEnabled = target.options.enabled !== false;
      target.options = { enabled: true, ...newOptions };
      const nextEnabled = target.options.enabled !== false;

      if (!nextEnabled && prevEnabled) {
        clearAllStyles();
      } else if (nextEnabled && !prevEnabled) {
        startListening();
        if (rafId === null) {
          rafId = requestAnimationFrame(update);
        }
      }
    },
    destroy() {
      activeTargets.delete(target);
      if (activeTargets.size === 0) {
        stopListening();
      } else {
        target.node.style.removeProperty("--tln-lamp-shadow-x");
        target.node.style.removeProperty("--tln-lamp-shadow-y");
      }
    },
  };
}
