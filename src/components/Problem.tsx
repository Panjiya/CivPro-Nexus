import SectionShell from './SectionShell';
import Bidi from './Bidi';
import { problem } from '../content/copy';
import { incident } from '../content/demo-data';

/**
 * Four honest voices, staggered around one central event marker —
 * the same night, four vocabularies.
 */
export default function Problem() {
  const [v0, v1, v2, v3] = problem.voices;
  return (
    <SectionShell className="border-y border-ink/10 bg-panel">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 md:py-28">
        <h2 className="text-3xl font-semibold tracking-tight text-balance md:text-4xl">
          {problem.title}
        </h2>
        <p className="mt-6 max-w-prose leading-relaxed text-ink/80">{problem.setup}</p>

        <div className="relative mt-16">
          {/* the vertical thread the voices converge on (desktop) */}
          <div
            aria-hidden="true"
            className="absolute top-0 bottom-0 left-1/2 hidden w-px -translate-x-1/2 bg-ink/15 md:block"
          />

          <div className="grid gap-6 md:grid-cols-2 md:gap-x-16 md:gap-y-10">
            <VoiceCard speaker={v0.speaker} quote={v0.quote} />
            <VoiceCard speaker={v1.speaker} quote={v1.quote} className="md:mt-12" />

            {/* the event marker both columns point at */}
            <div className="md:col-span-2 md:flex md:justify-center">
              <div className="relative rounded-lg border border-accent/40 bg-white px-6 py-5 text-center md:max-w-md">
                <p className="text-[0.6875rem] font-medium tracking-[0.14em] text-accent uppercase">
                  {problem.markerLabel}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-ink">
                  {incident.date} — <Bidi text={incident.place.transliteration} />
                </p>
              </div>
            </div>

            <VoiceCard speaker={v2.speaker} quote={v2.quote} />
            <VoiceCard speaker={v3.speaker} quote={v3.quote} className="md:mt-12" />
          </div>
        </div>

        <p className="mx-auto mt-16 max-w-prose leading-relaxed text-ink/80">
          {problem.closing}
        </p>
      </div>
    </SectionShell>
  );
}

function VoiceCard({
  speaker,
  quote,
  className,
}: {
  speaker: string;
  quote: string;
  className?: string;
}) {
  return (
    <figure
      className={`rounded-lg border border-ink/10 bg-white p-6 shadow-[0_1px_2px_rgba(26,35,50,0.05)] ${className ?? ''}`}
    >
      <figcaption className="text-[0.6875rem] font-medium tracking-[0.14em] text-ink/55 uppercase">
        {speaker}
      </figcaption>
      <blockquote className="mt-3 leading-relaxed text-ink">
        <p>“{quote}”</p>
      </blockquote>
    </figure>
  );
}
