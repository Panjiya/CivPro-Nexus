/**
 * Generates gemini-handoff.json — a self-contained spec + rubric for handing
 * the CIVPRO Nexus public site to another AI (Gemini) to rebuild, restyle,
 * or extend, without losing the project's non-negotiables.
 *
 * Run: npx tsx scripts/make-handoff.ts   (from 08-website/)
 * The copy and demo data are imported from the SHIPPED site source, so this
 * file never drifts from what was actually built and QA'd.
 */
import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { topBar, hero, problem, demo, how, status, footer } from '../src/content/copy';
import { incident, sharedRecord, roleRenderings } from '../src/content/demo-data';

const handoff = {
  meta: {
    name: 'CIVPRO Nexus — public website prototype handoff',
    version: '1.0',
    generated: '2026-07-11',
    generated_from:
      'The shipped Vite+React+Tailwind prototype in 08-website/ (copy and demo data imported verbatim from src/content/).',
    how_to_use_this_file:
      'You are receiving a complete specification for a small public-facing website. Sections: project_summary tells you what the platform is; hard_rules are non-negotiable constraints on language, tone, and factual discipline — treat them as failing tests, not suggestions; design_system and site_structure describe the current implementation; copy and demo_data are the exact shipped words and data — reuse them verbatim unless asked to rewrite, and if you rewrite, re-apply hard_rules; demo_spec defines the interactive behavior; acceptance_checklist is how the output will be graded. Build with any stack unless instructed otherwise; the reference implementation is Vite + React + TypeScript + Tailwind v4, single page, no router, zero external network requests (fonts and assets bundled locally).',
  },

  project_summary: {
    what_it_is:
      'CIVPRO Nexus — powered by Airwars.org — is a data platform for documenting civilian harm from military operations, so that incidents can be prevented, addressed, and answered for.',
    the_core_idea:
      "Underneath, there is one shared, neutral record of each incident. Every organization's own vocabulary (a military's, a human-rights group's, a UN body's, a community's) is mapped onto that shared record once. Readers then see the same record in their own words — nobody has to adopt anyone else's language. When a term translates imperfectly, or genuinely cannot be said in someone's vocabulary, the reader sees a plain flag saying so; the translation never silently changes meaning.",
    this_deliverable:
      'A simple, beautiful one-page website for someone who has NEVER heard of CIVPRO Nexus. Success: a stranger scrolls for 90 seconds, tries the demo, and can explain the platform to someone else. It conveys what USING the platform feels like — it is not documentation.',
    what_this_is_not:
      'Not the internal program package, not the technical MVP prototype, not a pitch deck. No login, no backend, no real database — one real incident record wired through an interactive demo.',
  },

  hard_rules: {
    plain_language_gate: {
      rule: 'No unexplained term of art anywhere on the page. Every concept is expressed in everyday words first. A term of art may appear only immediately AFTER its plain-words explanation, in the pattern: plain words first, term second.',
      allowed_pattern_example:
        'a shared dictionary of concepts — engineers call it an ontology',
      banned_without_gloss: [
        'ontology', 'dialect', 'canonical', 'fidelity', 'epistemic', 'normative',
        'persona', 'doctrine', 'unitization', 'provenance', 'CHMR',
        'SSSOM', 'SKOS', 'OWL', 'RDF', 'PROV', 'L1/L2/L3/L4', 'cpo:',
        'competency question', 'requirement seed',
      ],
    },
    factual_discipline: {
      attribution:
        'Never state contested attribution as fact. The demo incident is ALWAYS "attributed to US forces" / "reported as likely" — never an unqualified "US strike". This applies to visible copy, meta tags, alt text, and code comments that could surface.',
      numbers:
        'Casualty figures keep their honesty in human words: ranges with sourcing, e.g. "11–13 people reported killed, drawn from 42 public sources". Never round a range to a single number.',
      no_invented_facts:
        'The demo uses one real incident (Airwars record USYEM250427a, 27 April 2025, Sanaa, Yemen). Do not invent additional incidents, casualties, quotes, or sources. Illustrative non-real content must be visibly labeled as illustrative.',
      barred_term:
        "The loaded military term for incidental civilian deaths (two words, initials c.d.) is deliberately never printed in the demo; where a vocabulary would use it, the flag note explains that this platform does not apply it to unadjudicated events. Keep it that way.",
    },
    tone: {
      register:
        'Calm, factual, humane. The subject is civilian harm — dignity and restraint throughout.',
      banned: [
        'hype (revolutionary, game-changing, unprecedented)',
        'advocacy framing or blame language',
        'emotional rhetoric or graphic descriptions/imagery',
        'marketing superlatives',
      ],
    },
    technical: {
      no_external_requests:
        'Zero network calls at runtime: fonts, styles, scripts, and images are bundled locally. No CDNs, no analytics, no tracking.',
      accessibility: [
        'semantic landmarks; exactly one h1',
        'full keyboard operability for the demo (role switching, flag notes, toggle); visible focus styles',
        'prefers-reduced-motion honored: all reveals/crossfades collapse to instant',
        'Arabic text rendered RTL-correctly inside <bdi> elements',
      ],
      responsive: 'Works and looks composed from 390px to 1440px.',
    },
  },

  design_system: {
    typography: {
      family: "'Inter Variable', ui-sans-serif, system-ui, 'Segoe UI', Roboto, sans-serif",
      source: '@fontsource-variable/inter (bundled locally)',
      scale_rem: { micro: 0.6875, small: 0.875, body: 0.9375, lead: 1.125, h2: '1.875–2.25', h1: '2.5–3.5' },
      micro_label_style: 'uppercase, letter-spacing 0.14em, 55% ink opacity — used for kickers, field labels, role prompts',
    },
    color: {
      ink: '#1a2332',
      panel: '#f7f7f5',
      accent: '#c0392b',
      white: '#ffffff',
      accent_usage_rule:
        'The red accent is structural (thin rules, small labels, active role pill, focus outline) — NEVER used as an alarm, severity, or "violation" color, and never on casualty numbers.',
      ink_opacity_steps: ['/90 body', '/80 lead', '/75 quiet', '/65 secondary', '/55 labels', '/15 borders', '/10 hairlines'],
    },
    spacing_and_rhythm: {
      grid: '8px rhythm; section padding py-20 md:py-28; content max-width 72rem (max-w-6xl); prose measure ~65ch (max-w-prose)',
      cards: 'rounded-xl, 1px ink/15 border, shadow [0_1px_3px_rgba(26,35,50,0.06)]',
    },
    motion: {
      scroll_reveal: 'opacity 0→1 + translateY 16px→0, 0.7s ease, via IntersectionObserver (.reveal/.is-visible)',
      demo_crossfade: 'fade-swap keyframes: opacity 0→1 + translateY 6px→0, 0.35s ease, on role change',
      reduced_motion: 'both collapse to instant under prefers-reduced-motion',
    },
    top_bar: 'sticky, 56px (h-14), z-40, white/85 + backdrop-blur, hairline bottom border; wordmark left, jump-to-demo pill right',
    sticky_role_picker:
      'Inside the demo section the role picker is position:sticky at top-14 (below the top bar), z-30. At rest it renders full role cards with descriptions; once pinned it compacts to label-only pills plus the shared-record toggle in one row, gains a hairline bottom border and a soft shadow, over white/95 + backdrop-blur. Implemented with a 1px IntersectionObserver sentinel (rootMargin -57px top). Rationale: switching roles must never require scrolling back up — the record changes in place on screen.',
  },

  site_structure: [
    { section: 'top_bar', purpose: 'wordmark + powered-by + jump to demo', copy_key: 'copy.top_bar' },
    { section: 'hero', purpose: 'what this is, one breath; CTA scrolls to demo', copy_key: 'copy.hero' },
    { section: 'problem', purpose: 'the same kind of event described four colliding ways; the cost of talking past each other', copy_key: 'copy.problem' },
    { section: 'demo', purpose: 'THE product experience: read a real record as one of four roles; flags where translation bends or breaks; toggle to the shared record underneath', copy_key: 'copy.demo + demo_data' },
    { section: 'how_it_works', purpose: 'four plain cards: shared dictionary → translator → evidence record → what happens next', copy_key: 'copy.how' },
    { section: 'status', purpose: 'honest where-this-stands; built with Airwars', copy_key: 'copy.status' },
    { section: 'footer', purpose: 'identity + date + the dignity line', copy_key: 'copy.footer' },
  ],

  demo_spec: {
    initial_state:
      'No role selected: the card shows the shared (neutral) record with an inviting prompt to choose a role.',
    roles: [
      { id: 'military', maps_to: 'military/doctrine vocabulary rendering' },
      { id: 'researcher', maps_to: 'casualty-recorder (Airwars) vocabulary rendering' },
      { id: 'un', maps_to: 'UN investigator vocabulary rendering' },
      { id: 'community', maps_to: 'plain everyday-language rendering' },
    ],
    interactions: [
      'Selecting a role crossfades the record card into that role\'s vocabulary (labels AND values change).',
      'Each field row carries a flag chip: exact / close / caveat / unsayable (plain-language labels in copy.demo.flagLegend). Clicking a chip opens an inline dismissible note explaining the translation state; Escape closes and refocuses the chip.',
      'A "show the shared record underneath" toggle reveals the neutral version side-by-side on desktop, stacked on mobile.',
      'The role picker pins below the top bar while the record is on screen (see design_system.sticky_role_picker).',
      'At least one "unsayable" and one "caveat" flag are reachable across roles — they reflect real translation limits, do not remove them.',
    ],
    flag_semantics: {
      exact: 'said exactly in your terms',
      close: 'close translation — see note',
      caveat: 'translated with a caveat',
      unsayable: "can't be said in these terms — the note explains what concept this vocabulary lacks",
    },
  },

  copy: { top_bar: topBar, hero, problem, demo, how, status, footer },

  demo_data: { incident, shared_record: sharedRecord, role_renderings: roleRenderings },

  acceptance_checklist: [
    'Stranger test: every visible string readable with zero domain knowledge; every banned term glossed plain-words-first at point of use.',
    'Attribution discipline everywhere (visible copy, <title>, meta description): "attributed to US forces", "reported as likely"; no unqualified claim.',
    'The barred two-word term appears nowhere in visible copy.',
    'Role switching visibly changes labels and values across all four roles; flag notes open/dismiss by mouse and keyboard; shared-record toggle works.',
    'Role picker pins below the top bar when scrolled and compacts; switching roles while pinned updates the card without scrolling.',
    'At least one unsayable and one caveat flag reachable; their notes explain why in plain words.',
    'Zero console errors; zero external network requests.',
    'Keyboard-only pass succeeds; focus visible; one h1; landmarks present; Arabic renders RTL inside <bdi>.',
    'Composed at 390px and 1440px; wide content never causes horizontal page scroll.',
    'Tone: calm, humane, no hype, no advocacy, no graphic content.',
  ],

  out_of_scope: [
    'No additional incidents or invented data; no login/auth; no backend; no analytics; no cookie banners.',
    'No legality conclusions or blame assignments anywhere.',
    'Do not add imagery of casualties or destruction; abstract/inline SVG only.',
  ],
};

const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'gemini-handoff.json');
writeFileSync(out, JSON.stringify(handoff, null, 2) + '\n', 'utf8');
console.log('wrote', out);
