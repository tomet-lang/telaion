<script lang="ts">
  import { Alert, Badge, Button, Spinner } from "@telaion/ui";
  import type { Conflict, TometServices } from "./services.ts";

  let {
    content,
    services,
    onResolve,
    onManualEdit,
  }: {
    /** The document, with its unresolved `@conflict` markers. */
    content: string;
    services: Pick<TometServices, "listConflicts" | "resolveConflict">;
    /** Called with the document after one conflict was resolved. */
    onResolve: (content: string) => void;
    /** When given, the empty state offers a way back to the editor. */
    onManualEdit?: () => void;
  } = $props();

  // undefined until the first answer. A later answer replaces the list without emptying it first.
  let conflicts = $state<readonly Conflict[] | undefined>();
  let failure = $state<string | undefined>();
  let resolving = $state(false);
  let asked = 0;

  $effect(() => {
    const source = content;
    const ask = ++asked;
    Promise.resolve()
      .then(() => services.listConflicts(source))
      .then(
        (list) => {
          if (ask !== asked) return; // The text changed since; this answer is old.
          conflicts = list;
          failure = undefined;
        },
        (error) => {
          if (ask !== asked) return;
          failure = describe(error, "Could not read the conflicts");
        },
      );
  });

  async function choose(index: number, side: "a" | "b") {
    resolving = true;
    failure = undefined;
    try {
      onResolve(await services.resolveConflict(content, index, side));
    } catch (error) {
      failure = describe(error, "Could not resolve the conflict");
    } finally {
      resolving = false;
    }
  }

  function describe(error: unknown, fallback: string): string {
    return error instanceof Error && error.message ? `${fallback}: ${error.message}` : fallback;
  }
</script>

<div class="tln-conflicts">
  {#if failure}
    <Alert tone="danger" onDismiss={() => (failure = undefined)}>{failure}</Alert>
  {/if}

  {#if conflicts === undefined}
    {#if !failure}
      <div class="tln-conflicts-loading"><Spinner label="Reading the conflicts" /></div>
    {/if}
  {:else if conflicts.length > 0}
    <Alert tone="warn">
      <strong>{conflicts.length} {conflicts.length === 1 ? "conflict" : "conflicts"} found.</strong>
      Concurrent edits were made. Both versions were kept. Choose which one to keep for each, or
      edit the document by hand.
    </Alert>

    <ol class="tln-conflict-list">
      {#each conflicts as conflict, position (conflict.index)}
        <li class="tln-conflict">
          <div class="tln-conflict-header">
            <Badge tone="warn">Conflict {position + 1} · {conflict.kind}</Badge>
          </div>
          <div class="tln-conflict-sides">
            {#each [{ side: "a", label: "Version A (current)", text: conflict.a }, { side: "b", label: "Version B (incoming)", text: conflict.b }] as const as version (version.side)}
              <div class="tln-conflict-side">
                <div class="tln-conflict-side-header">
                  <span class="tln-conflict-label">{version.label}</span>
                  <Button
                    disabled={resolving}
                    aria-label="Accept version {version.side.toUpperCase()} of conflict {position + 1}"
                    onclick={() => choose(conflict.index, version.side)}
                  >
                    Accept {version.side.toUpperCase()}
                  </Button>
                </div>
                <pre class="tln-conflict-text">{version.text}</pre>
              </div>
            {/each}
          </div>
        </li>
      {/each}
    </ol>
  {:else}
    <div class="tln-conflicts-empty">
      <Alert tone="ok">
        <strong>All conflicts are resolved.</strong> No unresolved conflict is left in this document.
      </Alert>
      {#if onManualEdit}
        <Button variant="primary" onclick={onManualEdit}>Back to the editor</Button>
      {/if}
    </div>
  {/if}
</div>

<style>
  .tln-conflicts {
    display: grid;
    gap: calc(var(--tln-space) * 4);
    align-content: start;
    height: 100%;
    padding: calc(var(--tln-space) * 4);
    overflow-y: auto;
    box-sizing: border-box;
    color: var(--tln-fg);
    background: var(--tln-bg);
  }

  .tln-conflicts-loading {
    display: grid;
    place-items: center;
    padding: calc(var(--tln-space) * 8);
    font-size: var(--tln-text-md);
  }

  .tln-conflicts-empty {
    display: grid;
    gap: calc(var(--tln-space) * 3);
    justify-items: start;
  }

  .tln-conflict-list {
    display: grid;
    gap: calc(var(--tln-space) * 4);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .tln-conflict {
    display: grid;
    gap: calc(var(--tln-space) * 3);
    padding: calc(var(--tln-space) * 3);
    background: var(--tln-bg-subtle);
    border: 1px solid var(--tln-border);
    border-radius: var(--tln-radius);
  }

  .tln-conflict-sides {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(calc(var(--tln-space) * 70), 1fr));
    gap: calc(var(--tln-space) * 3);
  }

  .tln-conflict-side {
    display: grid;
    gap: calc(var(--tln-space) * 2);
    align-content: start;
    min-width: 0;
  }

  .tln-conflict-side-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: calc(var(--tln-space) * 2);
  }

  .tln-conflict-label {
    font-size: var(--tln-text-sm);
    color: var(--tln-fg-muted);
  }

  .tln-conflict-text {
    margin: 0;
    padding: calc(var(--tln-space) * 3);
    font-family: var(--tln-font-mono);
    font-size: var(--tln-text-sm);
    line-height: var(--tln-leading);
    background: var(--tln-bg-sunken);
    border: 1px solid var(--tln-border);
    border-radius: var(--tln-radius);
    white-space: pre-wrap;
    overflow-wrap: anywhere;
  }
</style>
