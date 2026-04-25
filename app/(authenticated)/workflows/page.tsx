// Static workflow diagram — no data fetching needed

function Step({
  label,
  sublabel,
  color = 'gray',
}: {
  label: string;
  sublabel?: string;
  color?: 'gray' | 'amber' | 'blue' | 'green' | 'red' | 'purple';
}) {
  const colors = {
    gray:   'bg-gray-50 border-gray-200 text-gray-700',
    amber:  'bg-amber-50 border-amber-200 text-amber-800',
    blue:   'bg-blue-50 border-blue-200 text-blue-800',
    green:  'bg-green-50 border-green-200 text-green-800',
    red:    'bg-red-50 border-red-200 text-red-800',
    purple: 'bg-purple-50 border-purple-200 text-purple-800',
  };
  return (
    <div className={`border rounded-lg px-4 py-2.5 text-center ${colors[color]}`}>
      <p className="text-sm font-medium">{label}</p>
      {sublabel && <p className="text-xs mt-0.5 opacity-70">{sublabel}</p>}
    </div>
  );
}

function Arrow({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center my-1">
      {label && <p className="text-xs text-gray-400 mb-0.5">{label}</p>}
      <div className="text-gray-300 text-lg leading-none">↓</div>
    </div>
  );
}

function Badge({ text, color }: { text: string; color: 'n8n' | 'editor' | 'contributor' }) {
  const colors = {
    n8n:         'bg-purple-100 text-purple-700',
    editor:      'bg-blue-100 text-blue-700',
    contributor: 'bg-orange-100 text-orange-700',
  };
  return (
    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded uppercase tracking-wide ${colors[color]}`}>
      {text}
    </span>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-3 text-center">
      {children}
    </p>
  );
}

export default function WorkflowsPage() {
  return (
    <div className="p-8 overflow-auto">
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-gray-900">Pipeline Workflows</h1>
        <p className="text-sm text-gray-500 mt-0.5">Two entry paths — same shared pipeline from draft onwards</p>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mb-8">
        <div className="flex items-center gap-1.5"><Badge text="n8n" color="n8n" /><span className="text-xs text-gray-500">automated</span></div>
        <div className="flex items-center gap-1.5"><Badge text="editor" color="editor" /><span className="text-xs text-gray-500">manual action</span></div>
        <div className="flex items-center gap-1.5"><Badge text="contributor" color="contributor" /><span className="text-xs text-gray-500">image student</span></div>
      </div>

      {/* Two entry paths */}
      <div className="grid grid-cols-2 gap-6 max-w-3xl mb-2">

        {/* FW3 */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <SectionLabel>FW3 — Manual query</SectionLabel>
          <div className="flex flex-col items-stretch gap-0">
            <Step label="Add keyword to Airtable" sublabel="status: backlog" color="gray" />
            <Arrow label="editor" />
            <Step label="Set status → nlp-pending" color="amber" />
            <Arrow />
            <div className="flex justify-center mb-1"><Badge text="n8n WF3" color="n8n" /></div>
            <Step label="Create NeuronWriter analysis" sublabel="2 min wait" color="purple" />
            <Arrow />
            <Step label="Fetch NLP brief + word count" sublabel="writes NLP Brief fields" color="purple" />
            <Arrow />
            <Step label="status → brief-ready" color="amber" />
            <Arrow />
            <div className="flex justify-center mb-1"><Badge text="n8n WF1" color="n8n" /></div>
            <Step label="Claude generates first draft" sublabel="saves HTML + plain text" color="purple" />
          </div>
        </div>

        {/* FW4 */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <SectionLabel>FW4 — NeuronWriter import</SectionLabel>
          <div className="flex flex-col items-stretch gap-0">
            <Step label="Tag queries in NeuronWriter" sublabel="mark as 'import'" color="gray" />
            <Arrow />
            <div className="flex justify-center mb-1"><Badge text="n8n WF4" color="n8n" /></div>
            <Step label="Batch import from NeuronWriter" sublabel="manual trigger in n8n" color="purple" />
            <Arrow />
            <Step label="Create Airtable records" sublabel="NLP data + word count written" color="purple" />
            <Arrow />
            <Step label="status → brief-ready" color="amber" />
            <Arrow />
            <div className="flex justify-center mb-1"><Badge text="n8n WF1" color="n8n" /></div>
            <Step label="Claude generates first draft" sublabel="saves HTML + plain text" color="purple" />
          </div>
        </div>
      </div>

      {/* Convergence arrow */}
      <div className="flex justify-center max-w-3xl">
        <div className="flex flex-col items-center">
          <div className="flex gap-24">
            <div className="text-gray-300 text-lg">↓</div>
            <div className="text-gray-300 text-lg">↓</div>
          </div>
          <div className="w-48 border-t-2 border-gray-200 my-1" />
          <div className="text-gray-300 text-lg">↓</div>
        </div>
      </div>

      {/* Shared pipeline */}
      <div className="max-w-3xl" id="shared">
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <SectionLabel>Shared pipeline — both workflows</SectionLabel>

          <div className="flex flex-col items-stretch gap-0 max-w-xs mx-auto">
            <Step label="status → draft-ready" color="amber" />
            <Arrow />
            <div className="flex justify-center mb-1"><Badge text="editor" color="editor" /></div>
            <Step label="Review draft" sublabel="NLP coverage, voice check, word count" color="blue" />

            {/* Revision loop note */}
            <div className="my-2 border border-dashed border-gray-200 rounded-lg px-3 py-2 text-center">
              <p className="text-xs text-gray-500 font-medium">If revision needed:</p>
              <p className="text-xs text-gray-400 mt-0.5">Write revision notes → status: needs-revision</p>
              <p className="text-xs text-gray-400">→ <span className="text-purple-600 font-medium">WF2</span> revises → draft-ready (repeat)</p>
            </div>

            {/* Enrichment note */}
            <div className="mb-2 border border-dashed border-gray-200 rounded-lg px-3 py-2 text-center">
              <p className="text-xs text-gray-500 font-medium">If enrichment needed:</p>
              <p className="text-xs text-gray-400 mt-0.5">status: needs-enrichment → <span className="text-purple-600 font-medium">WF3</span></p>
              <p className="text-xs text-gray-400">→ awaiting-fact-check → editor verifies</p>
            </div>

            <Arrow label="approve" />
            <Step label="status → approved" color="green" />
            <Arrow />
            <div className="flex justify-center mb-1"><Badge text="editor" color="editor" /></div>
            <Step label="Write image brief" sublabel="status → awaiting-images" color="blue" />
            <Arrow />
            <div className="flex justify-center mb-1"><Badge text="contributor" color="contributor" /></div>
            <Step label="Upload image candidates" sublabel="status → images-submitted" color="blue" />
            <Arrow />
            <div className="flex justify-center mb-1"><Badge text="editor" color="editor" /></div>
            <Step label="Select + approve image" sublabel="status → image-approved" color="green" />
            <Arrow />
            <div className="flex justify-center mb-1"><Badge text="n8n WF5" color="n8n" /></div>
            <Step label="Generate metadata + WP draft" sublabel="status → wp-draft" color="purple" />
            <Arrow />
            <Step label="Published on enjoy.hr" sublabel="status → published" color="green" />
          </div>
        </div>
      </div>

      {/* Status trigger table */}
      <div className="max-w-3xl mt-6">
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <SectionLabel>Status reference — what each status triggers</SectionLabel>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide pb-2 pr-4">Status</th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide pb-2 pr-4">Set by</th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide pb-2">Triggers</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {[
                { status: 'backlog',             by: 'editor',      trigger: 'Nothing — waiting for NLP brief' },
                { status: 'nlp-pending',         by: 'editor',      trigger: 'WF3 — creates NeuronWriter analysis, fetches NLP brief' },
                { status: 'brief-ready',         by: 'WF3 / WF4',   trigger: 'WF1 — Claude generates first draft' },
                { status: 'draft-ready',         by: 'WF1 / WF2',   trigger: 'Nothing — awaits editor review' },
                { status: 'needs-revision',      by: 'editor',      trigger: 'WF2 — Claude revises with revision notes' },
                { status: 'needs-enrichment',    by: 'editor',      trigger: 'WF3 enrichment pass — web-searched facts added' },
                { status: 'awaiting-fact-check', by: 'WF3',         trigger: 'Nothing — editor must verify sources manually' },
                { status: 'approved',            by: 'editor',      trigger: 'Nothing — editor writes image brief next' },
                { status: 'awaiting-images',     by: 'editor',      trigger: 'Contributor sees article in upload queue' },
                { status: 'images-submitted',    by: 'contributor', trigger: 'Editor sees article in attention queue' },
                { status: 'image-approved',      by: 'editor',      trigger: 'WF5 — generates metadata + creates WP draft' },
                { status: 'wp-draft',            by: 'WF5',         trigger: 'Nothing — editor reviews WP draft, publishes manually' },
                { status: 'published',           by: 'editor',      trigger: 'End of pipeline' },
                { status: 'on-hold',             by: 'editor',      trigger: 'Nothing — paused indefinitely' },
                { status: 'error',               by: 'n8n',         trigger: 'Nothing — editor reads error log, resets manually' },
                { status: 'rejected',            by: 'editor',      trigger: 'Nothing — article killed' },
              ].map(row => (
                <tr key={row.status}>
                  <td className="py-2 pr-4">
                    <code className="text-xs bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded font-mono">
                      {row.status}
                    </code>
                  </td>
                  <td className="py-2 pr-4 text-xs text-gray-500">{row.by}</td>
                  <td className="py-2 text-xs text-gray-600">{row.trigger}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
