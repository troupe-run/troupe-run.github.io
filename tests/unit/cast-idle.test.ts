import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createCastIdle } from '../../src/scripts/cast-idle';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('createCastIdle', () => {
  it('bows exactly once 5s after start when nothing is hovered', () => {
    const bow = vi.fn();
    createCastIdle({ count: 5, bow, random: () => 0.5 });
    vi.advanceTimersByTime(4999);
    expect(bow).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(bow).toHaveBeenCalledTimes(1);
  });

  it('a hover at 4s pushes the next bow to 9s', () => {
    const bow = vi.fn();
    const idle = createCastIdle({ count: 5, bow, random: () => 0.5 });
    vi.advanceTimersByTime(4000);
    idle.hover();
    vi.advanceTimersByTime(4999);
    expect(bow).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(bow).toHaveBeenCalledTimes(1);
  });

  it('never picks the same character twice in a row, even when random repeats', () => {
    const picks: number[] = [];
    createCastIdle({ count: 5, bow: (i) => picks.push(i), random: () => 0.5 });
    vi.advanceTimersByTime(30_000);
    for (let i = 1; i < picks.length; i++) expect(picks[i]).not.toBe(picks[i - 1]);
  });

  it('stops after 6 bows and reports state "done"', () => {
    const bow = vi.fn();
    const idle = createCastIdle({ count: 5, bow });
    vi.advanceTimersByTime(120_000);
    expect(bow).toHaveBeenCalledTimes(6);
    expect(idle.state).toBe('done');
  });

  it('a hover after the cap does not restart bowing', () => {
    const bow = vi.fn();
    const idle = createCastIdle({ count: 5, bow });
    vi.advanceTimersByTime(30_000);
    idle.hover();
    vi.advanceTimersByTime(30_000);
    expect(bow).toHaveBeenCalledTimes(6);
  });

  it('setVisible(false) pauses bowing; setVisible(true) restarts the 5s timer', () => {
    const bow = vi.fn();
    const idle = createCastIdle({ count: 5, bow });
    idle.setVisible(false);
    expect(idle.state).toBe('paused');
    vi.advanceTimersByTime(20_000);
    expect(bow).not.toHaveBeenCalled();
    idle.setVisible(true);
    vi.advanceTimersByTime(5000);
    expect(bow).toHaveBeenCalledTimes(1);
  });

  it('stop() cancels any pending bow and reports state "stopped"', () => {
    const bow = vi.fn();
    const idle = createCastIdle({ count: 5, bow });
    idle.stop();
    vi.advanceTimersByTime(20_000);
    expect(bow).not.toHaveBeenCalled();
    expect(idle.state).toBe('stopped');
  });

  it('with a single character it bows index 0 each time', () => {
    const picks: number[] = [];
    createCastIdle({ count: 1, bow: (i) => picks.push(i) });
    vi.advanceTimersByTime(15_000);
    expect(picks).toEqual([0, 0, 0]);
  });
});
