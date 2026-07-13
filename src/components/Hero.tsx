import SectionShell from './SectionShell';
import { hero } from '../content/copy';

export default function Hero() {
  return (
    <SectionShell id="top" className="mx-auto max-w-6xl px-4 pt-20 pb-24 sm:px-6 md:pt-32 md:pb-32">
      <div className="h-px w-16 bg-accent/60" aria-hidden="true" />
      <h1 className="mt-8 max-w-[18ch] text-4xl font-semibold tracking-tight text-balance sm:text-5xl md:text-6xl">
        {hero.headline}
      </h1>
      <p className="mt-8 max-w-[75ch] text-lg leading-relaxed text-ink/80 md:text-xl">
        {hero.explainer}
      </p>
      <a
        href="#demo"
        className="mt-12 inline-flex items-center gap-2 rounded-full border border-ink px-6 py-3 text-sm font-medium text-ink transition-colors hover:bg-ink hover:text-white"
      >
        {hero.cta}
        <svg viewBox="0 0 12 12" className="h-3 w-3" aria-hidden="true" focusable="false">
          <path
            d="M6 1v9M2.5 6.5 6 10l3.5-3.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </a>
    </SectionShell>
  );
}
