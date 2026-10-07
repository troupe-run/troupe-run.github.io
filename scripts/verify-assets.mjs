import * as config from './assets.config.mjs';
import { verify } from './assets-lib.mjs';
import { existsSync } from 'node:fs';

const problems = verify(process.cwd(), config);
if (!existsSync(config.ICO.to)) problems.push(`${config.ICO.to} is missing`);
if (problems.length) {
  console.error(problems.map((p) => `✗ ${p}`).join('\n'));
  process.exit(1);
}
console.log('✓ brand assets match their sources');
