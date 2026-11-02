import type { CSSProperties, ReactNode } from 'react';

export function SectionHeading({ id, eyebrow, title, lead, center = false }: { id: string; eyebrow: string; title: string; lead?: ReactNode; center?: boolean }) {
  return (
    <div data-reveal className={`mb-10 max-w-2xl sm:mb-12 space-y-4 ${center ? 'mx-auto text-center' : ''}`}>
      <p className="eyebrow">{eyebrow}</p>
      <h2 id={id} className="text-3xl font-bold tracking-tight text-balance sm:text-4xl">
        {title}
      </h2>
      {lead ? <p className="text-lg text-muted text-pretty">{lead}</p> : null}
    </div>
  );
}

export function Icon({ d, className = '' }: { d: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d={d} />
    </svg>
  );
}

/** Simple stroke icon paths (drawn here, no icon dependency). */
export const ICONS = {
  store: 'M3 9l1.5-5h15L21 9M3 9h18M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0M5 12v8h14v-8M10 20v-5h4v5',
  coin: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM9 9.5c0-1 1-1.8 3-1.8s3 .8 3 1.8-1 1.5-3 1.8-3 .9-3 2 1 1.8 3 1.8 3-.8 3-1.8M12 6v1.7M12 16.3V18',
  swap: 'M7 4L3 8l4 4M3 8h14M17 20l4-4-4-4M21 16H7',
  receipt: 'M6 3h12v18l-3-2-3 2-3-2-3 2V3zM9 8h6M9 12h6M9 16h3',
  shield: 'M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6l8-3zM8.5 12l2.5 2.5 4.5-5',
  chart: 'M4 20V4M4 20h16M8 16v-5M12 16V8M16 16v-3',
  key: 'M15 7a4 4 0 1 1-3.9 5H3v3h3v3h3v-3h2.1A4 4 0 0 1 15 7zM16 10h.01',
  clock: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7v5l3 2',
  repeat: 'M17 2l4 4-4 4M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4M21 13v2a3 3 0 0 1-3 3H3',
  code: 'M8 7l-5 5 5 5M16 7l5 5-5 5M14 4l-4 16',
  doc: 'M7 3h7l5 5v13H7V3zM14 3v5h5M10 13h6M10 17h6',
  flask: 'M9 3h6M10 3v6L4.5 18.5A1.6 1.6 0 0 0 6 21h12a1.6 1.6 0 0 0 1.5-2.5L14 9V3M7.5 15h9',
  ban: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM5.6 5.6l12.8 12.8',
  arrow: 'M5 12h14M13 6l6 6-6 6',
  github:
    'M9 19c-4 1.3-4-2-6-2.5M15 21v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 0 0-1.3-3.2 4.2 4.2 0 0 0-.1-3.2s-1-.3-3.4 1.3a11.6 11.6 0 0 0-6 0C6.8 2.8 5.8 3.1 5.8 3.1a4.2 4.2 0 0 0-.1 3.2A4.6 4.6 0 0 0 4.4 9.5c0 4.6 2.7 5.7 5.5 6-.6.6-.6 1.2-.5 2V21',
  phone: 'M8 2h8a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zM11 18h2',
  check: 'M5 12.5l4.5 4.5L19 7.5',
} as const;

/** Staggers an entrance reveal. */
export function delay(ms: number): CSSProperties {
  return { '--reveal-delay': `${ms}ms` } as CSSProperties;
}
