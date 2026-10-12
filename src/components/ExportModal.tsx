import React, { useState } from 'react';
import { PaperDetail } from '../types';
import { X, Download, FileText, Check, Copy, Bookmark, Loader2 } from 'lucide-react';
import { jsPDF } from 'jspdf';
import {
  sanitizeForPdf,
  cleanMathText,
  isMathematicalItem,
  parseTechniqueItem,
  renderPdfFormulaCard,
} from '../utils/pdfFormatters';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  paper: PaperDetail;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  paper,
}) => {
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  if (!isOpen) return null;

  const downloadBlobFile = (content: string | Blob, filename: string, mimeType: string) => {
    const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  };

  const handleDownloadMarkdownOrBib = (format: 'markdown' | 'bibtex') => {
    const safeTitle = paper.title.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30);
    if (format === 'markdown') {
      const mdContent = generateMarkdownString();
      downloadBlobFile(mdContent, `${safeTitle}_Summary.md`, 'text/markdown;charset=utf-8');
    } else {
      const bibContent = paper.summary?.bibtexCitation || `@article{scholarpulse_${paper.id},
  title={${paper.title}},
  author={${paper.authors.join(' and ')}},
  year={${paper.publicationDate}},
  journal={${paper.venueOrCategory}}
}`;
      downloadBlobFile(bibContent, `${safeTitle}_Citation.bib`, 'text/plain;charset=utf-8');
    }
  };

  const handleDownloadPdf = () => {
    setIsGeneratingPdf(true);
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: 'a4',
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 45;
      const maxLineWidth = pageWidth - margin * 2;
      let cursorY = margin;

      const checkPageBreak = (neededHeight: number) => {
        if (cursorY + neededHeight > pageHeight - margin) {
          doc.addPage();
          cursorY = margin;
        }
      };

      // Header Brand
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(37, 150, 190); // #2596be
      doc.text('SCHOLARPULSE AI  *  ACADEMIC RESEARCH SYNTHESIS', margin, cursorY);
      cursorY += 16;

      // Document Title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(15, 23, 42); // slate-900
      const titleLines = doc.splitTextToSize(sanitizeForPdf(paper.title), maxLineWidth);
      checkPageBreak(titleLines.length * 18 + 20);
      doc.text(titleLines, margin, cursorY);
      cursorY += titleLines.length * 18 + 6;

      // Authors & Metadata
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139); // slate-500
      const metaText = sanitizeForPdf(
        `Authors: ${paper.authors.join(' | ')}   *   Venue: ${paper.venueOrCategory}   *   Published: ${paper.publicationDate}`
      );
      const metaLines = doc.splitTextToSize(metaText, maxLineWidth);
      doc.text(metaLines, margin, cursorY);
      cursorY += metaLines.length * 12 + 10;

      // Divider line
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(1);
      doc.line(margin, cursorY, pageWidth - margin, cursorY);
      cursorY += 16;

      const s = paper.summary;

      const renderSectionHeading = (title: string) => {
        checkPageBreak(35);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10.5);
        doc.setTextColor(29, 105, 136); // #1d6988
        doc.text(sanitizeForPdf(title), margin, cursorY);
        cursorY += 15;
      };

      const renderBodyText = (text: string) => {
        const clean = sanitizeForPdf(text);
        const lines = doc.splitTextToSize(clean, maxLineWidth);
        checkPageBreak(lines.length * 12 + 8);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(51, 65, 85);
        doc.text(lines, margin, cursorY);
        cursorY += lines.length * 12 + 8;
      };

      const renderBulletList = (items: string[]) => {
        for (const item of items) {
          const clean = sanitizeForPdf(item);
          const lines = doc.splitTextToSize(clean, maxLineWidth - 14);
          checkPageBreak(lines.length * 12 + 6);

          // Draw small solid bullet dot
          doc.setFillColor(37, 150, 190); // #2596be
          doc.circle(margin + 4, cursorY + 4, 1.5, 'F');

          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8.5);
          doc.setTextColor(51, 65, 85);
          doc.text(lines, margin + 12, cursorY);
          cursorY += lines.length * 12 + 4;
        }
        cursorY += 6;
      };

      if (s) {
        // 1. Executive Overview
        renderSectionHeading('1. Executive Overview & Problem Context');
        renderBodyText(s.executiveSummary);

        // 2. Core Contributions
        renderSectionHeading('2. Core Scientific Contributions');
        renderBulletList(s.coreContributions || []);

        // 3. Methodology & Architecture
        renderSectionHeading('3. Methodology & System Architecture');
        renderBodyText(s.methodology?.architecture || 'N/A');

        // 4. Key Algorithmic Techniques & Math Formulations
        if (s.methodology?.keyTechniques && s.methodology.keyTechniques.length > 0) {
          renderSectionHeading('4. Key Algorithmic Techniques');
          for (const tech of s.methodology.keyTechniques) {
            if (isMathematicalItem(tech)) {
              const parsed = parseTechniqueItem(tech);
              cursorY = renderPdfFormulaCard(
                doc,
                parsed.title,
                parsed.equation,
                parsed.description,
                margin,
                maxLineWidth,
                cursorY,
                pageHeight,
                checkPageBreak
              );
            } else {
              renderBulletList([tech]);
            }
          }
        }

        // 5. Mathematical Formulation & Variable Breakdown
        if (s.methodology?.mathematicalFormulation) {
          renderSectionHeading('5. Mathematical Formulation & Variables');
          const mathLines = s.methodology.mathematicalFormulation.split('\n\n');
          const primaryFormula = mathLines[0] || '';
          const variableDesc = mathLines.slice(1).join('\n\n');

          cursorY = renderPdfFormulaCard(
            doc,
            'Primary Governing Formulation',
            primaryFormula,
            variableDesc,
            margin,
            maxLineWidth,
            cursorY,
            pageHeight,
            checkPageBreak
          );
        }

        // 6. Explicit Key Equations or Theorems (if present)
        if (s.keyEquationsOrTheorems && s.keyEquationsOrTheorems.length > 0) {
          renderSectionHeading('6. Key Equations & Theorem Callouts');
          for (const eq of s.keyEquationsOrTheorems) {
            cursorY = renderPdfFormulaCard(
              doc,
              eq.label,
              eq.formulaOrDescription,
              '',
              margin,
              maxLineWidth,
              cursorY,
              pageHeight,
              checkPageBreak
            );
          }
        }

        // 7. Empirical Findings
        renderSectionHeading('7. Key Empirical Findings & Benchmarks');
        renderBulletList(s.keyFindings?.quantitativeResults || []);

        // 8. Limitations & Critical Evaluation
        renderSectionHeading('8. Limitations & Critical Evaluation');
        renderBulletList(s.limitations || []);

        // 9. Practical Implications
        if (s.practicalImplications && s.practicalImplications.length > 0) {
          renderSectionHeading('9. Practical Implications');
          renderBulletList(s.practicalImplications);
        }

        // 10. Verified Citations
        renderSectionHeading('10. Verified Citation (BibTeX)');
        doc.setFont('courier', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(71, 85, 105);
        const bibLines = doc.splitTextToSize(sanitizeForPdf(s.bibtexCitation || ''), maxLineWidth - 10);
        checkPageBreak(bibLines.length * 10 + 12);
        doc.setFillColor(248, 250, 252);
        doc.roundedRect(margin, cursorY - 4, maxLineWidth, bibLines.length * 10 + 14, 3, 3, 'F');
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(margin, cursorY - 4, maxLineWidth, bibLines.length * 10 + 14, 3, 3, 'S');
        doc.text(bibLines, margin + 8, cursorY + 8);
        cursorY += bibLines.length * 10 + 20;
      } else {
        renderSectionHeading('Abstract');
        renderBodyText(paper.abstract);
      }

      const safeFilename = `${paper.title.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30)}_Summary.pdf`;
      const pdfBlob = doc.output('blob');
      downloadBlobFile(pdfBlob, safeFilename, 'application/pdf');
    } catch (err) {
      console.error('PDF generation error:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  const generateMarkdownString = () => {
    const s = paper.summary;
    return `# ${paper.title}

**Authors:** ${paper.authors.join(', ')}  
**Year:** ${paper.publicationDate}  
**Venue:** ${paper.venueOrCategory}  

---

## 1. Executive Summary
${s?.executiveSummary || paper.abstract}

## 2. Core Contributions
${s?.coreContributions?.map((c) => `- ${c}`).join('\n') || ''}

## 3. Methodology & Architecture
${s?.methodology?.architecture || ''}

## 4. Key Algorithmic Techniques
${s?.methodology?.keyTechniques?.map((t) => `- ${t}`).join('\n') || ''}

## 5. Mathematical Formulation
${s?.methodology?.mathematicalFormulation || ''}

## 6. Empirical Findings
${s?.keyFindings?.quantitativeResults?.map((r) => `- ${r}`).join('\n') || ''}

## 7. Limitations
${s?.limitations?.map((l) => `- ${l}`).join('\n') || ''}

---

## BibTeX Citation
\`\`\`bibtex
${s?.bibtexCitation || ''}
\`\`\`
`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Export Research Synthesis</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Download complete PDF briefs, Markdown documents, or verified BibTeX citations
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Export Options */}
        <div className="p-6 space-y-4">
          {/* Option 1: Direct PDF Document Download */}
          <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl hover:border-[#2596be]/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#2596be]/10 border border-[#2596be]/20 text-[#2596be] flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">PDF Research Summary (.pdf)</h4>
                <p className="text-[11px] text-slate-500">
                  Publication-grade layout with dedicated mathematical formula callouts & variable tables
                </p>
              </div>
            </div>

            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#2596be] hover:bg-[#1d7c9d] rounded-lg flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Building PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF</span>
                </>
              )}
            </button>
          </div>

          {/* Option 2: Markdown Document */}
          <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl hover:border-[#2596be]/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Markdown Document (.md)</h4>
                <p className="text-[11px] text-slate-500">
                  Plain text formatted report for Obsidian, Notion, or GitHub
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => copyToClipboard(generateMarkdownString(), 'md')}
                className="px-2.5 py-1.5 text-xs text-slate-700 bg-white border border-slate-200 hover:border-slate-300 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
              >
                {copiedType === 'md' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedType === 'md' ? 'Copied' : 'Copy'}</span>
              </button>
              <button
                onClick={() => handleDownloadMarkdownOrBib('markdown')}
                className="px-3 py-1.5 text-xs font-semibold text-slate-800 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>.MD</span>
              </button>
            </div>
          </div>

          {/* Option 3: BibTeX File */}
          <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl hover:border-[#2596be]/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center">
                <Bookmark className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">BibTeX Citation (.bib)</h4>
                <p className="text-[11px] text-slate-500">
                  Ready for LaTeX, Overleaf, Zotero, and Mendeley
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => copyToClipboard(paper.summary?.bibtexCitation || '', 'bib')}
                className="px-2.5 py-1.5 text-xs text-slate-700 bg-white border border-slate-200 hover:border-slate-300 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
              >
                {copiedType === 'bib' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedType === 'bib' ? 'Copied' : 'Copy'}</span>
              </button>
              <button
                onClick={() => handleDownloadMarkdownOrBib('bibtex')}
                className="px-3 py-1.5 text-xs font-semibold text-slate-800 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>.BIB</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
