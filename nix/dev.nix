{
  pkgs,
  mkShell,
  tools,
  ...
}:
mkShell {
  buildInputs = with pkgs; [
    #= Ecosystem Tools (sisho, tomet, twrit, catasto)
    tools
    just

    #= Frontend (Node & pnpm)
    nodejs
    pnpm
  ];

  shellHook = ''
    echo "🧵 telaion - Svelte components for Tomet editors"
  '';
}
