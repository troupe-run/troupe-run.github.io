// Internal link check over a built site. Wraps linkinator and refuses to pass when it scanned nothing
// (a bad --skip pattern once made the gate pass on 0 links).
import { spawnSync } from 'node:child_process';

const dir = process.argv[2] ?? 'dist';
// Skip every external URL, but not linkinator's own local server root.
const skip = '^https?://(?!(localhost|127\\.0\\.0\\.1)[:/])';
const r = spawnSync('npx', ['linkinator', dir, '--recurse', '--skip', skip, '--format', 'json'],
  { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
let result;
try { result = JSON.parse(r.stdout); } catch {
  console.error(r.stdout, r.stderr);
  console.error('✗ linkinator did not produce JSON output');
  process.exit(1);
}
const links = result.links ?? [];
const scanned = links.filter((l) => l.state !== 'SKIPPED');
const broken = links.filter((l) => l.state === 'BROKEN');
console.log(`Scanned ${scanned.length} links in ${dir} (${links.length - scanned.length} skipped)`);
for (const l of broken) console.error(`✗ ${l.status} ${l.url} (from ${l.parent})`);
if (scanned.length < 2) { console.error('✗ scanned fewer than 2 links (root only or nothing): the link check is not checking anything'); process.exit(1); }
if (broken.length) { console.error(`✗ ${broken.length} broken link(s)`); process.exit(1); }
console.log('✓ no broken internal links');
