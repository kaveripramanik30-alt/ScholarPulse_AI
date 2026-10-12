import React, { useState } from 'react';
import { PaperDetail } from '../types';
import { FormattedText } from './FormattedText';
import {
  BookOpen,
  Award,
  Layers,
  BarChart3,
  AlertTriangle,
  Copy,
  Check,
  Sparkles,
  Compass,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';

interface StructuredSummaryProps {
  paper: PaperDetail;
  onRunSummarize: () => void;
  isSummarizing: boolean;
  onOpenChatWithQuery?: (query: string) => void;
}

export const StructuredSummary: React.FC<StructuredSummaryProps> = ({
  paper,
  onRunSummarize,
  isSummarizing,
  onOpenChatWithQuery,
}) => {
  const [copiedBibtex, setCopiedBibtex] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedBibtex(true);
    setTimeout(() => setCopiedBibtex(false), 2000);
  };

  const summary = paper.summary;

  if (!summary) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center my-6 shadow-xs">
        <div className="max-w-md mx-auto space-y-4">
          <div className="w-12 h-12 rounded-xl bg-[#2596be]/10 border border-[#2596be]/20 text-[#2596be] flex items-center justify-center mx-auto">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-900">
            Map-Reduce Synthesis Ready
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            The paper has been structured into {paper.sections?.length || 0} sections and {paper.chunkCount || 0} vector chunks.
            Run the Gemini 3.8 Flash Map-Reduce pipeline to generate a comprehensive academic synthesis covering core contributions, architecture pipelines, readable mathematical formulations, empirical results, and limitations.
          </p>
          <div className="pt-2">
            <button
              onClick={onRunSummarize}
              disabled={isSummarizing}
              className="px-5 py-2.5 text-xs font-semibold text-white bg-[#2596be] hover:bg-[#1d7c9d] rounded-lg shadow-sm disabled:opacity-50 transition-colors inline-flex items-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isSummarizing ? 'Synthesizing with Gemini Flash...' : 'Run Map-Reduce Summarization'}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 my-6">
      {/* 1. Executive Summary */}
      <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#2596be]" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 font-mono">
              01. Executive Overview & Problem Context
            </h2>
          </div>
          <span className="text-[11px] font-mono text-[#2596be] bg-[#2596be]/10 border border-[#2596be]/20 px-2.5 py-0.5 rounded font-medium">
            Synthesized Analysis
          </span>
        </div>
        <div className="text-slate-800 text-sm leading-relaxed whitespace-pre-wrap">
          <FormattedText text={summary.executiveSummary} />
        </div>
      </section>

      {/* 2. Core Scientific Contributions */}
      <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-2.5">
          <Award className="w-4 h-4 text-[#2596be]" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 font-mono">
            02. Core Scientific Contributions
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {summary.coreContributions?.map((item, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/90 hover:border-[#2596be]/50 transition-colors"
            >
              <span className="text-[11px] font-mono font-bold text-[#2596be] block mb-1.5 uppercase">
                Contribution {idx + 1}
              </span>
              <div className="text-xs text-slate-800 leading-relaxed">
                <FormattedText text={item} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Methodology & System Architecture */}
      <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
          <Compass className="w-4 h-4 text-[#2596be]" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 font-mono">
            03. Methodology & System Architecture
          </h2>
        </div>

        {/* Architecture Pipeline Narrative */}
        <div className="bg-slate-50/70 p-5 rounded-xl border border-slate-200/80">
          <h3 className="text-xs font-bold text-slate-900 uppercase font-mono tracking-wider mb-2 flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#2596be]" />
            <span>End-to-End Architectural Pipeline & Data Flow</span>
          </h3>
          <div className="text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
            <FormattedText text={summary.methodology?.architecture} />
          </div>
        </div>

        {/* Key Algorithmic Techniques (Clean, separate section) */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-900 uppercase font-mono tracking-wider">
            Key Algorithmic Techniques
          </h3>
          <div className="grid grid-cols-1 gap-3">
            {summary.methodology?.keyTechniques?.map((tech, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-slate-50/50 border border-slate-200/80 text-xs text-slate-800 leading-relaxed flex items-start gap-3 hover:border-slate-300 transition-colors"
              >
                <span className="w-5 h-5 rounded-md bg-[#2596be]/10 border border-[#2596be]/20 text-[#2596be] font-mono text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <FormattedText text={tech} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Evaluation Benchmarks & Datasets (Separated cleanly below techniques, never clashing) */}
        <div className="space-y-3 pt-2">
          <h3 className="text-xs font-bold text-slate-900 uppercase font-mono tracking-wider flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-slate-600" />
            <span>Evaluation Benchmarks & Datasets</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {summary.methodology?.benchmarksUsed?.map((bm, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-slate-50/50 border border-slate-200/80 text-xs text-slate-800 leading-relaxed"
              >
                <div className="font-semibold text-slate-900 mb-1">Benchmark {idx + 1}</div>
                <FormattedText text={bm} />
              </div>
            ))}
          </div>
        </div>

        {/* Mathematical Formulation Card */}
        {summary.methodology?.mathematicalFormulation && (
          <div className="bg-[#2596be]/5 p-5 rounded-xl border border-[#2596be]/20">
            <h3 className="text-xs font-bold text-[#1d6988] uppercase font-mono tracking-wider mb-2">
              Mathematical Formulation & Formulation Mechanics
            </h3>
            <div className="text-xs text-slate-800 leading-relaxed">
              <FormattedText text={summary.methodology.mathematicalFormulation} />
            </div>
          </div>
        )}
      </section>

      {/* 4. Empirical Findings & Benchmarks */}
      <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-2.5">
          <BarChart3 className="w-4 h-4 text-[#2596be]" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 font-mono">
            04. Empirical Findings & Baseline Comparisons
          </h2>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase font-mono tracking-wider mb-2">
              Quantitative Metrics & SOTA Gains
            </h3>
            <div className="grid grid-cols-1 gap-2.5">
              {summary.keyFindings?.quantitativeResults?.map((res, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg bg-emerald-50/40 border border-emerald-100 text-xs text-slate-800 leading-relaxed flex items-start gap-2.5"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-2 shrink-0" />
                  <div className="flex-1">
                    <FormattedText text={res} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {summary.keyFindings?.qualitativeInsights && summary.keyFindings.qualitativeInsights.length > 0 && (
            <div className="pt-2">
              <h3 className="text-xs font-bold text-slate-900 uppercase font-mono tracking-wider mb-2">
                Qualitative & Mechanistic Insights
              </h3>
              <div className="space-y-2">
                {summary.keyFindings.qualitativeInsights.map((ins, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800 leading-relaxed"
                  >
                    <FormattedText text={ins} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 5. Limitations & Critical Evaluation */}
      <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-600" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 font-mono">
            05. Limitations & Critical Boundary Conditions
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {summary.limitations?.map((lim, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-xl bg-amber-50/40 border border-amber-200/70 text-xs text-slate-800 leading-relaxed flex items-start gap-3"
            >
              <span className="w-5 h-5 rounded-md bg-amber-100 text-amber-800 font-mono text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                !
              </span>
              <div className="flex-1">
                <FormattedText text={lim} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. Verified Citation & Export */}
      <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#2596be]" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 font-mono">
              06. Academic Citation (BibTeX)
            </h2>
          </div>
          <button
            onClick={() => copyToClipboard(summary.bibtexCitation)}
            className="inline-flex items-center gap-1.5 px-3 py-1 text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            {copiedBibtex ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedBibtex ? 'Copied BibTeX' : 'Copy BibTeX'}</span>
          </button>
        </div>
        <pre className="p-4 bg-slate-900 text-slate-100 rounded-xl font-mono text-[11px] overflow-x-auto leading-relaxed">
          {summary.bibtexCitation}
        </pre>
      </section>

      {/* RAG Chat Prompter Action */}
      {onOpenChatWithQuery && (
        <div className="p-4 bg-[#2596be]/10 border border-[#2596be]/20 rounded-xl flex items-center justify-between gap-4">
          <div>
            <h4 className="text-xs font-bold text-[#1a566d]">Have deeper questions about this paper?</h4>
            <p className="text-[11px] text-[#1d6988] mt-0.5">
              Ask in RAG Chat Studio for intuitive mathematical derivations, architecture comparisons, and grounded insights.
            </p>
          </div>
          <button
            onClick={() => onOpenChatWithQuery('Explain the core intuition and methodology of this paper.')}
            className="px-4 py-2 text-xs font-semibold text-white bg-[#2596be] hover:bg-[#1d7c9d] rounded-lg transition-colors shrink-0 cursor-pointer flex items-center gap-1.5"
          >
            <span>Ask in DeepChat</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
