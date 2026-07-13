// Every word on the page, organized by section.
// Plain-language rule: no unexplained term of art anywhere.
// Attribution discipline: never an unqualified "US strike" —
// always "attributed to US forces / reported as likely".

import type { Flag, RoleId } from './demo-data';

/* -------------------------------- top bar -------------------------------- */

export interface TopBarCopy {
  wordmark: string;
  poweredBy: string;
  demoLink: string;
}

export const topBar: TopBarCopy = {
  wordmark: 'CIVPRO Nexus',
  poweredBy: 'powered by Airwars.org',
  demoLink: 'Try the demo',
};

/* ---------------------------------- hero --------------------------------- */

export interface HeroCopy {
  headline: string;
  explainer: string;
  cta: string;
}

export const hero: HeroCopy = {
  headline: 'One record. Everyone’s words.',
  explainer:
    'A shared record of civilian harm that a military analyst, a human-rights researcher, a UN investigator, and an affected family each read in their own words — and where a translation falls short, it says so.',
  cta: 'See it in action',
};

/* -------------------------------- problem -------------------------------- */

export interface ProblemVoice {
  /** Who is speaking, in plain words. */
  speaker: string;
  /** How they would name the same kind of event. */
  quote: string;
}

export interface ProblemCopy {
  title: string;
  setup: string;
  voices: ProblemVoice[];
  /** Small label on the central event marker the four voices converge on. */
  markerLabel: string;
  closing: string;
}

export const problem: ProblemCopy = {
  title: 'One night, four descriptions',
  setup:
    'When civilians are harmed in a military operation, several organizations write down what happened — a military review team, an independent research group, a UN office, and the affected community itself. Each uses the words its own work requires. The same event becomes an allegation in one system, a graded incident in another, a report that is supported but not yet formally verified in a third — and, at home, the night the house was hit. None of these descriptions is wrong. They just don’t line up.',
  voices: [
    {
      speaker: 'A military review team',
      quote:
        'An allegation of civilian casualties, matched against our operations in the area. Status: open — our review has not concluded.',
    },
    {
      speaker: 'A casualty recorder',
      quote:
        'An incident of civilian harm, graded fair — meaning reported by two or more credible sources.',
    },
    {
      speaker: 'A UN report',
      quote:
        'Corroborated — supported by multiple sources — but not verified: verification has its own strict bar of three independent kinds of sources.',
    },
    {
      speaker: 'A family',
      quote:
        'The night our home was hit and our family was killed. We want it written down, and acknowledged by name.',
    },
  ],
  markerLabel: 'One event',
  closing:
    'Four honest descriptions of the same kind of night. When the words don’t line up, the records don’t line up: counts differ, databases can’t be compared, and a family asking what is known waits on translation.',
};

/* ---------------------------------- demo --------------------------------- */

export interface DemoRoleCopy {
  id: RoleId;
  label: string;
  description: string;
}

export interface DemoCopy {
  title: string;
  intro: string;
  /** Short prompt sitting above the role pills. */
  rolePrompt: string;
  roles: DemoRoleCopy[];
  /** Plain labels for the four translation flags. */
  flagLegend: Record<Flag, string>;
  /** Before any role is chosen: the card shows the shared record with this invitation. */
  emptyState: {
    heading: string;
    prompt: string;
  };
  /** Small interface labels around the record card. */
  labels: {
    /** Heading over the neutral panel when it slides in beside a reading. */
    shared: string;
    /** Dismiss button on an open flag note. */
    noteClose: string;
  };
  toggle: {
    show: string;
    hide: string;
    blurb: string;
  };
  caveat: {
    title: string;
    lines: string[];
  };
}

export const demo: DemoCopy = {
  title: 'Read it in your own words',
  intro:
    'This is a real incident record — one strike, documented from 42 public sources. Choose who you are, and read it in your own words.',
  rolePrompt: 'Choose who you are',
  roles: [
    {
      id: 'military',
      label: 'Military analyst',
      description:
        'Reviews outside reports of civilian harm and correlates them with operations.',
    },
    {
      id: 'researcher',
      label: 'Human-rights researcher',
      description:
        'Documents civilian harm from public evidence and grades how well-reported each incident is.',
    },
    {
      id: 'un',
      label: 'UN investigator',
      description:
        'Builds formal findings that must meet strict evidence standards.',
    },
    {
      id: 'community',
      label: 'Community member',
      description:
        'Wants to know what is recorded about their family and their town, in plain words.',
    },
  ],
  flagLegend: {
    exact: 'said exactly in your terms',
    close: 'close translation — see note',
    caveat: 'translated with a caveat',
    unsayable: 'can’t be said in these terms — here’s why',
  },
  emptyState: {
    heading: 'The shared record',
    prompt:
      'This is the neutral record every reading is drawn from. Choose a role above to read the same record in that person’s own words.',
  },
  labels: {
    shared: 'The shared record underneath',
    noteClose: 'Dismiss',
  },
  toggle: {
    show: 'Show the shared record underneath',
    hide: 'Hide the shared record',
    blurb:
      'Every reading above is drawn from this one neutral record. Nothing is retyped by hand, and nothing silently changes meaning on the way through.',
  },
  caveat: {
    title: 'What this record does — and doesn’t — claim',
    lines: [
      'It records that an airstrike hit three to four adjacent homes in Thaqban, Yemen, on the evening of 27 April 2025.',
      'It attributes the strike the way the evidence does: where sources named anyone, they named US forces. It is reported as likely — not officially confirmed, and not yet assessed by the US military.',
      'Its numbers are ranges because sources genuinely differ: 11–13 people reported killed, drawn from 42 public sources — and the reasons the counts differ are recorded too.',
      'It makes no legal finding. It records what is known, who said it, and how sure anyone can honestly be.',
    ],
  },
};

/* ---------------------------------- how ---------------------------------- */

export interface HowCard {
  title: string;
  body: string;
  example: string;
}

export interface HowCopy {
  title: string;
  cards: HowCard[];
}

export const how: HowCopy = {
  title: 'How it works',
  cards: [
    {
      title: 'A shared dictionary of concepts',
      body:
        'At the center sits one carefully defined set of concepts — engineers call it an ontology — that keeps separate the things people tend to blur: what happened, who reported it, and how sure anyone is.',
      example:
        'Example: ‘a family group’ is a concept of its own, because communities often know the family before they know each name.',
    },
    {
      title: 'A translator, built once per organization',
      body:
        'Each organization’s vocabulary is mapped onto the shared concepts one time, by people who know both sides — after that, any record can be read in that organization’s words automatically.',
      example:
        'Example: the researchers’ grade ‘fair’ — reported by two or more credible sources — is never quietly relabeled ‘credible’, a word that belongs to the military’s own review process.',
    },
    {
      title: 'One record, with receipts',
      body:
        'Each incident is one shared record holding its sources, locations, and names — and every fact carries a note of where it came from.',
      example:
        'Example: this incident rests on 42 public sources, from Arabic-language local news to international wire reports — many kept in their original Arabic.',
    },
    {
      title: 'From record to response',
      body:
        'A documented record is a beginning, not an end — it can be connected to acknowledgment, to answers, and to amends.',
      example:
        'Example: a family can see what the US military has said so far, and which response channels remain open, in their own language.',
    },
  ],
};

/* --------------------------------- status -------------------------------- */

export interface StatusCopy {
  title: string;
  body: string;
  next: string;
}

export const status: StatusCopy = {
  title: 'Where this stands',
  body:
    'This is an early prototype, built with Airwars. One real incident is wired end to end — the record you just read. The shared dictionary of concepts is being defined with practitioners now: the people who will actually read these records, in every vocabulary shown above.',
  next: 'What comes next: more incidents, more vocabularies, and the same honesty about every translation.',
};

/* --------------------------------- footer -------------------------------- */

export const footer: string =
  'CIVPRO Nexus — powered by Airwars.org · early prototype, 2026-07-11 · this demo uses one real incident record, shown with the care its subject deserves.';
