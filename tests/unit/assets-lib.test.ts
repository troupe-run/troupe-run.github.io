import { describe, it, expect } from 'vitest';
import { mkdtempSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pngSize, hashFiles, verify } from '../../scripts/assets-lib.mjs';

// 1×1 transparent PNG
const PNG_1x1 = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');

function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'assets-'));
  mkdirSync(join(root, 'brand/out'), { recursive: true });
  writeFileSync(join(root, 'brand/a.svg'), '<svg/>');
  writeFileSync(join(root, 'brand/out/x.png'), PNG_1x1);
  const config = { SOURCES: ['brand/a.svg'], ASSETS: [{ template: 't.html', out: 'brand/out/x.png', width: 1, height: 1 }], COPIES: [] };
  writeFileSync(join(root, 'brand/out/manifest.json'), JSON.stringify({ sources: hashFiles(config.SOURCES, root) }));
  return { root, config };
}

describe('assets-lib', () => {
  it('pngSize reads width and height from the IHDR chunk', () => {
    expect(pngSize(PNG_1x1)).toEqual({ width: 1, height: 1 });
  });
  it('verify returns no problems when outputs and the manifest match', () => {
    const { root, config } = fixture();
    expect(verify(root, config)).toEqual([]);
  });
  it('verify reports a source that changed since the last render', () => {
    const { root, config } = fixture();
    writeFileSync(join(root, 'brand/a.svg'), '<svg id="changed"/>');
    expect(verify(root, config)).toEqual(['brand/a.svg changed since last render: run npm run assets:render']);
  });
  it('verify reports a missing output', () => {
    const { root, config } = fixture();
    config.ASSETS.push({ template: 't.html', out: 'brand/out/missing.png', width: 1, height: 1 });
    expect(verify(root, config)).toEqual(['brand/out/missing.png is missing']);
  });
  it('verify reports an output with the wrong size', () => {
    const { root, config } = fixture();
    config.ASSETS[0].width = 2;
    expect(verify(root, config)).toEqual(['brand/out/x.png is 1×1, expected 2×1']);
  });
});
