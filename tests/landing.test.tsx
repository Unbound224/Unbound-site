import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Home from '@/app/page';
import { AppDownload } from '@/components/landing/AppDownload';
import { FAQ } from '@/components/landing/Faq';
import { STEPS } from '@/components/landing/HowItWorks';
import { SiteFooter, SiteHeader } from '@/components/SiteChrome';
import { MOBILE_RELEASES_URL, REPOS, getStoreLinks } from '@/lib/site-config';

const STORE_HOST = /apps\.apple\.com|play\.google\.com|applemarketingtools|itunes\.apple\.com/i;

afterEach(() => {
  vi.unstubAllEnvs();
});

function allHrefs(container: HTMLElement) {
  return Array.from(container.querySelectorAll('a')).map((a) => a.getAttribute('href') ?? '');
}
function allImgSrcs(container: HTMLElement) {
  return Array.from(container.querySelectorAll('img')).map((i) => i.getAttribute('src') ?? '');
}

describe('landing sections', () => {
  it('renders every section with a labelled heading, in order', () => {
    const { container } = render(<Home />);
    const ids = Array.from(container.querySelectorAll('section')).map((s) => s.getAttribute('aria-labelledby'));
    expect(ids).toEqual(['hero-title', 'how-title', 'features-title', 'trust-title', 'app-title', 'merchants-title', 'oss-title', 'faq-title']);
    for (const id of ids) expect(container.querySelector(`#${id}`)?.textContent?.trim()).toBeTruthy();
    for (const anchor of ['how-it-works', 'trust', 'app', 'merchants', 'open-source', 'faq']) expect(container.querySelector(`#${anchor}`)).not.toBeNull();
  });

  it('how it works walks issuer -> credit -> exchange -> redemption', () => {
    render(<Home />);
    expect(STEPS.map((s) => s.key)).toEqual(['issuer', 'credit', 'exchange', 'redemption']);
    const list = screen.getByRole('heading', { name: /merchant's promise/i }).closest('section')!.querySelector('ol')!;
    const items = within(list).getAllByRole('listitem');
    expect(items).toHaveLength(4);
    expect(items[0]).toHaveTextContent(/Issuer/);
    expect(items[3]).toHaveTextContent(/Redemption/);
  });

  it('trust section covers issuer authorization, no fake liquidity and Testnet status', () => {
    render(<Home />);
    const trust = screen.getByRole('heading', { name: /credible by construction/i }).closest('section')!;
    for (const h of ['Issuer-authorized redemption', 'No fake liquidity', 'Testnet status']) expect(within(trust).getByRole('heading', { name: h })).toBeInTheDocument();
  });

  it('merchant section links to the console, the application form and the docs', () => {
    render(<Home />);
    const m = screen.getByRole('heading', { name: /redemption promise/i }).closest('section')!;
    expect(within(m).getByRole('link', { name: /open the merchant console/i })).toHaveAttribute('href', '/merchant');
    expect(within(m).getByRole('link', { name: /apply as an issuer/i })).toHaveAttribute('href', '/merchant/apply');
    expect(within(m).getByRole('link', { name: /partner docs/i })).toHaveAttribute('href', '/docs');
  });

  it('open-source section links exactly the four real repositories', () => {
    render(<Home />);
    const oss = screen.getByRole('heading', { name: /four repositories/i }).closest('section')!;
    const repoLinks = within(oss)
      .getAllByRole('link')
      .map((a) => a.getAttribute('href'))
      .filter((h) => h?.startsWith('https://github.com/Unbound224/'));
    expect(repoLinks.sort()).toEqual(
      ['Unbound-core', 'Unbound-mobile', 'Unbound-site', 'Unbound-stellar'].map((n) => `https://github.com/Unbound224/${n}`).sort(),
    );
    expect(REPOS).toHaveLength(4);
    // The status table is honest about what has not happened yet.
    expect(within(oss).getByRole('table')).toHaveTextContent(/Live Stellar Testnet run.*Not yet/);
  });

  it('FAQ is native disclosure widgets, collapsed by default', async () => {
    const { container } = render(<Home />);
    const details = container.querySelectorAll('#faq details');
    expect(details).toHaveLength(FAQ.length);
    details.forEach((d) => expect(d).not.toHaveAttribute('open'));
    await userEvent.click(screen.getByText(FAQ[0].q));
    expect(details[0]).toHaveAttribute('open');
  });

  it('makes no claims about users, partners, audits, testimonials or Mainnet availability', () => {
    const { container } = render(<Home />);
    const text = container.textContent ?? '';
    expect(text).not.toMatch(/trusted by|testimonial|our partners|\d[\d,.]*\+?\s*(users|merchants|downloads)|audited by|live on mainnet|available on mainnet/i);
    expect(text).toMatch(/Mainnet needs an external security review/i);
  });
});

describe('store badges (the app is not listed in any store)', () => {
  it('renders no store links or badges without the env vars', () => {
    vi.stubEnv('NEXT_PUBLIC_APP_STORE_URL', '');
    vi.stubEnv('NEXT_PUBLIC_PLAY_STORE_URL', '');
    const { container } = render(
      <>
        <SiteHeader />
        <Home />
        <SiteFooter />
      </>,
    );
    expect(allHrefs(container).filter((h) => STORE_HOST.test(h))).toEqual([]);
    expect(allImgSrcs(container).filter((s) => STORE_HOST.test(s))).toEqual([]);
    expect(screen.queryByAltText(/app store|google play/i)).toBeNull();
    expect(screen.getByRole('link', { name: 'Download for Android (beta APK)' })).toHaveAttribute(
      'href',
      'https://github.com/Unbound224/Unbound-mobile/releases/latest/download/unbound-android.apk',
    );
    expect(screen.getByRole('link', { name: 'All releases' })).toHaveAttribute('href', MOBILE_RELEASES_URL);
    expect(screen.getByText('How to install an APK')).toBeInTheDocument();
    expect(container.textContent).toMatch(/Install unknown apps/);
    expect(screen.getByText(/iOS — coming soon/)).not.toHaveAttribute('href');
    expect(screen.getByText(/iOS — coming soon/).closest('a')).toBeNull();
    expect(container.textContent).toMatch(/not available in any app store/i);
  });

  it('renders official badges only for configured, genuine store URLs', () => {
    vi.stubEnv('NEXT_PUBLIC_APP_STORE_URL', 'https://apps.apple.com/app/id000000000');
    vi.stubEnv('NEXT_PUBLIC_PLAY_STORE_URL', 'https://play.google.com/store/apps/details?id=dev.unbound.unbound_mobile');
    render(<AppDownload />);
    expect(screen.getByAltText('Download on the App Store').closest('a')).toHaveAttribute('href', 'https://apps.apple.com/app/id000000000');
    expect(screen.getByAltText('Get it on Google Play').closest('a')).toHaveAttribute(
      'href',
      'https://play.google.com/store/apps/details?id=dev.unbound.unbound_mobile',
    );
    expect(screen.queryByText(/beta APK/)).toBeNull();
    expect(screen.queryByText(/coming soon/)).toBeNull();
    expect(screen.queryByText('How to install an APK')).toBeNull();
  });

  it('shows only the configured store; the other platform keeps its fallback', () => {
    vi.stubEnv('NEXT_PUBLIC_PLAY_STORE_URL', 'https://play.google.com/store/apps/details?id=x');
    vi.stubEnv('NEXT_PUBLIC_APP_STORE_URL', '');
    render(<AppDownload />);
    expect(screen.getByAltText('Get it on Google Play')).toBeInTheDocument();
    expect(screen.getByText(/iOS — coming soon/)).toBeInTheDocument();
  });

  it('ignores malformed, non-https or look-alike URLs', () => {
    for (const bad of ['not a url', 'http://apps.apple.com/app/id1', 'https://apps.apple.com.evil.example/app', 'https://example.com/play.google.com']) {
      vi.stubEnv('NEXT_PUBLIC_APP_STORE_URL', bad);
      vi.stubEnv('NEXT_PUBLIC_PLAY_STORE_URL', bad);
      expect(getStoreLinks()).toEqual({ appStore: null, playStore: null });
    }
  });
});
