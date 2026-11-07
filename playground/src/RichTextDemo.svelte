<script lang="ts">
  import type { Content, Editor } from "@tiptap/core";
  import Link from "@tiptap/extension-link";
  import { RichText } from "@telaion/editor/rich-text";
  import { Badge, Button, IconButton, Toolbar } from "@telaion/primitives";
  import { Bold, Heading2, Italic, List } from "@telaion/primitives/icons";
  import { Callout, HeadingMarkers } from "@telaion/tomet/rich-text";

  // Links are not in the StarterKit: an application brings the extension, as it does its own.
  const extensions = [Link.configure({ openOnClick: false }), Callout, HeadingMarkers.configure({ shown: false })];
  const plain = [Link.configure({ openOnClick: false })];

  const article = `
    <h1>Writing in a pane</h1>
    <p>Body text is <strong>strong</strong>, <em>emphasised</em>, <s>struck</s>, has <code>inline code</code> and a <a href="https://example.com/">link to read more</a>. A paragraph is long enough to wrap onto a second line, so that the leading and the measure of read text can be seen.</p>
    <h2>Lists and quotes</h2>
    <ul><li>An item</li><li>Another item<ul><li>Nested, with a circle</li></ul></li></ul>
    <ol><li>First</li><li>Second</li></ol>
    <blockquote><p>A quote is set back and quieter, with a rule one hairline thick.</p></blockquote>
    <h3>Code</h3>
    <pre><code>const answer = 42;\nconsole.log(answer);</code></pre>
    <h4>Fourth</h4><h5>Fifth</h5><h6>Sixth</h6>
    <hr>
    <p>After the rule.</p>`;

  const callouts = `
    <p>Four kinds of callout, one for each tone:</p>
    <div data-callout="note"><p>A note: the accent.</p></div>
    <div data-callout="tip"><p>A tip: ok.</p></div>
    <div data-callout="warning"><p>A warning: warn, with <strong>strong</strong> text and <code>code</code>.</p></div>
    <div data-callout="danger"><p>Danger: the danger tone.</p><ul><li>holding a list</li></ul></div>`;

  const replacement = "<h1>Replaced from outside</h1><p>The binding changed; nothing was typed.</p>";

  // The field: HTML in, HTML out.
  let fieldContent = $state<Content>(article);
  let fieldEditor = $state<Editor | null>(null);
  let fieldChanges = $state(0);
  let markers = $state(false);

  // The pane: JSON in, JSON out.
  let paneContent = $state<Content>({
    type: "doc",
    content: [
      { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "A bare pane" }] },
      { type: "paragraph", content: [{ type: "text", text: "Text on whatever the parent paints. Focus shows in the caret and the selection." }] },
    ],
  });
  let paneChanges = $state(0);
  let paneFocused = $state(false);

  let emptyChanges = $state(0);
  let calloutContent = $state<Content>(callouts);
  let calloutEditor = $state<Editor | null>(null);

  const active = (name: string, attrs?: Record<string, unknown>) => fieldEditor?.isActive(name, attrs) ?? false;
</script>

<div class="demo">
  <div class="cell tall">
    <p class="caption">
      variant="field" (the default), HTML in and out, a toolbar that runs commands on the bound editor.
      <Badge tone="neutral">changes <span aria-label="field changes">{fieldChanges}</span></Badge>
    </p>
    <Toolbar label="Formatting">
      <IconButton icon={Bold} label="Bold" size="sm" onclick={() => fieldEditor?.chain().focus().toggleBold().run()} />
      <IconButton icon={Italic} label="Italic" size="sm" onclick={() => fieldEditor?.chain().focus().toggleItalic().run()} />
      <IconButton icon={Heading2} label="Heading 2" size="sm" onclick={() => fieldEditor?.chain().focus().toggleHeading({ level: 2 }).run()} />
      <IconButton icon={List} label="Bullet list" size="sm" onclick={() => fieldEditor?.chain().focus().toggleBulletList().run()} />
      <Button size="sm" onclick={() => fieldEditor?.chain().focus().toggleCallout({ type: "tip" }).run()}>Tip callout</Button>
      <Button
        size="sm"
        onclick={() => {
          markers = !markers;
          fieldEditor?.commands.setHeadingMarkers(markers);
        }}
      >
        Heading markers: {markers ? "on" : "off"}
      </Button>
      <Button size="sm" onclick={() => (fieldContent = replacement)}>Replace from outside</Button>
    </Toolbar>
    <div class="slot">
      <RichText
        bind:content={fieldContent}
        bind:editor={fieldEditor}
        format="html"
        label="Field rich text"
        {extensions}
        onChange={() => fieldChanges++}
      />
    </div>
  </div>

  <div class="cell tall">
    <p class="caption">
      variant="bare": the editor is the pane, JSON in and out. Focus shows in caret and selection.
      <Badge tone="neutral">changes <span aria-label="pane changes">{paneChanges}</span></Badge>
      <Badge tone={paneFocused ? "accent" : "neutral"}>pane focus-within: {paneFocused ? "yes" : "no"}</Badge>
    </p>
    <div
      class="pane"
      role="group"
      aria-label="Rich text pane"
      onfocusin={() => (paneFocused = true)}
      onfocusout={() => (paneFocused = false)}
    >
      <RichText
        variant="bare"
        bind:content={paneContent}
        label="Bare rich text"
        placeholder="Write something"
        extensions={plain}
        onChange={() => paneChanges++}
      />
    </div>
  </div>

  <div class="cell">
    <p class="caption">
      An empty document shows its placeholder.
      <Badge tone="neutral">changes <span aria-label="empty changes">{emptyChanges}</span></Badge>
    </p>
    <div class="slot">
      <RichText
        content={null}
        label="Empty rich text"
        placeholder="Start writing here"
        onChange={() => emptyChanges++}
      />
    </div>
  </div>

  <div class="cell">
    <p class="caption">readOnly: it can be selected and read, not typed into.</p>
    <div class="slot">
      <RichText
        content={'<h2>Read only</h2><p>Nothing here can be changed. <a href="https://example.com/">A link</a>.</p>'}
        format="html"
        readOnly
        label="Read-only rich text"
        extensions={plain}
        placeholder="Never shown"
      />
    </div>
  </div>

  <div class="cell tall">
    <p class="caption">The Tomet callouts, in a pane: note, tip, warning, danger.</p>
    <div class="pane">
      <RichText
        variant="bare"
        bind:content={calloutContent}
        bind:editor={calloutEditor}
        format="html"
        label="Callouts"
        {extensions}
      />
    </div>
  </div>

  <div class="cell tall">
    <p class="caption">The same document with Tomet's heading markers (hybrid view).</p>
    <div class="pane">
      <RichText
        variant="bare"
        content={article}
        format="html"
        label="Heading markers"
        extensions={[Link, HeadingMarkers]}
      />
    </div>
  </div>
</div>

<style>
  .demo {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(calc(var(--tln-space) * 90), 1fr));
    gap: calc(var(--tln-space) * 4);
  }

  .cell {
    display: flex;
    flex-direction: column;
    gap: calc(var(--tln-space) * 2);
    height: calc(var(--tln-space) * 44);
    min-width: 0;
  }

  .cell.tall {
    height: calc(var(--tln-space) * 110);
  }

  .caption {
    margin: 0;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: calc(var(--tln-space) * 2);
    font-size: var(--tln-text-xs);
    color: var(--tln-fg-muted);
  }

  .slot,
  .pane {
    flex: 1;
    min-height: 0;
  }

  .pane {
    background: var(--tln-content);
    border-radius: var(--tln-radius);
    box-shadow: var(--tln-shadow-content);
    overflow: hidden;
  }
</style>
