import { getContext, setContext } from "svelte";

/** What a Field tells the control inside it, so the label and the messages are wired automatically. */
export type FieldContext = {
  readonly id: string;
  readonly describedby: string | undefined;
  readonly invalid: boolean;
};

const key = Symbol("telaion.field");

export function setFieldContext(context: FieldContext): void {
  setContext(key, context);
}

/** The enclosing Field, or undefined when the control is used on its own. */
export function getFieldContext(): FieldContext | undefined {
  return getContext<FieldContext | undefined>(key);
}
