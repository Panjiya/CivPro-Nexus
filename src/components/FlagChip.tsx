import type { Ref } from 'react';
import type { Flag } from '../content/demo-data';

interface FlagChipProps {
  flag: Flag;
  /** Plain-language flag phrase from the legend. */
  label: string;
  expanded: boolean;
  /** id of the note panel this chip controls. */
  controlsId: string;
  onToggle: () => void;
  ref?: Ref<HTMLButtonElement>;
}

/** Small monochrome glyphs — shape, not color, distinguishes the four flags. */
function Glyph({ flag }: { flag: Flag }) {
  return (
    <svg
      viewBox="0 0 10 10"
      className="h-2.5 w-2.5 shrink-0"
      aria-hidden="true"
      focusable="false"
    >
      {flag === 'exact' && <circle cx="5" cy="5" r="3.5" fill="currentColor" />}
      {flag === 'close' && (
        <>
          <circle cx="5" cy="5" r="3.2" fill="none" stroke="currentColor" strokeWidth="1.1" />
          <path d="M5 1.8 A3.2 3.2 0 0 0 5 8.2 Z" fill="currentColor" />
        </>
      )}
      {flag === 'caveat' && (
        <>
          <circle cx="5" cy="5" r="3.2" fill="none" stroke="currentColor" strokeWidth="1.1" />
          <circle cx="5" cy="5" r="1.3" fill="currentColor" />
        </>
      )}
      {flag === 'unsayable' && (
        <>
          <circle cx="5" cy="5" r="3.2" fill="none" stroke="currentColor" strokeWidth="1.1" />
          <line x1="2.7" y1="7.3" x2="7.3" y2="2.7" stroke="currentColor" strokeWidth="1.1" />
        </>
      )}
    </svg>
  );
}

const chipBorder: Record<Flag, string> = {
  exact: 'border-ink/20',
  close: 'border-ink/20',
  caveat: 'border-ink/30 border-dashed',
  unsayable: 'border-ink/40 border-dashed',
};

/**
 * One of the four plain translation flags. Clicking it opens a small
 * inline note explaining what happened in translation.
 */
export default function FlagChip({
  flag,
  label,
  expanded,
  controlsId,
  onToggle,
  ref,
}: FlagChipProps) {
  return (
    <button
      ref={ref}
      type="button"
      aria-expanded={expanded}
      aria-controls={controlsId}
      onClick={onToggle}
      className={`inline-flex items-center gap-1.5 rounded-full border ${chipBorder[flag]} bg-white px-2.5 py-1 text-xs leading-none text-ink/70 transition-colors hover:border-ink/50 hover:text-ink ${
        expanded ? 'border-ink/60 text-ink' : ''
      }`}
    >
      <Glyph flag={flag} />
      <span>{label}</span>
    </button>
  );
}
