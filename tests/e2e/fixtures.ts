import { test as base, expect } from '@playwright/test';

export const BLOCKED_EXTERNAL = '**/gc.zgo.at/**';

// Every e2e test runs with the live GoatCounter script blocked, so tests never depend on (or hit) an external host.
export const test = base.extend({
  context: async ({ context }, use) => {
    await context.route(BLOCKED_EXTERNAL, (r) => r.abort());
    await use(context);
  },
});
export { expect };
