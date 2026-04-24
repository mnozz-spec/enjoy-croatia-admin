// ─── Term coverage ────────────────────────────────────────────────────────────

export interface TermResult {
  term: string;
  present: boolean;
}

export interface TermCoverage {
  basic: TermResult[];
  extended: TermResult[];
}

function parseTerms(raw: string): string[] {
  return raw
    .split('\n')
    .map(t => t.replace(/:\s*\d+-?\d*x?/i, '').trim().toLowerCase())
    .filter(t => t.length > 2);
}

export function getTermCoverage(
  plainText: string,
  bodyBasic: string,
  bodyExtended: string,
): TermCoverage {
  const text = plainText.toLowerCase();
  const basic = parseTerms(bodyBasic);
  const extended = parseTerms(bodyExtended);

  return {
    basic: basic.map(term => ({ term, present: text.includes(term) })),
    extended: extended.map(term => ({ term, present: text.includes(term) })),
  };
}

// ─── Word count ───────────────────────────────────────────────────────────────

export function countWords(text: string): number {
  return text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
}

export function getWordCountStatus(
  actual: number,
  target: number | undefined,
): 'green' | 'amber' | 'red' | 'neutral' {
  if (!target) return 'neutral';
  const diff = Math.abs(actual - target) / target;
  if (diff <= 0.1) return 'green';
  if (diff <= 0.25) return 'amber';
  return 'red';
}

export function wordCountColor(status: ReturnType<typeof getWordCountStatus>): string {
  return {
    green:   'text-green-600',
    amber:   'text-amber-600',
    red:     'text-red-600',
    neutral: 'text-gray-500',
  }[status];
}

// ─── Voice mismatch ───────────────────────────────────────────────────────────

const VOICE_SIGNALS: Record<string, { own: string[]; foreign: string[] }> = {
  couples: {
    own:     ['partner', 'together', 'romantic', 'couple', 'honeymoon'],
    foreign: ['solo', 'travelling alone', 'by yourself', 'single traveller'],
  },
  solo: {
    own:     ['solo', 'travelling alone', 'independent', 'by yourself'],
    foreign: ['your partner', 'as a couple', 'romantic getaway', 'honeymoon'],
  },
  family: {
    own:     ['children', 'kids', 'family', 'little ones'],
    foreign: ['adults only', 'no children', 'child-free'],
  },
  friends: {
    own:     ['group', 'friends', 'crew', 'squad'],
    foreign: [],
  },
  'active-hiking': {
    own:     ['trail', 'hike', 'elevation', 'summit', 'trek', 'km', 'metres'],
    foreign: [],
  },
};

export function detectVoiceMismatch(plainText: string, voice: string): string | null {
  const text = plainText.toLowerCase();
  const signals = VOICE_SIGNALS[voice];
  if (!signals) return null;

  const foreignFound = signals.foreign.filter(term => text.includes(term));
  if (foreignFound.length > 0) {
    return `Article contains "${foreignFound[0]}" language but Voice is set to ${voice}`;
  }

  if (voice === 'active-hiking' && signals.own.length > 0) {
    const hasOwn = signals.own.some(term => text.includes(term));
    if (!hasOwn) {
      return `No hiking/trail language found but Voice is set to active-hiking`;
    }
  }

  return null;
}

// Returns every foreign-voice term found, not just the first
export function getAllVoiceMismatches(plainText: string, voice: string): string[] {
  const text = plainText.toLowerCase();
  const signals = VOICE_SIGNALS[voice];
  if (!signals) return [];

  const foreign = signals.foreign.filter(term => text.includes(term));

  if (voice === 'active-hiking') {
    const hasOwn = signals.own.some(term => text.includes(term));
    if (!hasOwn) return ['No hiking/trail/elevation language found'];
  }

  return foreign;
}

// ─── Structure check ──────────────────────────────────────────────────────────

export interface StructureReport {
  h2Count: number;
  h3Count: number;
  hasTipOrNote: boolean;
  hasNumberedList: boolean;
}

export function checkStructure(html: string): StructureReport {
  return {
    h2Count:         (html.match(/<h2[\s>]/gi) ?? []).length,
    h3Count:         (html.match(/<h3[\s>]/gi) ?? []).length,
    // Look for tip/note patterns — bold label + colon, or div/aside with class
    hasTipOrNote:    /\b(tip|note|warning|pro tip):/i.test(html) ||
                     /<(div|aside|blockquote)[^>]*class="[^"]*(tip|note|warning)/i.test(html),
    hasNumberedList: /<ol[\s>]/i.test(html),
  };
}
