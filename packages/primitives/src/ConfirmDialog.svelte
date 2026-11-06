<script lang="ts">
  import type { Snippet } from "svelte";
  import Button from "./Button.svelte";
  import Icon from "./Icon.svelte";
  import Modal from "./Modal.svelte";
  import "./looks.css";
  import { CircleAlert, CircleCheck, Info, TriangleAlert } from "./icons.generated.js";

  let {
    open = $bindable(false),
    title,
    message,
    tone,
    destructive = false,
    confirm = "OK",
    cancel = "Cancel",
    alternative,
    alternativeVariant = "secondary",
    onconfirm,
    oncancel,
    onalternative,
  }: {
    open?: boolean;
    /** What is being asked, shown in the header and read out as the name of the dialog. */
    title: string;
    /** The question. A string, or a snippet for anything richer (the name of a file in code, say). */
    message: string | Snippet;
    /** Which icon and color the message carries. Danger when `destructive`, otherwise info. */
    tone?: "ok" | "warn" | "danger" | "info";
    /**
     * The confirm action destroys something. It is drawn as a filled danger button, and the focus
     * starts on Cancel, so that pressing Enter at once does the safe thing.
     */
    destructive?: boolean;
    /** Label of the confirm action. Name the act ("Delete"), not the answer ("OK"). */
    confirm?: string;
    /** Label of the cancel action. */
    cancel?: string;
    /** Label of an optional third answer, between cancel and confirm: "Don't save". */
    alternative?: string;
    /** danger draws the third answer as a destructive one (the "Don't save" of an unsaved document). */
    alternativeVariant?: "secondary" | "danger";
    /** The person chose the confirm action. The dialog closes. */
    onconfirm?: () => void;
    /**
     * The person chose cancel, pressed Escape, clicked the backdrop or the close button:
     * everything that is not an answer. Called once. Not called when the application closes it.
     */
    oncancel?: () => void;
    /** The person chose the third answer. The dialog closes. */
    onalternative?: () => void;
  } = $props();

  const icons = { ok: CircleCheck, warn: TriangleAlert, danger: CircleAlert, info: Info };
  const shownTone = $derived(tone ?? (destructive ? "danger" : "info"));

  const uid = $props.id();
  const messageId = `${uid}-message`;

  // Every way out is an answer; whichever it is, the dialog closes and says so once.
  function answer(callback?: () => void) {
    open = false;
    callback?.();
  }
</script>

<Modal
  bind:open
  {title}
  size="sm"
  role="alertdialog"
  describedby={messageId}
  closeButton={false}
  onrequestclose={() => {
    answer(oncancel);
    // The modal is closed by `open` above; the request itself is refused so it does not close twice.
    return false;
  }}
>
  <div class="tln-confirm tln-tone" data-tone={shownTone}>
    <span class="tln-confirm-icon"><Icon icon={icons[shownTone]} /></span>
    <div class="tln-confirm-message" id={messageId}>
      {#if typeof message === "string"}{message}{:else}{@render message()}{/if}
    </div>
  </div>
  {#snippet footer()}
    <!-- The first control that asks for it takes the focus. The safe answer asks, not the last. -->
    {#key destructive}
      <Button autofocus={destructive} onclick={() => answer(oncancel)}>{cancel}</Button>
      {#if alternative}
        <Button variant={alternativeVariant} onclick={() => answer(onalternative)}>{alternative}</Button>
      {/if}
      <Button
        variant={destructive ? "danger-fill" : "primary"}
        autofocus={!destructive}
        onclick={() => answer(onconfirm)}
      >
        {confirm}
      </Button>
    {/key}
  {/snippet}
</Modal>

<style>
  /* The color of each tone is in looks.css. The icon is bare: color is the only thing it adds. */
  .tln-confirm {
    display: flex;
    align-items: flex-start;
    gap: calc(var(--tln-space) * 3);
  }

  .tln-confirm-icon {
    display: inline-flex;
    /* The icon's own size is 24px; the text beside it is 14px with a taller line. */
    font-size: calc(var(--tln-space) * 6);
    color: var(--tln-tone);
  }

  .tln-confirm-message {
    flex: 1;
    min-width: 0;
    line-height: var(--tln-leading);
    /* A path or a file name has no place to break. */
    overflow-wrap: anywhere;
  }
</style>
