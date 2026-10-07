import * as config from './assets.config.mjs';
import { verify } from './assets-lib.mjs';

const problems = verify(process.cwd(), config);
if (problems.length) {
  console.error(problems.map((p) => `✗ ${p}`).join('\n'));
  process.exit(1);
}
console.log('✓ brand sources, rendered outputs and copies agree with the manifest (outputs are not re-rendered)');
