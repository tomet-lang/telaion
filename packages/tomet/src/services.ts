/** A range of the source to color. Offsets count UTF-16 code units, as CodeMirror and JavaScript do. */
export type HighlightSpan = {
  readonly from: number;
  readonly to: number;
  /** What the range is, in the vocabulary of the Tomet highlighter, for example `heading` or `string`. */
  readonly tag: string;
};

/** An unresolved `@conflict`. Offsets count UTF-16 code units. */
export type Conflict = {
  readonly index: number;
  readonly kind: "block" | "inline" | "scalar";
  readonly from: number;
  readonly to: number;
  /** The text of each side. */
  readonly a: string;
  readonly b: string;
};

type MaybePromise<T> = T | Promise<T>;

/**
 * What Telaion needs from Tomet.
 *
 * Telaion carries no Tomet engine. An application already has one, as WebAssembly or as Rust,
 * and passes an implementation backed by it. Every method may answer at once or later: a
 * WebAssembly engine is immediate, a desktop shell reaches Rust through a message.
 */
export interface TometServices {
  highlight(source: string): MaybePromise<readonly HighlightSpan[]>;
  listConflicts(source: string): MaybePromise<readonly Conflict[]>;
  /** The source with the conflict at `index` replaced by the chosen side. */
  resolveConflict(source: string, index: number, side: "a" | "b"): MaybePromise<string>;
}
