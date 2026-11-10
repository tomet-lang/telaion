<script lang="ts">
  import {
    Button,
    Checkbox,
    EmptyState,
    Field,
    Icon,
    IconButton,
    Input,
    Kbd,
    Radio,
    SegmentedControl,
    Slider,
    Switch,
    Tabs,
    Toolbar,
  } from "@telaion/primitives";
  import {
    Bold,
    Code,
    Eye,
    FileText,
    FilePlus,
    Inbox,
    Italic,
    Link,
    Save,
    SquareKanban,
  } from "@telaion/primitives/icons";

  // ---- Tabs --------------------------------------------------------------------------------
  const allDocuments = [
    { id: "alpha", label: "alpha.tmt", icon: FileText, title: "notes/projects/alpha.tmt", closable: true, dirty: true },
    { id: "beta", label: "beta.tmt", icon: FileText, title: "notes/projects/beta.tmt", closable: true },
    { id: "gamma", label: "gamma.tmt", icon: FileText, title: "notes/gamma.tmt", closable: true, dirty: true },
    { id: "pinned", label: "pinned.tmt", icon: FileText, title: "notes/pinned.tmt (cannot be closed)" },
  ];
  let documents = $state(allDocuments);
  let current = $state("alpha");
  let selectedLog = $state("none");
  let closedLog = $state("none");

  function closeDocument(id: string) {
    closedLog = id;
    const index = documents.findIndex((item) => item.id === id);
    documents = documents.filter((item) => item.id !== id);
    if (current === id) current = (documents[index] ?? documents[index - 1])?.id ?? "";
  }

  let compactTabs = $state(allDocuments.map((item) => ({ ...item })));
  let compactCurrent = $state("beta");

  // ---- SegmentedControl ----------------------------------------------------------------------
  const modes = [
    { value: "source", label: "Source", icon: Code, title: "Edit the source" },
    { value: "hybrid", label: "Hybrid", icon: Eye },
    { value: "full", label: "Full", icon: FileText },
    { value: "kanban", label: "Kanban", icon: SquareKanban },
  ];
  let mode = $state("hybrid");
  let modeLog = $state("none");
  let compactMode = $state("source");
  let iconMode = $state("full");
  let withDisabled = $state("source");
  let disabledMode = $state("hybrid");

  // ---- Toolbar and Input ---------------------------------------------------------------------
  let bold = $state(false);
  let saves = $state(0);
  let toolbarMode = $state("source");
  let path = $state("notes/projects/alpha.tmt");
  let compactPath = $state("notes/projects/alpha.tmt");
  let typed = $state("nothing yet");
  let entered = $state(0);
  let slug = $state("first-draft");

  // ---- Checkbox, Radio, Switch, Slider -------------------------------------------------------
  let agreed = $state(true);
  let plain = $state(false);
  let partial = $state(false);
  let parts = $state([true, false, false]);
  const allParts = $derived(parts.every(Boolean) ? "all" : parts.some(Boolean) ? "some" : "none");
  let plan = $state("monthly");
  let notifications = $state(true);
  let autosave = $state(false);
  let volume = $state(40);
  let opacity = $state(0.5);
  let confirmed = $state(false);
</script>

<div class="demo">
  <h3>Tabs</h3>
  <div class="card">
    <Tabs
      label="Open documents"
      items={documents}
      bind:value={current}
      onselect={(id) => (selectedLog = id)}
      onclose={closeDocument}
    />
    <p class="muted">
      selected = <code>{current}</code> · picked = <code>{selectedLog}</code> · closed = <code>{closedLog}</code>
    </p>
    <Tabs label="Open documents, compact" size="sm" items={compactTabs} bind:value={compactCurrent} onclose={() => {}} />
    <p class="muted">size sm</p>
    <div class="row"><Button onclick={() => ((documents = allDocuments), (current = "alpha"))}>Reopen all</Button></div>
  </div>

  <h3>SegmentedControl</h3>
  <div class="card">
    <div class="row">
      <SegmentedControl label="Editing mode" items={modes} bind:value={mode} onchange={(v) => (modeLog = v)} />
      <span class="muted">value = <code>{mode}</code> · changed = <code>{modeLog}</code></span>
    </div>
    <div class="row">
      <SegmentedControl label="Editing mode, compact" size="sm" items={modes} bind:value={compactMode} />
      <span class="muted">size sm</span>
    </div>
    <div class="row">
      <SegmentedControl label="Editing mode, icons" iconOnly items={modes} bind:value={iconMode} />
      <span class="muted">iconOnly</span>
    </div>
    <div class="row">
      <SegmentedControl
        label="Editing mode, one unavailable"
        items={modes.map((m) => ({ ...m, disabled: m.value === "hybrid" }))}
        bind:value={withDisabled}
      />
      <span class="muted">one item disabled</span>
    </div>
    <div class="row">
      <SegmentedControl label="Editing mode, disabled" disabled items={modes} bind:value={disabledMode} />
      <span class="muted">disabled</span>
    </div>
  </div>

  <h3>Checkbox, Radio, Switch, Slider</h3>
  <div class="card">
    <div class="row">
      <Checkbox bind:checked={agreed} label="Checked" />
      <Checkbox bind:checked={plain} label="Unchecked" />
      <Checkbox
        indeterminate={allParts === "some"}
        checked={allParts === "all"}
        onchange={(e) => (parts = parts.map(() => e.currentTarget.checked))}
        label="Some of three"
      />
      <Checkbox checked disabled label="Disabled, checked" />
      <Checkbox disabled label="Disabled" />
      <Checkbox bind:checked={partial} invalid label="Invalid" />
    </div>
    <div class="row">
      {#each parts as _, i}
        <Checkbox bind:checked={parts[i]} label={`Part ${i + 1}`} />
      {/each}
      <span class="muted">state = <code>{allParts}</code></span>
    </div>
    <div class="row">
      <Radio name="plan" value="monthly" bind:group={plan} label="Monthly" />
      <Radio name="plan" value="yearly" bind:group={plan} label="Yearly" />
      <Radio name="plan" value="never" bind:group={plan} label="Never" disabled />
      <span class="muted">plan = <code>{plan}</code></span>
    </div>
    <div class="row">
      <Switch bind:checked={notifications} label="Notifications" />
      <Switch bind:checked={autosave} label="Autosave" />
      <Switch checked disabled label="Disabled, on" />
      <Switch disabled label="Disabled, off" />
      <span class="muted">notifications = <code>{notifications}</code> · autosave = <code>{autosave}</code></span>
    </div>
    <div class="row">
      <Slider label="Volume" bind:value={volume} showValue />
      <Slider label="Opacity" min={0} max={1} step={0.05} bind:value={opacity} showValue format={(v) => v.toFixed(2)} />
    </div>
    <div class="row">
      <Slider label="Disabled" value={60} disabled showValue />
    </div>
    <div class="form">
      <Field label="Confirmation" hint="Both are needed." error={confirmed ? undefined : "Confirm to continue."}>
        <Checkbox bind:checked={confirmed} label="I have read it" />
      </Field>
    </div>
  </div>

  <h3>Toolbar</h3>
  <div class="card">
    <Toolbar label="Formatting">
      <IconButton icon={Bold} label="Bold" variant={bold ? "secondary" : "quiet"} aria-pressed={bold} onclick={() => (bold = !bold)} />
      <IconButton icon={Italic} label="Italic" />
      <IconButton icon={Link} label="Link" />
      <SegmentedControl label="Toolbar mode" size="sm" items={modes} bind:value={toolbarMode} />
      <Input size="sm" aria-label="Toolbar search" type="search" placeholder="Search" />
      <Button onclick={() => saves++}><Icon icon={Link} /> Share</Button>
      <Button variant="primary" onclick={() => saves++}>Save</Button>
      <IconButton icon={Save} label="Save all" disabled />
    </Toolbar>
    <p class="muted">saved {saves} times · arrow keys move between the controls; Tab leaves the bar</p>
    <Toolbar label="Formatting, vertical" orientation="vertical">
      <IconButton icon={Bold} label="Vertical bold" />
      <IconButton icon={Italic} label="Vertical italic" />
      <IconButton icon={Link} label="Vertical link" />
    </Toolbar>
  </div>

  <h3>Kbd</h3>
  <div class="card">
    <div class="row">
      <span>Open <Kbd keys={["Ctrl", "P"]} /></span>
      <span>Close <Kbd keys={["Esc"]} /></span>
      <span>Save <Kbd keys={["Ctrl", "Shift", "S"]} /></span>
      <span>Enter <Kbd>Enter</Kbd></span>
      <Button>Search <Kbd keys={["Ctrl", "K"]} /></Button>
    </div>
  </div>

  <h3>EmptyState</h3>
  <div class="card">
    <EmptyState
      icon={Inbox}
      title="No document open"
      description="Pick a page from the tree, or start a new one."
    >
      {#snippet action()}
        <Button variant="primary"><Icon icon={FilePlus} /> New page</Button>
      {/snippet}
    </EmptyState>
    <EmptyState title="Nothing here yet" />
  </div>

  <h3>Input</h3>
  <div class="card">
    <div class="form">
      <Input aria-label="Plain" placeholder="Plain" value="Plain text" />
      <Input aria-label="Path, monospace" mono bind:value={path} placeholder="notes/idea.tmt" />
      <Input
        aria-label="Slug, entered with Enter"
        mono
        size="sm"
        bind:value={slug}
        onkeydown={(event) => {
          typed = event.key;
          if (event.key === "Enter") entered++;
        }}
      />
      <Input aria-label="Compact" size="sm" bind:value={compactPath} />
      <Input aria-label="Compact, monospace, invalid" size="sm" mono invalid value="not/a/path" />
      <Input aria-label="Disabled" size="sm" mono disabled value="disabled.tmt" />
    </div>
    <p class="muted">last key = <code>{typed}</code> · Enter pressed {entered} times</p>
  </div>
</div>

<style>
  .demo {
    display: grid;
    gap: calc(var(--tln-space) * 3);
  }

  h3 {
    margin: 0;
    font-size: var(--tln-text-sm);
    color: var(--tln-fg-muted);
  }

  /* A surface that only holds controls is content. */
  .card {
    display: grid;
    gap: calc(var(--tln-space) * 3);
    padding: calc(var(--tln-space) * 4);
    background: var(--tln-content);
    border-radius: var(--tln-radius);
    box-shadow: var(--tln-shadow-content);
  }

  .row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: calc(var(--tln-space) * 3);
  }

  .form {
    display: grid;
    gap: calc(var(--tln-space) * 3);
    max-width: calc(var(--tln-space) * 100);
  }

  p {
    margin: 0;
  }

  .muted {
    font-size: var(--tln-text-sm);
    color: var(--tln-fg-muted);
  }
</style>
