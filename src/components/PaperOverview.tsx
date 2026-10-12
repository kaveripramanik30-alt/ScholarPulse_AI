import React from 'react';
import { PaperDetail } from '../types';
import { Sparkles, Download, ExternalLink, CheckCircle2, Loader2, Users, RotateCcw } from 'lucide-react';

interface PaperOverviewProps {
  paper: PaperDetail;
  onSummarize: () => void;
  isSummarizing: boolean;
  onOpenExport: () => void;
}

export const PaperOverview: React.FC<PaperOverviewProps> = ({
  paper,
  onSummarize,
  isSummarizing,
  onOpenExport,
}) => {
  let cleanTitle = (paper.title || 'Untitled Research Manuscript').trim();
  if (
    (cleanTitle.startsWith('"') && cleanTitle.endsWith('"') && (cleanTitle.match(/"/g) || []).length === 2) ||
    (cleanTitle.startsWith("'") && cleanTitle.endsWith("'") && (cleanTitle.match(/'/g) || []).length === 2)
  ) {
    cleanTitle = cleanTitle.slice(1, -1).trim();
  }

  const rawAuthors =
    paper.authors && paper.authors.length > 0 && paper.authors[0] !== 'Extracted from Uploaded PDF'
      ? paper.authors
      : paper.summary?.authors && paper.summary.authors.length > 0 && paper.summary.authors[0] !== 'Contributing Academic Researchers'
        ? paper.summary.authors
        : [];

  return (
    <div className="bg-white border-b border-slate-200 py-6 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          {/* Left: Metadata & Title */}
          <div className="flex-1 min-w-0">
            {/* Unboxed clean metadata with typographic separators */}
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-2 font-mono">
              <span className="text-slate-800 font-semibold">{paper.venueOrCategory}</span>
              <span aria-hidden="true">·</span>
              <span>Published {paper.publicationDate}</span>
              <span aria-hidden="true">·</span>
              <span>{paper.totalPages} Pages</span>
              <span aria-hidden="true">·</span>
              <span>{paper.sections?.length || 0} Sections Detected</span>
              <span aria-hidden="true">·</span>
              <span>{paper.chunkCount || 0} Chunks Indexed</span>
              {paper.arxivId && (
                <>
                  <span aria-hidden="true">·</span>
                  <a
                    href={`https://arxiv.org/abs/${paper.arxivId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[#2596be] hover:text-[#1d7c9d] transition-colors"
                  >
                    <span>arXiv:{paper.arxivId}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </>
              )}
              {paper.doi && (
                <>
                  <span aria-hidden="true">·</span>
                  <a
                    href={`https://doi.org/${paper.doi}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[#2596be] hover:text-[#1d7c9d] transition-colors"
                  >
                    <span>doi:{paper.doi}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </>
              )}
            </div>

            {/* Title */}
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 leading-snug">
              {cleanTitle}
            </h1>

            {/* Authors */}
            {rawAuthors.length > 0 ? (
              <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                <Users className="w-3.5 h-3.5 text-slate-400 mr-0.5 shrink-0" />
                {rawAuthors.map((author, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200"
                  >
                    {author}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 mt-2 italic flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-slate-400" />
                <span>Contributing Academic Researchers</span>
              </p>
            )}
          </div>

          {/* Right: Focused Primary Actions */}
          <div className="flex items-center gap-3 shrink-0">
            {!paper.summary ? (
              <button
                onClick={onSummarize}
                disabled={isSummarizing}
                className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#2596be] hover:bg-[#1d7c9d] rounded-lg shadow-sm disabled:opacity-50 transition-colors whitespace-nowrap cursor-pointer"
              >
                {isSummarizing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Synthesizing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Run Synthesis</span>
                  </>
                )}
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg whitespace-nowrap">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Synthesis Complete</span>
                </div>
                <button
                  onClick={onSummarize}
                  disabled={isSummarizing}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors whitespace-nowrap cursor-pointer disabled:opacity-50"
                  title="Re-run synthesis with Gemini 3.8 Flash"
                >
                  <RotateCcw className={`w-3.5 h-3.5 text-slate-500 ${isSummarizing ? 'animate-spin' : ''}`} />
                  <span>{isSummarizing ? 'Synthesizing...' : 'Re-synthesize'}</span>
                </button>
              </div>
            )}

            <button
              onClick={onOpenExport}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg shadow-2xs transition-colors whitespace-nowrap cursor-pointer"
              title="Export report in PDF, Markdown, or BibTeX"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>Export Report</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
