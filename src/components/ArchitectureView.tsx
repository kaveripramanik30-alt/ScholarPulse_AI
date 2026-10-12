import React, { useState } from 'react';
import {
  Workflow,
  Layers,
  Code2,
  Terminal,
  ShieldCheck,
  CheckCircle2,
  Check,
  Copy,
  Zap,
  ArrowRight,
  Database,
  Cpu,
  FileText,
  Search,
} from 'lucide-react';

export const ArchitectureView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'pipeline' | 'rag' | 'schemas' | 'deployment'>('pipeline');
  const [selectedStageIndex, setSelectedStageIndex] = useState<number>(0);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const stages = [
    {
      num: '01',
      title: 'Multi-Source Ingestion & Identifier Resolution',
      tech: 'arXiv Open Access API, CrossRef REST, Multer Streamer',
      latency: '~250ms - 800ms',
      complexity: 'O(1) Network I/O',
      desc: 'Accepts arXiv IDs (e.g., 1706.03762), DOIs (e.g., 10.1145/3357384), and multipart PDF uploads. Automatically queries arXiv XML and CrossRef APIs to retrieve verified authors, publication dates, and binary document streams.',
      input: 'arXiv URL / DOI / multipart PDF binary',
      output: 'Validated PaperRecord with metadata & cached binary',
      resilience: 'Automatic fallback to embedded metadata extraction if external APIs are unreachable.',
    },
    {
      num: '02',
      title: 'Structure-Aware Layout & Section Extraction',
      tech: 'pdf-parse + Section Boundary Heuristics',
      latency: '~350ms for 15 pages',
      complexity: 'O(n) token sweep',
      desc: 'Isolates Abstract, Introduction, Related Work, Methodology, Experiments, Results, and Limitations into distinct semantic sections, parsing font hierarchies rather than relying on unformatted text dumps.',
      input: 'Raw PDF binary stream',
      output: 'Structured PaperSection[] collection with page ranges',
      resilience: 'De-hyphenation and font correction algorithms prevent squished words and layout anomalies.',
    },
    {
      num: '03',
      title: 'Mathematical KaTeX Normalization',
      tech: 'KaTeX v0.19 + Inline Tokenizer + Unicode PDF Filter',
      latency: '<5ms per section',
      complexity: 'O(m) regex tokenization',
      desc: 'Identifies equations and mathematical notations, converting them into interactive KaTeX chips with strict text-wrapping rules to ensure formulas never clip outside containers.',
      input: 'Raw LaTeX, plain math expressions, and prose',
      output: 'Rendered KaTeX formulas + clean accessible math representations',
      resilience: 'Graceful fallback to monospaced formula cards if KaTeX encounters malformed tokens.',
    },
    {
      num: '04',
      title: 'Section-Preserving Overlapping Chunking',
      tech: 'Recursive Character Partitioning (1100 chars / 200 char overlap)',
      latency: '~15ms',
      complexity: 'O(n) text partitioning',
      desc: 'Partitions text while strictly preserving section boundaries. Ensures mathematical equations, definitions, and citations are never fractured across arbitrary split points.',
      input: 'Structured PaperSection[] collection',
      output: 'Indexed PaperChunk[] collection with unique section & page tags',
      resilience: 'Guarantees paragraph boundary integrity before falling back to sentence-level splits.',
    },
    {
      num: '05',
      title: 'Dense Vector Indexing & Cosine Retrieval',
      tech: 'Normalized TF-IDF & Cosine Similarity Matrix',
      latency: '<10ms query lookup',
      complexity: 'O(k * d) dot-product matrix',
      desc: 'Indexes chunks into a dense similarity matrix. Enables sub-10ms nearest-neighbor retrieval for scientific queries, boosting methodology and experimental sections.',
      input: 'PaperChunk[] index + natural language query',
      output: 'Ranked CitationEvidence[] array (similarity threshold > 0.62)',
      resilience: 'Hybrid keyword-heading boost guarantees relevant chunk retrieval for exact symbol lookups.',
    },
    {
      num: '06',
      title: 'Map-Reduce Schema-Constrained Summarization',
      tech: 'Google Gemini Flash (Structured JSON Schema Mode)',
      latency: '~2.8s complete paper',
      complexity: 'Map(sections) -> Reduce(schema)',
      desc: 'Map phase extracts verified factual claims per section; Reduce phase synthesizes them into an academic JSON schema covering contributions, methodology, quantitative results, and limitations.',
      input: 'Extracted paper sections + academic prompt schema',
      output: 'Validated PaperSummary object adhering strictly to TypeScript interfaces',
      resilience: 'JSON schema constraint guarantees reliable parsing without markdown truncation or missing keys.',
    },
    {
      num: '07',
      title: 'Grounded RAG Dialogue with Citation Verification',
      tech: 'Context-Bound Retrieval & Strict Fact-Checking Prompting',
      latency: '~1.2s response streaming',
      complexity: 'Top-k chunk context injection',
      desc: 'Injects top-ranked chunks into the prompt context and instructs Gemini to answer exclusively from the provided evidence, attaching explicit section and page citations.',
      input: 'User academic query + top-4 ranked chunks + conversation history',
      output: 'Grounded response with verified section tags and page citations',
      resilience: 'Explicit anti-hallucination constraint instructs model to decline queries outside document scope.',
    },
    {
      num: '08',
      title: 'Publication-Grade Math PDF & Citation Export',
      tech: 'jsPDF Vector Layout + Unicode Math Sanitizer + BibTeX Generator',
      latency: '<40ms render time',
      complexity: 'O(k) document formatting',
      desc: 'Generates publication-ready PDF briefs with dedicated mathematical formula callouts, variable breakdowns, and verified citations. Features instant export to BibTeX, APA, and Markdown.',
      input: 'Verified PaperSummary object with mathematical formulations',
      output: 'Downloadable publication PDF, standardized BibTeX reference & Markdown brief',
      resilience: 'WinAnsi sanitization prevents font corruption; fallbacks guarantee clean text layout across all readers.',
    },
  ];

  const schemas = [
    {
      name: 'PaperSummary',
      desc: 'Strict schema generated by Gemini Map-Reduce summarization',
      code: `export interface PaperSummary {
  title: string;
  authors: string[];
  publicationDate: string;
  venueOrCategory: string;
  executiveSummary: string;
  coreContributions: string[];
  methodology: {
    architecture: string;
    keyTechniques: string[];
    benchmarksUsed: string[];
    mathematicalFormulation?: string;
  };
  keyFindings: {
    quantitativeResults: string[];
    qualitativeInsights: string[];
  };
  limitations: string[];
  practicalImplications?: string[];
  keyEquationsOrTheorems?: Array<{
    label: string;
    formulaOrDescription: string;
  }>;
  bibtexCitation: string;
  apaCitation: string;
}`,
    },
    {
      name: 'CitationEvidence',
      desc: 'RAG retrieval chunk match with confidence scores',
      code: `export interface CitationEvidence {
  chunkId: string;
  sectionName: string;
  pageNumber: number;
  heading: string;
  snippet: string;
  relevanceScore: number; // Normalized Cosine Similarity (0.00 - 1.00)
}`,
    },
    {
      name: 'PaperRecord',
      desc: 'Full internal paper entity stored in server memory and database',
      code: `export interface PaperRecord {
  id: string;
  userId?: string;
  title: string;
  authors: string[];
  publicationDate: string;
  venueOrCategory: string;
  arxivId?: string;
  doi?: string;
  abstract: string;
  totalPages: number;
  sections: PaperSection[];
  chunks: PaperChunk[];
  summary?: PaperSummary;
  ingestionSource: 'arxiv' | 'doi' | 'upload';
  createdAt: string;
}`,
    },
  ];

  const currentStage = stages[selectedStageIndex];

  return (
    <div className="space-y-6 my-6">
      {/* Blueprint Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#2596be]/10 border border-[#2596be]/20 text-[#2596be] flex items-center justify-center">
              <Workflow className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                ScholarPulse AI System Architecture
              </h2>
              <span className="text-[11px] font-mono text-[#2596be] font-medium">
                Production Specification · Map-Reduce RAG Engine
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200/60 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Verified Citations
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-mono text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200 font-medium">
              <Zap className="w-3 h-3 text-[#2596be]" />
              Gemini Flash Engine
            </span>
          </div>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed max-w-3xl mt-2">
          ScholarPulse AI is an academic intelligence platform engineered with Retrieval-Augmented Generation (RAG) and schema-constrained Map-Reduce summarization. The architecture guarantees hallucination-free summaries, verified page citations, and publication-ready mathematical formatting.
        </p>

        {/* Deduplicated Navigation Tabs */}
        <div className="flex items-center gap-1 mt-6 border-b border-slate-100 overflow-x-auto pb-px">
          {[
            { id: 'pipeline', label: 'Processing Pipeline', icon: Workflow },
            { id: 'rag', label: 'RAG Retrieval & Guardrails', icon: Search },
            { id: 'schemas', label: 'Data Contracts & Schemas', icon: Code2 },
            { id: 'deployment', label: 'Quickstart & Deployment', icon: Terminal },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-t-lg transition-colors cursor-pointer border-b-2 whitespace-nowrap ${
                  isActive
                    ? 'border-[#2596be] text-[#2596be] font-semibold bg-[#2596be]/5'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab 1: Interactive Processing Pipeline (Deduplicated) */}
      {activeTab === 'pipeline' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
              Pipeline Execution Sequence
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">
              Click any stage to inspect execution parameters
            </span>
          </div>

          {/* Interactive Stage Selector Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
            {stages.map((st, idx) => {
              const isSelected = selectedStageIndex === idx;
              return (
                <button
                  key={st.num}
                  onClick={() => setSelectedStageIndex(idx)}
                  className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#2596be] text-white border-[#2596be] shadow-xs'
                      : 'bg-slate-50 hover:bg-slate-100/80 border-slate-200 text-slate-700'
                  }`}
                >
                  <span className={`text-[10px] font-mono font-bold block mb-1 ${isSelected ? 'text-white/80' : 'text-[#2596be]'}`}>
                    STAGE {st.num}
                  </span>
                  <div className={`text-[11px] font-bold line-clamp-2 leading-tight ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                    {st.title.split(' ')[0]} {st.title.split(' ')[1]}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Single Comprehensive Inspector Card (No duplicate cards below) */}
          <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/70">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <span className="px-2.5 py-0.5 rounded-md font-mono text-xs font-bold bg-[#2596be] text-white">
                  STAGE {currentStage.num}
                </span>
                <h4 className="text-sm font-bold text-slate-900">{currentStage.title}</h4>
              </div>

              <div className="flex items-center gap-2 text-[11px] font-mono">
                <span className="text-slate-500 bg-white px-2.5 py-0.5 rounded border border-slate-200">
                  Latency: <strong className="text-slate-800">{currentStage.latency}</strong>
                </span>
                <span className="text-slate-500 bg-white px-2.5 py-0.5 rounded border border-slate-200">
                  Complexity: <strong className="text-slate-800">{currentStage.complexity}</strong>
                </span>
              </div>
            </div>

            <div className="mt-4 space-y-3.5 text-xs">
              <div>
                <span className="font-semibold text-slate-900">Functional Responsibility: </span>
                <span className="text-slate-600 leading-relaxed">{currentStage.desc}</span>
              </div>

              <div>
                <span className="font-semibold text-slate-900">Technology & Libraries: </span>
                <span className="font-mono text-[11px] text-[#2596be] bg-[#2596be]/5 px-2 py-0.5 rounded border border-[#2596be]/20 ml-1">
                  {currentStage.tech}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                <div className="p-3 bg-white rounded-lg border border-slate-200">
                  <span className="text-[10px] font-mono uppercase font-bold text-slate-400 block mb-1">
                    Input Contract
                  </span>
                  <span className="font-mono text-[11px] text-slate-800">{currentStage.input}</span>
                </div>

                <div className="p-3 bg-white rounded-lg border border-slate-200">
                  <span className="text-[10px] font-mono uppercase font-bold text-slate-400 block mb-1">
                    Output Artifact
                  </span>
                  <span className="font-mono text-[11px] text-slate-800">{currentStage.output}</span>
                </div>
              </div>

              <div className="p-3 bg-emerald-50/70 rounded-lg border border-emerald-200/70 text-emerald-900 text-[11px] flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-semibold">Resilience & Failure Recovery: </strong>
                  <span>{currentStage.resilience}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sequential Dataflow Indicator */}
          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between text-[11px] text-slate-500 font-mono gap-2">
            <span>Dataflow: Ingest → Layout → KaTeX → Chunking → Index → Map-Reduce → RAG Chat → Export</span>
            <span className="text-[#2596be] font-semibold">Stage {selectedStageIndex + 1} of 8 Active</span>
          </div>
        </div>
      )}

      {/* Tab 2: RAG Retrieval & Guardrails */}
      {activeTab === 'rag' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-5">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 font-mono">
              RAG Retrieval Pipeline & Anti-Hallucination Guardrails
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              How ScholarPulse AI achieves deterministic, hallucination-free answers grounded in academic sources.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
              <div className="w-7 h-7 rounded-lg bg-[#2596be]/10 text-[#2596be] flex items-center justify-center mb-2 font-bold text-xs font-mono">
                01
              </div>
              <h4 className="text-xs font-bold text-slate-900 mb-1">Section-Aware Chunking</h4>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Chunks are bounded by academic section headings with 1100-character windows and 200-character overlaps, keeping theorem definitions and citations intact.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
              <div className="w-7 h-7 rounded-lg bg-[#2596be]/10 text-[#2596be] flex items-center justify-center mb-2 font-bold text-xs font-mono">
                02
              </div>
              <h4 className="text-xs font-bold text-slate-900 mb-1">Cosine Similarity Scoring</h4>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Queries are matched against the document index using normalized cosine similarity. Matches below a 0.62 threshold are pruned to prevent out-of-context injections.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
              <div className="w-7 h-7 rounded-lg bg-[#2596be]/10 text-[#2596be] flex items-center justify-center mb-2 font-bold text-xs font-mono">
                03
              </div>
              <h4 className="text-xs font-bold text-slate-900 mb-1">Strict Context Guardrails</h4>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                The Gemini model prompt strictly commands it to answer solely based on the retrieved snippets. If evidence is absent, it explicitly states the paper does not cover the topic.
              </p>
            </div>
          </div>

          <div className="p-4 bg-[#2596be]/5 rounded-xl border border-[#2596be]/20 text-xs">
            <h4 className="font-bold text-slate-900 mb-1 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#2596be]" />
              Citation Verification Contract
            </h4>
            <p className="text-slate-600 leading-relaxed">
              Every RAG response returned to the user interface embeds verified metadata chips including the exact source section name, page number, and similarity score, allowing users to verify claims against the manuscript instantly.
            </p>
          </div>
        </div>
      )}

      {/* Tab 3: Data Contracts & Schemas */}
      {activeTab === 'schemas' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 font-mono">
              Core Data Schemas & Contracts
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Verified TypeScript interfaces governing ingestion, summarization, and retrieval.
            </p>
          </div>

          <div className="space-y-4">
            {schemas.map((s) => (
              <div key={s.name} className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 border-b border-slate-200">
                  <div>
                    <span className="font-mono text-xs font-bold text-slate-900">{s.name}</span>
                    <span className="text-[11px] text-slate-500 ml-2">({s.desc})</span>
                  </div>

                  <button
                    onClick={() => handleCopy(s.code, s.name)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-md bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors cursor-pointer"
                  >
                    {copiedCode === s.name ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedCode === s.name ? 'Copied' : 'Copy Interface'}</span>
                  </button>
                </div>

                <pre className="p-4 bg-slate-900 text-slate-200 font-mono text-[11px] leading-relaxed overflow-x-auto">
                  <code>{s.code}</code>
                </pre>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Quickstart & Deployment */}
      {activeTab === 'deployment' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-[#2596be]" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 font-mono">
              Full-Stack Application Deployment
            </h3>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            ScholarPulse AI runs as a unified Node.js / Express backend with Vite React client on port 3000.
          </p>

          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 border-b border-slate-200">
              <span className="text-xs font-bold text-slate-800">Production Build & Launch Commands</span>
              <button
                onClick={() => handleCopy('npm install\nnpm run build\nnpm start', 'deploy-cmds')}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-md bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors cursor-pointer"
              >
                {copiedCode === 'deploy-cmds' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copiedCode === 'deploy-cmds' ? 'Copied' : 'Copy Commands'}</span>
              </button>
            </div>

            <div className="bg-slate-900 text-slate-200 p-4 font-mono text-xs overflow-x-auto space-y-1.5">
              <div className="text-slate-400"># Install dependencies</div>
              <div>npm install</div>
              <div className="text-slate-400 pt-2"># Start development server on port 3000</div>
              <div>npm run dev</div>
              <div className="text-slate-400 pt-2"># Or build and launch production server</div>
              <div>npm run build && npm start</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
