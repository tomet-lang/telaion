/**
 * Where a floating panel goes, given what it floats next to.
 *
 * One small function, so Popover, Menu, ContextMenu and Tooltip all place themselves alike and no
 * positioning library is needed. It is pure: it measures nothing and touches no element.
 */

export type Side = "top" | "bottom" | "left" | "right";
export type Align = "start" | "end";
/** A side, and where along that side: `bottom-start` opens under the anchor, left edges together. */
export type Placement = Side | `${Side}-${Align}`;

export interface Box {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface Placed {
  left: number;
  top: number;
  /** The side the panel ended up on, which differs from the one asked for if it was flipped. */
  side: Side;
  /** Set when the panel is taller than the room on its side: it should scroll within this height. */
  maxHeight?: number;
}

const opposite: Record<Side, Side> = { top: "bottom", bottom: "top", left: "right", right: "left" };

export function parsePlacement(placement: Placement): { side: Side; align?: Align } {
  const [side, align] = placement.split("-") as [Side, Align | undefined];
  return { side, align };
}

/**
 * Place a panel of `size` next to `anchor`, inside a viewport of `view`.
 *
 * - The panel goes on the requested side, with `gap` between it and the anchor. If it does not fit
 *   there and the opposite side has more room, it flips to that side.
 * - Along the side it is aligned to the anchor's start, end or centre. If that runs out of the
 *   viewport it tries the other end, and failing that is pushed back in.
 * - Nothing comes closer to the viewport's edge than `margin`.
 * - If it fits on neither side, it takes the side with more room and reports a `maxHeight`.
 *
 * A point (a context menu's) is an anchor with no width and height.
 */
export function place(
  anchor: Box,
  size: { width: number; height: number },
  placement: Placement,
  view: { width: number; height: number },
  gap: number,
  margin: number,
): Placed {
  const wanted = parsePlacement(placement);
  const vertical = wanted.side === "top" || wanted.side === "bottom";

  // Room on each side of the anchor, along the main axis (the one that points away from it).
  const room: Record<Side, number> = {
    top: anchor.top - gap - margin,
    bottom: view.height - margin - (anchor.top + anchor.height) - gap,
    left: anchor.left - gap - margin,
    right: view.width - margin - (anchor.left + anchor.width) - gap,
  };
  const need = vertical ? size.height : size.width;

  let side = wanted.side;
  if (room[side] < need && room[opposite[side]] > room[side]) side = opposite[side];

  let maxHeight: number | undefined;
  if (vertical && room[side] < need) maxHeight = Math.max(0, room[side]);

  const height = maxHeight === undefined ? size.height : Math.min(size.height, maxHeight);

  // Main axis.
  let main: number;
  if (side === "bottom") main = anchor.top + anchor.height + gap;
  else if (side === "top") main = anchor.top - gap - height;
  else if (side === "right") main = anchor.left + anchor.width + gap;
  else main = anchor.left - gap - size.width;

  // Cross axis.
  const start = vertical ? anchor.left : anchor.top;
  const length = vertical ? anchor.width : anchor.height;
  const extent = vertical ? size.width : height;
  const limit = (vertical ? view.width : view.height) - margin;

  const at = (align: Align | undefined) =>
    align === "start" ? start : align === "end" ? start + length - extent : start + length / 2 - extent / 2;
  const fits = (value: number) => value >= margin && value + extent <= limit;

  let cross = at(wanted.align);
  if (!fits(cross) && wanted.align) {
    const other = at(wanted.align === "start" ? "end" : "start");
    if (fits(other)) cross = other;
  }
  // Pushed back in; the start wins if the panel is wider than the viewport.
  cross = Math.max(margin, Math.min(cross, limit - extent));

  return vertical
    ? { left: cross, top: main, side, maxHeight }
    : { left: main, top: cross, side, maxHeight: undefined };
}
