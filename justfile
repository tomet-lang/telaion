# telaion development tasks.
# Run `just` to see everything available.

default:
    @just --list

#[ Setup ]

# Install workspace dependencies
install:
    pnpm install

#[ Quality ]

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
