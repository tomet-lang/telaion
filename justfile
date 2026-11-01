# telaion development tasks.
# Run `just` to see everything available.

default:
    @just --list

#[ Setup ]

# Install workspace dependencies
install:
    pnpm install

#[ Icons ]

# Regenerate packages/primitives/src/icons.generated.ts from the pinned Lucide sprite.
# To take a newer sprite first: catasto sync --update --only packages/primitives/vendor/lucide/sprite.svg
icons:
    node packages/primitives/scripts/gen-icons.mjs

#[ Quality ]

# Type-check every package (TypeScript and Svelte)
check:
    pnpm exec svelte-check --tsconfig ./tsconfig.json

# Format every tracked file
fmt:
    nix fmt

#[ Documentation ]

# Generate and update all derived documentation across the workspace.
docs:
    sisho fix .

# Check that all documents parse, format cleanly, and match export targets.
docs-check:
    sisho check .

#[ Playground ]

# Run the playground with hot reload
play:
    pnpm --filter @telaion/playground dev

# Build the playground (catches errors the type-check cannot)
play-build:
    pnpm --filter @telaion/playground build

#[ Test ]

# Run the browser tests against the playground
test:
    pnpm exec playwright test

#[ Release ]

# Build every package into its dist/ directory, as it is published
build:
    pnpm -r --filter "./packages/*" run build
