<script lang="ts">
  import type { Extension } from "@codemirror/state";
  import { Alert, Badge, Button, Spinner } from "@telaion/ui";
  import CodeEditor from "./CodeEditor.svelte";
  import type { DocumentSession } from "./session.svelte.ts";

  let {
    session,
    language,
    readOnly = false,
  }: {
    session: DocumentSession;
    /** Syntax support, as a CodeMirror extension. */
    language?: Extension;
    readOnly?: boolean;
  } = $props();

  const state = $derived(
    session.conflict
      ? { tone: "warn" as const, text: "Conflict" }
      : session.status === "saving"
        ? { tone: "accent" as const, text: "Saving" }
        : session.dirty
          ? { tone: "warn" as const, text: "Unsaved" }
          : { tone: "ok" as const, text: "Saved" },
  );
</script>

<div class="tln-editor">
  <header class="tln-editor-bar">
    <span class="tln-editor-path" title={session.path}>{session.path}</span>
    <Badge tone={state.tone}>{state.text}</Badge>
    <span class="tln-editor-spacer"></span>
    <Button
      variant="primary"
      disabled={readOnly || !session.dirty || session.status !== "ready"}
      onclick={() => session.save()}
    >
      Save
    </Button>
  </header>

  {#if session.error}
    <Alert tone="danger" onDismiss={() => session.dismissError()}>{session.error}</Alert>
  {/if}
  {#if session.conflict}
    <Alert tone="warn">
      The stored version changed since you started editing. Your text is kept and was not saved.
    </Alert>
  {/if}

  <div class="tln-editor-body">
    {#if session.status === "loading"}
      <div class="tln-editor-loading"><Spinner label="Loading document" /></div>
    {:else}
      <CodeEditor
        bind:content={session.content}
        {language}
        {readOnly}
        onSave={() => session.save()}
      />
    {/if}
  </div>
</div>

<style>
  .tln-editor {
    display: flex;
    flex-direction: column;
    gap: calc(var(--tln-space) * 2);
    height: 100%;
    min-height: 0;
  }

  .tln-editor-bar {
    display: flex;
    align-items: center;
    gap: calc(var(--tln-space) * 3);
    padding: calc(var(--tln-space) * 2) calc(var(--tln-space) * 3);
    background: var(--tln-bg-subtle);
    border: 1px solid var(--tln-border);
    border-radius: var(--tln-radius);
  }

  .tln-editor-path {
    min-width: 0;
    overflow: hidden;
    font-family: var(--tln-font-mono);
    font-size: var(--tln-text-sm);
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .tln-editor-spacer {
    flex: 1;
  }

  .tln-editor-body {
    flex: 1;
    min-height: 0;
    border: 1px solid var(--tln-border-strong);
    border-radius: var(--tln-radius);
    overflow: hidden;
  }

  .tln-editor-loading {
    display: grid;
    place-items: center;
    height: 100%;
    font-size: var(--tln-text-md);
  }
</style>
