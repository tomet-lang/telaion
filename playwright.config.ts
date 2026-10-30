import { defineConfig, devices } from "@playwright/test";

const port = 4173;

export default defineConfig({
  testDir: "tests",
  fullyParallel: true,
  reporter: "list",
  use: {
    baseURL: `http://localhost:${port}`,
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    {
      // The same tests, in the conditions of a real application: Tailwind's reset and wide letter
      // spacing. They found two bugs that the plain page could not show.
      name: "chromium-tailwind",
      use: {
        ...devices["Desktop Chrome"],
        storageState: {
          cookies: [],
          origins: [
            {
              origin: `http://localhost:${port}`,
              localStorage: [
                { name: "playground-reset", value: "1" },
                { name: "playground-spaced", value: "1" },
              ],
            },
          ],
        },
      },
    },
  ],
  // The tests drive the playground, the same page a person looks at with `just play`.
  webServer: {
    command: `pnpm --filter @telaion/playground exec vite --port ${port} --strictPort`,
    url: `http://localhost:${port}`,
    reuseExistingServer: true,
  },
});
