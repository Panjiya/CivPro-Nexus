import SectionShell from './SectionShell';
import { how } from '../content/copy';

export default function HowItWorks() {
  return (
    <SectionShell className="border-y border-ink/10 bg-panel">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 md:py-28">
        <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">{how.title}</h2>

        <div className="relative mt-14">
          {/* the connecting thread behind the step markers (desktop) */}
          <div
            aria-hidden="true"
            className="absolute top-4 right-8 left-8 hidden h-px bg-ink/15 lg:block"
          />
          <ol className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
            {how.cards.map((card, i) => (
              <li key={card.title} className="relative">
                <span
                  aria-hidden="true"
                  className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full border border-accent bg-white text-sm font-medium text-accent"
                >
                  {i + 1}
                </span>
                <h3 className="mt-5 text-lg leading-snug font-semibold text-balance">
                  {card.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-ink/80">{card.body}</p>
                <p className="mt-4 border-l-2 border-accent/40 pl-3 text-sm leading-relaxed text-ink/65">
                  {card.example}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </SectionShell>
  );
}
