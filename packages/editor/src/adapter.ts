/**
 * Where a document lives. The application supplies one; the editor never knows whether
 * it is a local file, a GitHub repository, or a test double.
 */
export interface DocumentAdapter {
  /** Read a document. `rev` identifies this version, for conflict detection on save. */
  load(path: string): Promise<{ content: string; rev?: string }>;
  /**
   * Write a document. `base` is the `rev` the edit started from. When the stored version
   * has moved on since, resolve with a conflict instead of overwriting it.
   */
  save(path: string, content: string, base?: string): Promise<SaveResult>;
}

export type SaveResult =
  | { ok: true; rev?: string }
  | { ok: false; conflict: { remote: string; rev?: string } };
