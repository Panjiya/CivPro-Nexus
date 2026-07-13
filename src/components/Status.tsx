import SectionShell from './SectionShell';
import { status } from '../content/copy';

export default function Status() {
  return (
    <SectionShell className="mx-auto max-w-6xl px-4 py-20 sm:px-6 md:py-28">
      <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">{status.title}</h2>
      <p className="mt-6 max-w-[75ch] leading-relaxed text-ink/80">{status.body}</p>
      <p className="mt-8 max-w-[75ch] border-l-2 border-accent/50 pl-4 leading-relaxed text-ink/80">
        {status.next}
      </p>
    </SectionShell>
  );
}
