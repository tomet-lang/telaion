import { getContext, setContext } from "svelte";

/** What a Popover tells what is inside it. A Menu uses this to close its popover once an item is chosen. */
export interface PopoverContext {
  /** Close the popover and give the focus back to what opened it. */
  close: () => void;
  /** The popover's accessible name, which a Menu inside it takes as its own unless it has one. */
  readonly label: string;
}

const key = Symbol("telaion popover");

export function setPopoverContext(context: PopoverContext): void {
  setContext(key, context);
}

export function getPopoverContext(): PopoverContext | undefined {
  return getContext<PopoverContext | undefined>(key);
}
