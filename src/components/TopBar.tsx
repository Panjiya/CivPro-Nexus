import { topBar } from '../content/copy';

export default function TopBar() {
  return (
    <header className="sticky top-0 z-40 border-b border-ink/10 bg-white/85 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <a href="#top" className="flex items-baseline gap-x-2.5 no-underline">
          <span className="text-sm font-semibold tracking-tight text-ink">
            {topBar.wordmark}
          </span>
          <span className="hidden text-xs text-ink/55 sm:inline">{topBar.poweredBy}</span>
        </a>
        <a
          href="#demo"
          className="rounded-full border border-ink/20 px-4 py-1.5 text-sm text-ink transition-colors hover:border-ink hover:bg-ink hover:text-white"
        >
          {topBar.demoLink}
        </a>
      </div>
    </header>
  );
}
