'use client';

interface TermResult {
  term: string;
  present: boolean;
}

interface NlpCoverageProps {
  basic: TermResult[];
  extended: TermResult[];
}

function TermList({ terms, label }: { terms: TermResult[]; label: string }) {
  const present = terms.filter(t => t.present).length;
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">{label}</h3>
        <span className="text-xs text-gray-500">{present}/{terms.length}</span>
      </div>
      <div className="space-y-1">
        {terms.map(({ term, present }) => (
          <div key={term} className="flex items-center gap-2">
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${present ? 'bg-green-500' : 'bg-red-400'}`} />
            <span className={`text-xs ${present ? 'text-gray-700' : 'text-red-600 font-medium'}`}>
              {term}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function NlpCoverage({ basic, extended }: NlpCoverageProps) {
  return (
    <div className="space-y-6">
      <TermList terms={basic} label="Body — Basic" />
      <TermList terms={extended} label="Body — Extended" />
    </div>
  );
}
