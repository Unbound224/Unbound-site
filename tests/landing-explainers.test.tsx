import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';
import * as matchers from 'vitest-axe/matchers';
import Home from '@/app/page';
import { Audiences } from '@/components/landing/Audiences';
import { FLOW_STEPS, FlowStory } from '@/components/landing/FlowStory';
import { QuoteExplainer } from '@/components/landing/QuoteExplainer';
import { UnderTheHood } from '@/components/landing/UnderTheHood';
import { UNIT, explainQuote, formatUnits } from '@/lib/quote-math';

expect.extend(matchers);
const AXE = { rules: { 'color-contrast': { enabled: false } } } as const;

describe('quote math (exact base units)', () => {
  it('matches the documented example: 80 SHOP at 0.9 with a 1% cap', () => {
    const q = explainQuote(80n * UNIT, { n: 9n, d: 10n }, 100);
    expect(formatUnits(q.expectedUnits)).toBe('72.00');
    expect(formatUnits(q.minUnits)).toBe('71.28');
    expect(q.expectedUnits - q.bufferUnits).toBe(q.minUnits);
  });
  it('rounds down, never up, and handles tiny amounts', () => {
    expect(formatUnits(explainQuote(1n, { n: 9n, d: 10n }, 0).expectedUnits)).toBe('0.00');
    expect(formatUnits(explainQuote(7n, { n: 1n, d: 3n }, 0).expectedUnits)).toBe('0.0000002');
    expect(formatUnits(-5n)).toBe('-0.0000005');
  });
  it('refuses invalid inputs (no silent defaults)', () => {
    expect(() => explainQuote(0n, { n: 1n, d: 1n }, 100)).toThrow(RangeError);
    expect(() => explainQuote(1n, { n: 1n, d: 1n }, 1001)).toThrow(/10%/);
    expect(() => explainQuote(1n, { n: 1n, d: 1n }, 1.5)).toThrow(RangeError);
    expect(() => explainQuote(1n, { n: 0n, d: 1n }, 100)).toThrow(RangeError);
  });
});

describe('QuoteExplainer', () => {
  it('recomputes the minimum as the person changes amount and slippage, and says the rate is illustrative', async () => {
    const { container } = render(<QuoteExplainer />);
    expect(screen.getByTestId('expected')).toHaveTextContent('72.00 USDC');
    expect(screen.getByTestId('minimum')).toHaveTextContent('71.28 USDC');
    await userEvent.click(screen.getByLabelText('5%'));
    expect(screen.getByTestId('minimum')).toHaveTextContent('68.40 USDC');
    fireEvent.change(screen.getByRole('slider'), { target: { value: '200' } });
    expect(screen.getByTestId('expected')).toHaveTextContent('180.00 USDC');
    expect(screen.getByTestId('minimum')).toHaveTextContent('171.00 USDC');
    expect(container.textContent).toMatch(/Illustrative rate/);
    expect(container.textContent).toMatch(/refuses caps above 10%/);
    expect((await axe(container, AXE)).violations).toEqual([]);
  });
});

describe('FlowStory', () => {
  afterEach(() => vi.useRealTimers());
  it('walks through five steps by hand, including the Soroban escrow outcomes', async () => {
    const { container } = render(<FlowStory />);
    expect(FLOW_STEPS).toHaveLength(5);
    expect(screen.getByRole('img')).toHaveAccessibleName(/step 1 of 5/);
    await userEvent.click(screen.getByRole('button', { name: 'Show step 4' }));
    expect(screen.getByText(/credit waits in escrow/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Show step 4' })).toHaveAttribute('aria-current', 'step');
    await userEvent.click(screen.getByRole('button', { name: 'Show step 5' }));
    expect(screen.getByText(/take it back after the deadline/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Play' })).toBeInTheDocument(); // manual choice pauses autoplay
    expect((await axe(container, AXE)).violations).toEqual([]);
  });

  it('autoplays only while visible and never with reduced motion', () => {
    vi.useFakeTimers();
    let cb: ((e: { isIntersecting: boolean }[]) => void) | undefined;
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(f: typeof cb) {
          cb = f;
        }
        observe() {}
        disconnect() {}
      },
    );
    vi.stubGlobal('matchMedia', (q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {} }));
    const { unmount } = render(<FlowStory />);
    act(() => vi.advanceTimersByTime(1));
    act(() => vi.advanceTimersByTime(10_000));
    expect(screen.getByRole('img')).toHaveAccessibleName(/step 1 of 5/); // not visible yet
    act(() => cb!([{ isIntersecting: true }]));
    act(() => vi.advanceTimersByTime(3_700));
    expect(screen.getByRole('img')).toHaveAccessibleName(/step 2 of 5/);
    unmount();
    vi.stubGlobal('matchMedia', (q: string) => ({ matches: true, media: q, addEventListener() {}, removeEventListener() {} }));
    render(<FlowStory />);
    act(() => cb?.([{ isIntersecting: true }]));
    act(() => vi.advanceTimersByTime(20_000));
    expect(screen.getByRole('img')).toHaveAccessibleName(/step 1 of 5/);
    expect(screen.getByRole('button', { name: 'Play' })).toBeInTheDocument();
    vi.unstubAllGlobals();
  });
});

describe('audiences and under the hood', () => {
  it('three illustrated audiences, no invented users, partners or metrics', async () => {
    const { container } = render(<Audiences />);
    expect(within(container).getAllByRole('heading', { level: 3 }).map((h) => h.textContent)).toEqual(['Shoppers', 'Merchants', 'Developers']);
    expect(container.textContent).not.toMatch(/\d+\s*(k|m)?\+?\s*(users|merchants|downloads|customers)|trusted by|partners?:/i);
    expect((await axe(container, AXE)).violations).toEqual([]);
  });
  it('the data path names all four repositories and says Soroban is only the escrow', async () => {
    const { container } = render(<UnderTheHood />);
    for (const r of ['Unbound-mobile', 'Unbound-core', 'Unbound-stellar']) expect(container.textContent).toContain(r);
    expect(container.textContent).toMatch(/Soroban: redemption escrow only/);
    expect((await axe(container, AXE)).violations).toEqual([]);
  });
  it('the home page includes the new sections in order', () => {
    const { container } = render(<Home />);
    const ids = [...container.querySelectorAll('section[id]')].map((s) => s.id);
    expect(ids.indexOf('how-it-works')).toBeLessThan(ids.indexOf('quotes'));
    expect(ids.indexOf('quotes')).toBeLessThan(ids.indexOf('who'));
    expect(ids).toContain('under-the-hood');
  });
});
