import { describe, it, expect, beforeAll } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import Character from '../../src/components/Character.astro';
import Mark from '../../src/components/Mark.astro';
import TopicIcon from '../../src/components/TopicIcon.astro';
import CastDefs from '../../src/components/CastDefs.astro';
import { TOPIC_ICONS } from '../../src/lib/topic-icons';

let c: AstroContainer;
beforeAll(async () => { c = await AstroContainer.create(); });
const count = (html: string, re: RegExp) => (html.match(re) ?? []).length;

describe('Character', () => {
  for (const [kind, headTag] of [['human', '<circle'], ['agent', '<rect'], ['troupe', '<path']] as const) {
    it(`${kind}: head and reflection use the ${headTag.slice(1)} shape, and both eyes are circles`, async () => {
      const html = await c.renderToString(Character, { props: { kind } });
      expect(html).toContain(`data-kind="${kind}"`);
      const head = html.split('class="head"')[1].split('</g>')[0];
      const refl = html.split('class="reflection"')[1].split('</g>')[0];
      expect(head).toContain(headTag);
      expect(refl).toContain(headTag);
      expect(count(html, /class="eye"/g)).toBe(2);
      expect(count(html, /<circle[^>]*class="eye"/g)).toBe(2);
    });
  }
  it('reflection is flipped below the head (scale(1,-1))', async () => {
    const html = await c.renderToString(Character, { props: { kind: 'human' } });
    expect(html).toMatch(/class="reflection"[^>]*transform="translate\(0,82\) scale\(1,-1\)"/);
  });
  it('size sets width and keeps the 56:70 aspect', async () => {
    const html = await c.renderToString(Character, { props: { kind: 'agent', size: 112 } });
    expect(html).toContain('width="112"');
    expect(html).toContain('height="140"');
  });
});

describe('CastDefs', () => {
  it('defines one fade gradient per kind, fading to opacity 0 at offset 0.75', async () => {
    const html = await c.renderToString(CastDefs);
    for (const k of ['human', 'agent', 'troupe']) expect(html).toContain(`id="cast-fade-${k}"`);
    expect(count(html, /offset="0\.75"/g)).toBe(3);
  });
});

describe('Mark', () => {
  it('draws circle, triangle, square in that order, each with two circular eyes', async () => {
    const html = await c.renderToString(Mark);
    const iCircle = html.indexOf('class="mark-human"');
    const iTri = html.indexOf('class="mark-troupe"');
    const iSq = html.indexOf('class="mark-agent"');
    expect(iCircle).toBeGreaterThan(-1);
    expect(iCircle).toBeLessThan(iTri);
    expect(iTri).toBeLessThan(iSq);
    expect(count(html, /<circle[^>]*class="eye"/g)).toBe(6);
  });
  it('shows the wordmark "troupe" only when asked', async () => {
    expect(await c.renderToString(Mark)).not.toContain('>troupe<');
    expect(await c.renderToString(Mark, { props: { wordmark: true } })).toContain('>troupe<');
  });
});

describe('TopicIcon', () => {
  for (const name of TOPIC_ICONS) {
    it(`renders "${name}" as a stroked line icon inside a tile`, async () => {
      const html = await c.renderToString(TopicIcon, { props: { name } });
      expect(html).toContain('class="topic-icon"');
      expect(html).toContain('stroke="currentColor"');
    });
  }
  it('throws for an unknown icon name', async () => {
    await expect(c.renderToString(TopicIcon, { props: { name: 'nope' } })).rejects.toThrow('Unknown topic icon: nope');
  });
});
