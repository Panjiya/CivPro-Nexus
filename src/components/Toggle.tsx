interface ToggleProps {
  checked: boolean;
  /** Visible label — changes with state (show / hide). */
  label: string;
  onChange: (next: boolean) => void;
}

/** Accessible switch with a visible text label. */
export default function Toggle({ checked, label, onChange }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="group inline-flex items-center gap-2.5 text-sm text-ink/80 transition-colors hover:text-ink"
    >
      <span
        aria-hidden="true"
        className={`relative inline-block h-5 w-9 shrink-0 rounded-full border transition-colors ${
          checked ? 'border-ink bg-ink' : 'border-ink/30 bg-panel'
        }`}
      >
        <span
          className={`absolute top-0.5 h-3.5 w-3.5 rounded-full transition-all ${
            checked ? 'left-[1.125rem] bg-white' : 'left-0.5 bg-ink/50'
          }`}
        />
      </span>
      <span>{label}</span>
    </button>
  );
}
