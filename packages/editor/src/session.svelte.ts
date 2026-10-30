import type { DocumentAdapter } from "./adapter.ts";

export type SessionStatus = "idle" | "loading" | "ready" | "saving";

/**
 * One document being edited: what was loaded, what it is now, and whether saving it worked.
 * It has no view of its own; the Editor component shows it.
 */
export class DocumentSession {
  readonly path: string;
  readonly #adapter: DocumentAdapter;

  /** The text being edited. Bind an editor to it. */
  content = $state("");
  status = $state<SessionStatus>("idle");
  /** The last failure to load or save, ready to show. Cleared by the next attempt. */
  error = $state<string | undefined>();
  /** Set when a save found a newer stored version. The edit is kept; nothing was overwritten. */
  conflict = $state<{ remote: string; rev?: string } | undefined>();

  /** The text as it was last loaded or saved. */
  #original = $state("");
  #rev: string | undefined;
  /** Bumps on every load, so a slow load that was overtaken cannot overwrite a newer one. */
  #loadId = 0;

  readonly dirty = $derived(this.content !== this.#original);

  constructor(adapter: DocumentAdapter, path: string) {
    this.#adapter = adapter;
    this.path = path;
  }

  async load(): Promise<void> {
    const id = ++this.#loadId;
    this.status = "loading";
    this.error = undefined;
    this.conflict = undefined;
    try {
      const loaded = await this.#adapter.load(this.path);
      if (id !== this.#loadId) return;
      this.#original = loaded.content;
      this.content = loaded.content;
      this.#rev = loaded.rev;
      this.status = "ready";
    } catch (cause) {
      if (id !== this.#loadId) return;
      this.error = describe(cause, "Could not load the document");
      this.status = "idle";
    }
  }

  /** Save the current text. Does nothing when there is nothing to save or a save is running. */
  async save(): Promise<void> {
    if (!this.dirty || this.status !== "ready") return;
    // What is written is what was typed *now*; typing during the request stays unsaved.
    const saving = this.content;
    this.status = "saving";
    this.error = undefined;
    try {
      const result = await this.#adapter.save(this.path, saving, this.#rev);
      if (result.ok) {
        this.#original = saving;
        this.#rev = result.rev;
        this.conflict = undefined;
      } else {
        this.conflict = result.conflict;
      }
    } catch (cause) {
      this.error = describe(cause, "Could not save the document");
    } finally {
      this.status = "ready";
    }
  }

  /** Dismiss the shown error without retrying. */
  dismissError(): void {
    this.error = undefined;
  }
}

function describe(cause: unknown, fallback: string): string {
  return cause instanceof Error && cause.message ? `${fallback}: ${cause.message}` : fallback;
}
