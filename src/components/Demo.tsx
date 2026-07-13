import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import SectionShell from './SectionShell';
import FlagChip from './FlagChip';
import Toggle from './Toggle';
import Bidi from './Bidi';
import { demo } from '../content/copy';
import {
  incident,
  roleRenderings,
  sharedRecord,
  type RoleField,
  type RoleId,
} from '../content/demo-data';

export default function Demo() {
  const [roleId, setRoleId] = useState<RoleId | null>(null);
  const [showShared, setShowShared] = useState(false);
  const [openNote, setOpenNote] = useState<string | null>(null);

  // A compact role bar appears as a fixed overlay below the top bar once the
  // full picker has scrolled out of view, so switching roles never requires
  // scrolling back up. The full picker stays in flow untouched and the overlay
  // takes no layout space — so nothing on the page jumps at the boundary.
  // Two 1px sentinels mark the lines: one after the picker (overlay appears
  // when it passes under the 56px top bar) and one at the section's end
  // (overlay retires). A rAF-throttled scroll listener reads both — an
  // IntersectionObserver can miss a 1px sentinel that teleports across the
  // viewport in one frame (fast scrollbar drags, anchor jumps).
  const [stuck, setStuck] = useState(false);
  const pickerEndRef = useRef<HTMLDivElement>(null);
  const sectionEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const pickerEnd = pickerEndRef.current;
      const sectionEnd = sectionEndRef.current;
      if (!pickerEnd || !sectionEnd) return;
      const pickerPassed = pickerEnd.getBoundingClientRect().top < 57;
      const endPassed = sectionEnd.getBoundingClientRect().top < 57;
      setStuck(pickerPassed && !endPassed);
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule, { passive: true });
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, []);

  const activeRole = demo.roles.find((r) => r.id === roleId) ?? null;
  const rendering = roleRenderings.find((r) => r.id === roleId) ?? null;

  function pickRole(id: RoleId) {
    setRoleId(id);
    setOpenNote(null);
  }

  return (
    <SectionShell id="demo" className="mx-auto max-w-6xl px-4 py-20 sm:px-6 md:py-28">
      <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">{demo.title}</h2>
      <p className="mt-6 max-w-prose leading-relaxed text-ink/80">{demo.intro}</p>

      {/* role picker — full cards, always in flow (never swapped or resized) */}
      <div role="group" aria-label={demo.rolePrompt} className="mt-10">
        <p className="text-[0.6875rem] font-medium tracking-[0.14em] text-ink/55 uppercase">
          {demo.rolePrompt}
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {demo.roles.map((role) => {
            const active = role.id === roleId;
            return (
              <button
                key={role.id}
                type="button"
                aria-pressed={active}
                onClick={() => pickRole(role.id)}
                className={`rounded-xl border px-4 py-3.5 text-left transition-colors ${
                  active
                    ? 'border-accent bg-accent/5'
                    : 'border-ink/15 bg-white hover:border-ink/40'
                }`}
              >
                <span
                  className={`block text-sm font-semibold ${active ? 'text-accent' : 'text-ink'}`}
                >
                  {role.label}
                </span>
                <span className="mt-1 block text-xs leading-relaxed text-ink/65">
                  {role.description}
                </span>
              </button>
            );
          })}
        </div>
        {activeRole && (
          <div className="mt-6 flex justify-start lg:justify-end">
            <Toggle
              checked={showShared}
              label={showShared ? demo.toggle.hide : demo.toggle.show}
              onChange={setShowShared}
            />
          </div>
        )}
      </div>

      {/* sentinel: once this line passes under the top bar, the full picker is
          out of view and the compact overlay bar appears */}
      <div ref={pickerEndRef} aria-hidden="true" className="h-px" />

      {/* compact role bar — a fixed overlay portaled to <body> (the section's
          reveal transform would otherwise re-anchor position:fixed). One
          horizontally scrollable row, so it stays a single row even at 390px. */}
      {stuck &&
        createPortal(
          <div
            role="group"
            aria-label={demo.rolePrompt}
            className="fixed inset-x-0 top-14 z-30 border-b border-ink/10 bg-white/95 shadow-[0_8px_16px_-12px_rgba(26,35,50,0.25)] backdrop-blur-sm"
          >
            <div className="mx-auto flex max-w-6xl items-center gap-2 overflow-x-auto px-4 py-3 [scrollbar-width:none] sm:px-6 [&::-webkit-scrollbar]:hidden">
              {!activeRole && (
                <span className="shrink-0 text-sm text-ink/65">
                  {demo.rolePrompt}:
                </span>
              )}
              {demo.roles.map((role) => {
                const active = role.id === roleId;
                return (
                  <button
                    key={role.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => pickRole(role.id)}
                    className={`shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                      active
                        ? 'border-accent bg-accent/5 text-accent'
                        : 'border-ink/15 bg-white text-ink hover:border-ink/40'
                    }`}
                  >
                    {role.label}
                  </button>
                );
              })}
              {activeRole && (
                <div className="ml-auto shrink-0 pl-3">
                  <Toggle
                    checked={showShared}
                    label={showShared ? demo.toggle.hide : demo.toggle.show}
                    onChange={setShowShared}
                  />
                </div>
              )}
            </div>
          </div>,
          document.body,
        )}

      {/* the record card(s) — capped at a readable measure when shown solo;
          full width only in the two-column shared-record view */}
      <div className="mt-8">
        {!activeRole || !rendering ? (
          <EmptyStateCard />
        ) : (
          <div className={`grid items-start gap-6 ${showShared ? 'lg:grid-cols-2' : ''}`}>
            <article
              key={rendering.id}
              className={`fade-swap max-w-3xl rounded-xl border border-ink/15 bg-white shadow-[0_1px_3px_rgba(26,35,50,0.06)] ${
                showShared ? 'lg:max-w-none' : ''
              }`}
            >
              <header className="border-b border-ink/10 px-5 py-4 sm:px-6">
                <p className="text-[0.6875rem] font-medium tracking-[0.14em] text-accent uppercase">
                  {activeRole.label}
                </p>
                <IncidentMeta />
              </header>
              <dl className="px-5 sm:px-6">
                {rendering.fields.map((field, i) => {
                  const noteKey = `${rendering.id}-${i}`;
                  return (
                    <FieldRow
                      key={noteKey}
                      field={field}
                      noteId={`note-${noteKey}`}
                      open={openNote === noteKey}
                      onToggle={() => setOpenNote(openNote === noteKey ? null : noteKey)}
                      onClose={() => setOpenNote(null)}
                    />
                  );
                })}
              </dl>
            </article>

            {showShared && (
              <aside className="fade-swap max-w-3xl rounded-xl border border-ink/15 bg-panel lg:max-w-none">
                <header className="border-b border-ink/10 px-5 py-4 sm:px-6">
                  <p className="text-[0.6875rem] font-medium tracking-[0.14em] text-ink/55 uppercase">
                    {demo.labels.shared}
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-ink/65">
                    {demo.toggle.blurb}
                  </p>
                </header>
                <dl className="px-5 sm:px-6">
                  {sharedRecord.map((field) => (
                    <div
                      key={field.label}
                      className="border-b border-ink/10 py-4 last:border-b-0"
                    >
                      <dt className="text-[0.6875rem] font-medium tracking-[0.14em] text-ink/55 uppercase">
                        {field.label}
                      </dt>
                      <dd className="mt-1.5 text-sm leading-relaxed text-ink/90">
                        <Bidi text={field.value} />
                      </dd>
                    </div>
                  ))}
                </dl>
              </aside>
            )}
          </div>
        )}
      </div>

      {/* the caveat block, quietly under the card */}
      <div className="mt-10 max-w-prose rounded-lg bg-panel p-6">
        <h3 className="text-sm font-semibold">{demo.caveat.title}</h3>
        <ul className="mt-3 space-y-2.5">
          {demo.caveat.lines.map((line) => (
            <li key={line} className="text-sm leading-relaxed text-ink/75">
              {line}
            </li>
          ))}
        </ul>
      </div>

      {/* sentinel: once this line reaches the top bar, the demo is over and
          the compact overlay bar retires */}
      <div ref={sectionEndRef} aria-hidden="true" className="h-px" />
    </SectionShell>
  );
}

/* ------------------------------ sub-pieces ------------------------------- */

function IncidentMeta() {
  return (
    <p className="mt-1.5 text-xs text-ink/55">
      Incident {incident.id} · {incident.date} ·{' '}
      <bdi dir="rtl" lang="ar">
        {incident.place.original}
      </bdi>
    </p>
  );
}

/** Initial state: no role chosen — the shared record, with an invitation. */
function EmptyStateCard() {
  return (
    <article className="max-w-3xl rounded-xl border border-ink/15 bg-white shadow-[0_1px_3px_rgba(26,35,50,0.06)]">
      <header className="border-b border-ink/10 px-5 py-4 sm:px-6">
        <p className="text-[0.6875rem] font-medium tracking-[0.14em] text-ink/55 uppercase">
          {demo.emptyState.heading}
        </p>
        <IncidentMeta />
      </header>
      <div className="mx-5 mt-4 rounded-md border-l-2 border-accent/60 bg-panel px-4 py-3 sm:mx-6">
        <p className="text-sm leading-relaxed text-ink/80">{demo.emptyState.prompt}</p>
      </div>
      <dl className="px-5 sm:px-6">
        {sharedRecord.map((field) => (
          <div key={field.label} className="border-b border-ink/10 py-4 last:border-b-0">
            <dt className="text-[0.6875rem] font-medium tracking-[0.14em] text-ink/55 uppercase">
              {field.label}
            </dt>
            <dd className="mt-1.5 text-[0.9375rem] leading-relaxed text-ink/90">
              <Bidi text={field.value} />
            </dd>
          </div>
        ))}
      </dl>
    </article>
  );
}

/** One field of a role's reading: label + value + flag, with an inline note. */
function FieldRow({
  field,
  noteId,
  open,
  onToggle,
  onClose,
}: {
  field: RoleField;
  noteId: string;
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
}) {
  const chipRef = useRef<HTMLButtonElement>(null);

  function closeAndRefocus() {
    onClose();
    chipRef.current?.focus();
  }

  return (
    <div className="border-b border-ink/10 py-4 last:border-b-0">
      <dt className="text-[0.6875rem] font-medium tracking-[0.14em] text-ink/55 uppercase">
        {field.label}
      </dt>
      <dd className="mt-1.5">
        <p className="text-[0.9375rem] leading-relaxed text-ink/90">
          <Bidi text={field.value} />
        </p>
        <div className="mt-2.5">
          <FlagChip
            ref={chipRef}
            flag={field.flag}
            label={demo.flagLegend[field.flag]}
            expanded={open}
            controlsId={noteId}
            onToggle={onToggle}
          />
        </div>
        {open && (
          <div
            id={noteId}
            className="fade-swap mt-2.5 rounded-md bg-panel px-4 py-3"
            onKeyDown={(e) => {
              if (e.key === 'Escape') closeAndRefocus();
            }}
          >
            <p className="text-sm leading-relaxed text-ink/80">{field.note}</p>
            <button
              type="button"
              onClick={closeAndRefocus}
              className="mt-2 text-xs font-medium text-ink/55 underline underline-offset-2 transition-colors hover:text-ink"
            >
              {demo.labels.noteClose}
            </button>
          </div>
        )}
      </dd>
    </div>
  );
}
