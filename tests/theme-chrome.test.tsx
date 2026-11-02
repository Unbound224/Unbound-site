import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SiteHeader } from '@/components/SiteChrome';
import { ThemeToggle } from '@/components/ThemeToggle';
import { THEME_STORAGE_KEY } from '@/lib/theme';

afterEach(() => {
  document.documentElement.removeAttribute('data-theme');
});

describe('theme toggle', () => {
  it('switches theme on the document and remembers it', async () => {
    window.localStorage.removeItem(THEME_STORAGE_KEY);
    render(<ThemeToggle />);
    await userEvent.click(screen.getByRole('button', { name: /switch to dark theme/i }));
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
    await userEvent.click(await screen.findByRole('button', { name: /switch to light theme/i }));
    expect(document.documentElement).toHaveAttribute('data-theme', 'light');
  });

  it('still works when storage throws (private mode)', async () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    render(<ThemeToggle />);
    await userEvent.click(screen.getByRole('button', { name: /switch to dark theme/i }));
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
    spy.mockRestore();
  });
});

describe('header navigation', () => {
  it('mobile menu is a labelled disclosure that opens and closes', async () => {
    render(<SiteHeader />);
    const btn = screen.getByRole('button', { name: 'Open menu' });
    expect(btn).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(btn);
    expect(screen.getByRole('button', { name: 'Close menu' })).toHaveAttribute('aria-expanded', 'true');
    expect(within(screen.getByRole('navigation', { name: 'Mobile' })).getByRole('link', { name: 'Merchant console' })).toHaveAttribute('href', '/merchant');
    await userEvent.keyboard('{Escape}');
    expect(screen.getByRole('button', { name: 'Open menu' })).toHaveAttribute('aria-expanded', 'false');
  });
});

describe('motion and theming CSS', () => {
  const css = readFileSync(join(process.cwd(), 'src/app/globals.css'), 'utf8');
  it('honours prefers-reduced-motion by disabling animations and reveals', () => {
    const block = css.slice(css.indexOf('@media (prefers-reduced-motion: reduce)'));
    expect(block).toMatch(/animation:\s*none\s*!important/);
    expect(block).toMatch(/\[data-reveal\][^}]*opacity:\s*1/);
  });
  it('defines light and dark tokens, from the OS preference and from an explicit choice', () => {
    expect(css).toMatch(/@media \(prefers-color-scheme: dark\)/);
    expect(css).toMatch(/:root\[data-theme='dark'\]/);
    expect(css).toMatch(/--brand-primary:\s*#7537f5/i);
    expect(css).toMatch(/--brand-deep:\s*#10092e/i);
  });
});
