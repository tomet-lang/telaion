<!-- Generated from tmtroot/agents.tmt. Edit that, then `tomet export .`. -->

# Telaion

## Core Philosophy & Principles

### Precedence of Instructions

The rules in this document serve as the project baseline and defaults. Explicit instructions given by the user in a conversation always take precedence over these defaults.

### User-First Design over Developer Convenience

Always prioritize the end-user experience, syntax ergonomics, and API design.
If there is tension between developer or implementation convenience and user simplicity, user simplicity must always win. Never compromise user experience just because an implementation is easier.

### Resist Path-of-Least-Resistance & Legacy Bias

The existing implementation is never a justification or reason for new design choices.

- Do not justify decisions with "it is already implemented this way, so let's stick with it."
- Prioritize architectural beauty, elegance, and long-term correctness over the path of least resistance.
- Understand the existing context thoroughly, but never take shortcuts or settle for lazy patches.

### Transparent Execution

Always state what you intend to do before doing it. Never execute non-trivial actions or commands silently.

## Single Source of Truth & Documentation

### Never edit `.md` directly

All Markdown files (`README.md`, `AGENTS.md`, `CONTRIBUTING.md`) are generated build artifacts, not source files. `CLAUDE.md` is the one exception: it holds only the line `@AGENTS.md`.

- Never edit a generated `.md` file directly.
- Always edit the corresponding `.tmt` file under `tmtroot/`.
- Run `just docs` (or `tomet export .`) to regenerate the Markdown artifacts, and verify with `just docs-check`.
- Direct edits to generated `.md` files will be overwritten and will fail CI / lint checks.

## Project overview

`telaion` is a set of themeless Svelte 5 components for editing Tomet (`.tmt`) documents. It is consumed by the Tomet editors: `tomet-wiki` (in the browser) and `ordiola` (a desktop app).

Read `CONTRIBUTING.md` for the contribution workflow, commit conventions, and verification steps. The design lives under `tmtroot/design/`; read it before changing the package layout.

## Package boundaries

These rules keep the layers separable. Do not break them for convenience.

- `@telaion/theme` defines the design tokens (`--tln-*`), five-layer physical shadow model, and Tailwind theme extension.
- `@telaion/primitives` must not import Tomet code. It is a set of generic UI primitives.
- `@telaion/editor` must not import Tomet code. Anything that depends on the Tomet grammar or AST belongs in `@telaion/tomet`.
- No Telaion package bundles or imports a Tomet engine (`@tomet/cms`, `@tomet/wasm`, or the like). An application already has one, as WebAssembly or as Rust, and a second copy would double its size. What Telaion needs from Tomet is written as a `TometServices` interface; the application passes an implementation backed by its own engine.
- `@telaion/tomet` knows the shapes of Tomet data (highlight spans, conflicts) and how to show them. It does not know how to compute them.
- Components know nothing about where a document is stored. They talk to a storage adapter that the application supplies.
- Components never hard-code colors, fonts, or sizes. Every visual value comes from a design token: a `--tln-*` custom property defined in `packages/theme/src/tokens.css`. When a new value is needed, ask instead of inventing one.
- The look follows `tmtroot/spec/ui/design.tmt`: five layers ordered by depth (`well`, `canvas`, `content`, `action`, `float`; the rules are at the top of `tokens.css`), an action one layer above what holds it, and one way of casting shadows. A shadow comes from a `--tln-shadow-*` token, never written out in a component. A surface that only holds controls is content; the controls on it are action; the fields on it are wells. Do not add a sixth layer, a gradient, a second border radius, or a border to make something stand out. Do not add a utility CSS framework to a shared package.
- A look that more than one component repeats (how an action, a text field or a tone looks) is written once in `packages/primitives/src/looks.css`; layout and anything a single component owns stays in that component.

## Looking at and testing components

- `just play` runs the playground: one Vite page that shows every component. Add a section to it for each new component and each state worth looking at.
- `just test` runs the browser tests (Playwright, Chromium) against the playground. Behavior that a type-check cannot see, such as focus, Escape, and the backdrop, needs a test here.
- Every test runs twice: on the plain page, and again in the conditions of a real application (the `chromium-tailwind` project): Tailwind's own reset, loaded inside `@layer base`, and wide letter spacing. The playground has two switches for the same, so a person can look at it too. Two bugs of the first release showed only there: a dialog pinned to a corner, and button labels broken across lines. A component is not done until it passes in both.
- A new test of a fix must be shown to fail without the fix. Remove the fix, run the test, and put the fix back.
- `just check` type-checks every package. Run it with the tests before calling a component done.
- The browsers come from Nix. `@playwright/test` in `package.json` must stay pinned to exactly the version of `pkgs.playwright-driver` in the flake; when the flake input is updated, update the pin with it.

## Publishing

- Write relative imports with a `.js` extension, also for TypeScript files (`import { x } from "./x.js"`). A `.ts` extension is not rewritten by the build and breaks the published package.
- Publish with `pnpm publish` (or `pnpm -r publish`), never `npm publish`.
- Packages are versioned together. Do not publish one package against an unpublished change of another.
- `just build` must succeed and the packed tarballs must install and build in a scratch application before a release.

## Changes in tomet or sibling repositories

Telaion has no dependency on a Tomet package. When Tomet changes what it returns, adapt it where the application builds its `TometServices`, or change the types in `@telaion/tomet`. Never add a Tomet engine as a dependency, and never point anything at a local checkout in a committed manifest or lockfile.

## Environment & Tooling

All commands, builds, and tests must run within the Nix development environment (via `direnv` or `nix develop`). Assume this environment is active and rely on the tools provided by the flake, rather than assuming or relying on global host toolchains.

