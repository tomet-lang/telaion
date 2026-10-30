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

  # Browsers come from nix. The npm package @playwright/test must be pinned to the same
  # version as pkgs.playwright-driver (see package.json), or Playwright rejects the browsers.
  PLAYWRIGHT_BROWSERS_PATH = "${pkgs.playwright-driver.browsers}";
  PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS = "true";
  PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD = "1";

  shellHook = ''
    echo "🧵 telaion - Svelte components for Tomet editors"
  '';
}
