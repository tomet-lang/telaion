import type { DocumentAdapter, SaveResult } from "@telaion/editor";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** A DocumentAdapter that keeps documents in memory, slowly, and can be made to misbehave. */
export class MemoryAdapter implements DocumentAdapter {
  readonly #files = new Map<string, { content: string; rev: number }>();
  readonly #delay: number;
  readonly #onSaved: (path: string, content: string) => void;
  failNextSave = false;

  constructor(
    initial: Record<string, string>,
    delay: number,
    onSaved: (path: string, content: string) => void,
  ) {
    for (const [path, content] of Object.entries(initial)) this.#files.set(path, { content, rev: 1 });
    this.#delay = delay;
    this.#onSaved = onSaved;
  }

  async load(path: string) {
    await sleep(this.#delay);
    const file = this.#files.get(path);
    if (!file) throw new Error(`${path} does not exist`);
    return { content: file.content, rev: String(file.rev) };
  }

  async save(path: string, content: string, base?: string): Promise<SaveResult> {
    await sleep(this.#delay);
    if (this.failNextSave) {
      this.failNextSave = false;
      throw new Error("the network is down");
    }
    const file = this.#files.get(path);
    if (!file) throw new Error(`${path} does not exist`);
    if (base !== String(file.rev)) {
      return { ok: false, conflict: { remote: file.content, rev: String(file.rev) } };
    }
    file.content = content;
    file.rev += 1;
    this.#onSaved(path, content);
    return { ok: true, rev: String(file.rev) };
  }

  /** Pretend someone else saved the document in the meantime. */
  remoteEdit(path: string, content: string): void {
    const file = this.#files.get(path);
    if (file) {
      file.content = content;
      file.rev += 1;
    }
  }
}
