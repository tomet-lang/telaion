<script lang="ts">
  import { Button, Field, Popover, Select } from "@telaion/primitives";
  import { Palette } from "@telaion/primitives/icons";
  import { contrast, inkOn, mixHex, rgbToHex, tokenColor } from "./color-math.js";
  import { schemes, type Ends } from "./color-schemes.js";

  // What the design is, read from the tokens before anything is overridden: "Default" is not a
  // copy of it here but the tokens themselves, and the pickers start from what they compute to.
  const read = (scheme: "light" | "dark"): Ends => ({
    dark: rgbToHex(tokenColor("--tln-depth-dark", scheme)),
    bright: rgbToHex(tokenColor("--tln-depth-bright", scheme)),
    accent: rgbToHex(tokenColor("--tln-accent", scheme)),
  });
  const designed = { light: read("light"), dark: read("dark") };

  const overridden = [
    "--tln-depth-dark",
    "--tln-depth-bright",
    "--tln-accent",
    "--tln-accent-hover",
    "--tln-accent-fg",
    "--tln-border",
  ];

  let open = $state(false);
  let schemeId = $state("default");
  let light = $state<Ends>({ ...designed.light });
  let dark = $state<Ends>({ ...designed.dark });

  type Reading = { onAccent: number; mutedOnAction: number };
  let reading = $state<{ light: Reading; dark: Reading }>({
    light: { onAccent: 0, mutedOnAction: 0 },
    dark: { onAccent: 0, mutedOnAction: 0 },
  });

  const rows = [
    { key: "dark", label: "Darkest end" },
    { key: "bright", label: "Brightest end" },
    { key: "accent", label: "Accent" },
  ] as const;

  const options = [
    { value: "default", label: "Default" },
    ...schemes.map((s) => ({ value: s.id, label: s.label })),
    { value: "custom", label: "Custom" },
  ];

  function choose(id: string) {
    schemeId = id;
    if (id === "default") {
      light = { ...designed.light };
      dark = { ...designed.dark };
    }
    const template = schemes.find((s) => s.id === id);
    if (template) {
      light = { ...template.light };
      dark = { ...template.dark };
    }
  }

  function pick(theme: "light" | "dark", key: keyof Ends, value: string) {
    (theme === "light" ? light : dark)[key] = value;
    schemeId = "custom";
  }

  const measure = (theme: "light" | "dark"): Reading => ({
    onAccent: contrast(tokenColor("--tln-accent-fg", theme), tokenColor("--tln-accent", theme)),
    mutedOnAction: contrast(tokenColor("--tln-fg-muted", theme), tokenColor("--tln-action", theme)),
  });

  $effect(() => {
    const root = document.documentElement.style;
    if (schemeId === "default") {
      for (const name of overridden) root.removeProperty(name);
    } else {
      const pair = (l: string, d: string) => `light-dark(${l}, ${d})`;
      root.setProperty("--tln-depth-dark", pair(light.dark, dark.dark));
      root.setProperty("--tln-depth-bright", pair(light.bright, dark.bright));
      root.setProperty("--tln-accent", pair(light.accent, dark.accent));
      // Hover goes toward the ink, as in the design: darker on light, lighter on dark.
      root.setProperty(
        "--tln-accent-hover",
        pair(mixHex(light.accent, "#000000", 0.15), mixHex(dark.accent, "#ffffff", 0.2)),
      );
      root.setProperty("--tln-accent-fg", pair(inkOn(light.accent), inkOn(dark.accent)));
      // A divider sits just beside the content layer, tinted by the same ends.
      root.setProperty(
        "--tln-border",
        pair(
          "color-mix(in oklab, var(--tln-layer-1) 35%, var(--tln-layer-3))",
          "color-mix(in oklab, var(--tln-layer-5) 20%, var(--tln-layer-3))",
        ),
      );
    }
    reading = { light: measure("light"), dark: measure("dark") };
  });

  // A reading that fails AA (4.5:1) is marked, so a pretty pick that cannot be read is seen at once.
  const mark = (ratio: number) => `${ratio.toFixed(1)} ${ratio >= 4.5 ? "✓" : "⚠"}`;
</script>

<Popover bind:open label="Colors" placement="bottom-end">
  {#snippet trigger(props)}
    <Button {...props} icon={Palette}>Colors</Button>
  {/snippet}
  <div class="panel">
    <Field label="Template">
      <Select {options} value={schemeId} onchange={(event) => choose(event.currentTarget.value)} />
    </Field>

    <div class="grid">
      <span></span>
      <span class="head">Light</span>
      <span class="head">Dark</span>
      {#each rows as row (row.key)}
        <span class="name">{row.label}</span>
        <input
          class="swatch"
          type="color"
          aria-label="{row.label}, light theme"
          value={light[row.key]}
          oninput={(event) => pick("light", row.key, event.currentTarget.value)}
        />
        <input
          class="swatch"
          type="color"
          aria-label="{row.label}, dark theme"
          value={dark[row.key]}
          oninput={(event) => pick("dark", row.key, event.currentTarget.value)}
        />
      {/each}
      <span class="name">Text on accent</span>
      <output class="reading">{mark(reading.light.onAccent)}</output>
      <output class="reading">{mark(reading.dark.onAccent)}</output>
      <span class="name">Muted text on buttons</span>
      <output class="reading">{mark(reading.light.mutedOnAction)}</output>
      <output class="reading">{mark(reading.dark.mutedOnAction)}</output>
    </div>

    <p class="note">The surfaces, the shadows and the lights are computed from the two ends. Contrast is a ratio; 4.5 is AA.</p>
    <div class="actions"><Button variant="quiet" onclick={() => choose("default")}>Reset</Button></div>
  </div>
</Popover>

<style>
  .panel {
    display: grid;
    gap: calc(var(--tln-space) * 3);
    width: calc(var(--tln-space) * 80);
    padding: calc(var(--tln-space) * 4);
    font-size: var(--tln-text-sm);
  }

  .grid {
    display: grid;
    grid-template-columns: 1fr auto auto;
    align-items: center;
    gap: calc(var(--tln-space) * 2) calc(var(--tln-space) * 4);
  }

  .head {
    color: var(--tln-fg-muted);
    font-size: var(--tln-text-xs);
    text-align: center;
  }

  .reading {
    min-width: 8ch;
    color: var(--tln-fg-muted);
    font-variant-numeric: tabular-nums;
    text-align: center;
  }

  /* The native colour field, made an action like the rest: raised, lit, shadowed. */
  .swatch {
    appearance: none;
    box-sizing: border-box;
    width: calc(var(--tln-space) * 12);
    height: calc(var(--tln-space) * 7);
    margin: 0;
    padding: var(--tln-space);
    background: var(--tln-action);
    border: 0;
    border-radius: var(--tln-radius);
    box-shadow: var(--tln-shadow-action);
    cursor: pointer;
    justify-self: center;
  }
  .swatch:hover {
    box-shadow: var(--tln-shadow-action-hover);
  }
  .swatch:focus-visible {
    outline: var(--tln-focus-ring);
    outline-offset: 2px;
  }
  .swatch::-webkit-color-swatch-wrapper {
    padding: 0;
  }
  .swatch::-webkit-color-swatch {
    border: 0;
    border-radius: calc(var(--tln-radius) / 2);
  }
  .swatch::-moz-color-swatch {
    border: 0;
    border-radius: calc(var(--tln-radius) / 2);
  }

  .note {
    margin: 0;
    font-size: var(--tln-text-xs);
    color: var(--tln-fg-muted);
  }

  .actions {
    display: flex;
    justify-content: flex-end;
  }
</style>
