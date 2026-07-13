// Demo dataset for the CIVPRO Nexus one-page site.
// One real incident — USYEM250427a — simplified for a first-time visitor.
// Every value traces to 07-prototype/prototype-data.json (dialect renderings,
// claim stacks, sources) and 04-requirements-bridge/personas-and-query-scenarios.md
// (plain-language register). Wording is simplified; facts are never invented.

export type RoleId = 'military' | 'researcher' | 'un' | 'community';

export type Flag = 'exact' | 'close' | 'caveat' | 'unsayable';

export interface RoleField {
  /** Field name, in this role's own vocabulary. */
  label: string;
  /** Field content, in this role's own vocabulary. */
  value: string;
  /** How faithfully the shared record renders into these terms. */
  flag: Flag;
  /** Plain one-liner shown when the flag is clicked. */
  note: string;
}

export interface RoleRendering {
  id: RoleId;
  fields: RoleField[];
}

export interface SharedField {
  label: string;
  value: string;
}

export interface Incident {
  id: string;
  date: string;
  place: {
    /** Place name in its original script. */
    original: string;
    /** The same place, transliterated. */
    transliteration: string;
  };
  /** Headline facts in human words, honest qualifiers kept. */
  headlineFacts: string[];
}

export const incident: Incident = {
  id: 'USYEM250427a',
  date: '27 April 2025',
  place: {
    original: 'منطقة ثقبان بمديرية بني الحارث',
    transliteration: 'Thaqban area, Bani al-Harith District, Sanaa, Yemen',
  },
  headlineFacts: [
    'An airstrike hit three to four adjacent family homes in the evening.',
    '11–13 people reported killed — among them eight children and two women — and four more injured, drawn from 42 public sources.',
    'Attributed to US forces — reported as likely, not officially confirmed.',
  ],
};

/**
 * The shared, neutral record underneath every reading.
 * Same six fields the roles see, in plain neutral words.
 */
export const sharedRecord: SharedField[] = [
  {
    label: 'What happened',
    value:
      'An airstrike hit three to four adjacent homes on the evening of 27 April 2025 — around 8:00 pm local time, recorded as approximate.',
  },
  {
    label: 'Where',
    value:
      'منطقة ثقبان بمديرية بني الحارث — Thaqban area, Bani al-Harith District, Sanaa, Yemen. Location proven with visual evidence; four map points across the struck homes.',
  },
  {
    label: 'Who was reported harmed',
    value:
      '11–13 people reported killed (8 children, 2 women, 1 man) and 4 injured (3 children, 1 man), in three family groups: Masoud — 8 killed; Al-Jamouli — 2 killed; Obeid — 1 killed, 2 injured. The counts differ for stated reasons: one count includes an unborn child, and first-night tolls rose as rescuers reached people buried in the rubble.',
  },
  {
    label: 'Who did it',
    value:
      'Attributed to US forces — named by local sources only; reported as a likely strike, not officially confirmed.',
  },
  {
    label: 'How sure is this',
    value:
      'Reported by two or more credible sources — 42 public sources in all, many in their original Arabic — with likely or confirmed military action nearby that day.',
  },
  {
    label: 'What is the status',
    value:
      'The US military says it is aware of the claims and is conducting its own review; it has not published an assessment of this incident. The record stays open, and every version is dated.',
  },
];

/**
 * The same record, rendered into each role's own vocabulary.
 * Order matches the role pills on the page.
 */
export const roleRenderings: RoleRendering[] = [
  {
    id: 'military',
    fields: [
      {
        label: 'Incident report',
        value:
          'External allegation of civilian casualties — evening of 27 April 2025, vicinity of Sanaa. Cross-referenced to archive code USYEM250427a.',
        flag: 'close',
        note:
          'Outside reports are held as allegations and linked by reference code — military records and this archive point to each other; they are never merged.',
      },
      {
        label: 'Reported involvement',
        value:
          'US involvement reasonably suspected — no finding of responsibility rendered.',
        flag: 'close',
        note:
          "'Reasonably suspected' is this vocabulary's careful phrasing. Words that would assign blame or legal status are withheld, because no such finding exists in the record.",
      },
      {
        label: 'Reported casualties',
        value:
          'Killed: lower bound 11, upper bound 13. Injured: 4. Killed and injured counted separately.',
        flag: 'close',
        note:
          'This vocabulary reports casualties as an upper and lower bound. The reasons the bounds differ — one count includes an unborn child; early tolls rose overnight — stay attached in the shared record.',
      },
      {
        label: 'Assessment status',
        value:
          "Open — no honest value exists yet on the credible / not-credible scale.",
        flag: 'unsayable',
        note:
          "On this scale, 'credible' and 'not credible' are conclusions of the military's own review — which has not concluded for this incident. The researchers' grade answers a different question, so it cannot honestly be restated here. The only truthful value is 'open'.",
      },
      {
        label: 'Damage',
        value: 'Four residential buildings destroyed — recorded as damage to civilian objects.',
        flag: 'caveat',
        note:
          'Military manuals have a familiar two-word term for unintended damage — but its definition builds in findings that the target was lawful and the harm unintended. No one has made those findings here, so this platform will not apply the term to an event that has not been formally assessed.',
      },
      {
        label: 'Families affected',
        value: 'Cannot be said in these terms.',
        flag: 'unsayable',
        note:
          "This vocabulary has no concept of a family or household group. 'Three families — one of which lost eight members' cannot be expressed here; the shared record keeps it, and shows you this note instead of quietly dropping it.",
      },
    ],
  },
  {
    id: 'researcher',
    fields: [
      {
        label: 'Incident',
        value:
          'Airstrike, 27 April 2025, around 8:00 pm local time (time recorded as approximate) — strike status: likely strike.',
        flag: 'exact',
        note:
          "This recorder's own typed way of saying 'around 8pm' — the shared record's concept of imprecise time was built from it.",
      },
      {
        label: 'Location',
        value:
          'منطقة ثقبان بمديرية بني الحارث — Thaqban area, Bani al-Harith District, Sanaa. Precision: exact location, proven with visual evidence.',
        flag: 'caveat',
        note:
          "The proven location covers four map points across several struck homes — more shape than this vocabulary's single map-pin field can hold. The full footprint stays in the shared record.",
      },
      {
        label: 'Civilians reported harmed',
        value:
          '11–13 civilians killed (8 children, 2 women, 1 man); 4 injured (3 children, 1 man).',
        flag: 'caveat',
        note:
          'The range itself is exact, but this vocabulary has no field for why the counts differ — one count includes an unborn child; first-night tolls rose as rescuers reached people buried in the rubble. Those reasons stay attached in the shared record.',
      },
      {
        label: 'Harm grade',
        value:
          "Fair — 'reported by two or more credible sources, with likely or confirmed near actions by a belligerent.'",
        flag: 'exact',
        note:
          "The recorder's own grade, quoted from its published definitions ('belligerent' simply means a force fighting in the conflict).",
      },
      {
        label: 'Attribution',
        value:
          'U.S. Forces — suspected: named by local sources only. Their position: not yet assessed.',
        flag: 'exact',
        note:
          'Three separate judgments — how well reported, whether a strike happened, who did it — kept as three separate answers, never squeezed into one score.',
      },
      {
        label: 'Family groups',
        value:
          'Masoud family — 8 killed · Al-Jamouli family — 2 killed · Obeid family — 1 killed, 2 injured.',
        flag: 'exact',
        note:
          'The only vocabulary in this demo that can group victims by family — the shared concept of a family group was built from it.',
      },
    ],
  },
  {
    id: 'un',
    fields: [
      {
        label: 'Incident entry',
        value: 'Incident entry, ref USYEM250427a — 27 April 2025.',
        flag: 'exact',
        note:
          'Date and incident entry are part of the UN minimum-data list — they carry over without loss.',
      },
      {
        label: 'Location',
        value:
          'Thaqban area, Bani al-Harith District, Sanaa, Yemen — with the method used to confirm the location attached.',
        flag: 'exact',
        note:
          'How a location was established travels with the location itself, as this practice requires.',
      },
      {
        label: 'Casualties',
        value:
          '11–13 killed, 4 injured — broken down by sex and age, with the reasons the counts differ stated in full.',
        flag: 'close',
        note:
          'A close rendering: this practice requires working assumptions to be declared, so the reasons behind the range — one count includes an unborn child; early tolls rose overnight — are spelled out rather than hidden.',
      },
      {
        label: 'Alleged perpetrator',
        value: 'US forces — alleged.',
        flag: 'close',
        note:
          "'Alleged' keeps this a claim rather than a finding. The record says who was named; it does not judge.",
      },
      {
        label: 'Verification status',
        value:
          "Corroborated — supported by multiple sources — under the recorder's stated standard. Not 'verified'.",
        flag: 'unsayable',
        note:
          "In UN practice, 'verified' requires at least three independent kinds of sources — for example a victim, a medical worker, and an authority. That test has not been applied here, so the word is withheld rather than borrowed.",
      },
      {
        label: 'Damage to homes',
        value: 'Cannot be carried in these terms.',
        flag: 'unsayable',
        note:
          'This recording practice is generally limited to deaths and injuries. The destruction of four family homes cannot be said here — it stays in the shared record, and you see this note instead of silence.',
      },
    ],
  },
  {
    id: 'community',
    fields: [
      {
        label: 'What happened',
        value:
          'In the evening of 27 April 2025, an airstrike hit three or four houses standing next to each other in Thaqban, just north of Sanaa.',
        flag: 'exact',
        note: 'Said plainly, with nothing added and nothing hidden.',
      },
      {
        label: 'Who was harmed',
        value:
          'Between 11 and 13 people were reported killed — eight of them children, two of them women — and four more were injured. The Masoud family lost eight people. The Al-Jamouli family lost two. The Obeid family lost one son, and two of its children were hurt.',
        flag: 'exact',
        note:
          'Families are named as families — acknowledgment should not have to wait for a complete list of individual names.',
      },
      {
        label: 'Who did it',
        value:
          'Where reports named anyone, they all named the American military. The strike is reported as likely — the American military has not confirmed it.',
        flag: 'close',
        note:
          'Plain words for a careful claim: attributed to US forces by local sources, reported as likely — not officially confirmed.',
      },
      {
        label: 'How sure is this',
        value:
          'Independent researchers found this reported by two or more credible sources, with likely or confirmed US military action nearby that day.',
        flag: 'close',
        note:
          "The researchers' grade, restated in everyday words — the meaning kept, the label left behind.",
      },
      {
        label: 'What have they said',
        value:
          'The American military says it is aware of the claims that civilians were killed and is looking into them. It has not yet given an answer about this strike.',
        flag: 'exact',
        note:
          "Their words, as reported: 'aware of the claims of civilian casualties', with their own review under way.",
      },
      {
        label: 'What can still happen',
        value:
          'US policy allows acknowledgment, condolences, and help — none of which has to wait for the review to finish — and a separate payment channel exists.',
        flag: 'caveat',
        note:
          "The caveat: by US law, such a payment 'may not be construed or considered as an admission' of any legal obligation. Plainly — money may come without an admission of fault. This record keeps those two things separate, offering neither false hope nor false comfort.",
      },
    ],
  },
];
