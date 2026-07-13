import { footer } from '../content/copy';

export default function Footer() {
  return (
    <footer className="border-t border-ink/10">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <p className="text-center text-xs leading-relaxed text-ink/55">{footer}</p>
      </div>
    </footer>
  );
}
