import React from 'react';
import katex from 'katex';
import { MathRenderer, normalizeToKatex } from './MathRenderer';

interface FormattedTextProps {
  text: string;
  className?: string;
}

/**
 * De-squishes concatenated text from PDF extractions, OCR, or chat
 * e.g., "wherelambda(t)isthetotaleventintensity" -> "Where lambda(t) is the total event intensity"
 */
function desquishText(str: string): string {
  if (!str) return '';
  let s = str;

  // Fix specifically glued variable phrases without touching regular English words
  s = s.replace(/,?\s*wherelambda/gi, ', where lambda');
  s = s.replace(/\bwherelambda/gi, 'where lambda');
  s = s.replace(/\(t\)isthe/gi, '(t) is the ');
  s = s.replace(/\btotaleventintensity\b/gi, 'total event intensity');
  s = s.replace(/\bexogenousbaselinerate\b/gi, 'exogenous baseline rate');
  s = s.replace(/\bindicatingexternalsyntheticinjection\b/gi, 'indicating external synthetic injection');
  s = s.replace(/self−excitationmultiplier|self-excitationmultiplier/gi, 'self-excitation multiplier');
  s = s.replace(/\btemporaldecayparameter\b/gi, 'temporal decay parameter');
  s = s.replace(/\bdenotesthetimestamp\b/gi, 'denotes the timestamp ');
  s = s.replace(/\bprecedingnarrativeevents\b/gi, 'preceding narrative events');
  s = s.replace(/\bandt\s*i\b/gi, 'and t_i ');

  return s;
}

/**
 * Checks if a string is strictly an isolated standalone mathematical equation.
 * Explanatory prose and labeled techniques must NOT be considered isolated equation lines,
 * allowing their text to wrap naturally around math tokens.
 */
function isStandaloneMathEquation(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;

  // Explicit math block markers
  if (trimmed.startsWith('$$') || trimmed.startsWith('```math') || trimmed.startsWith('```latex')) {
    return true;
  }

  // Pure Big-O notation line: "Complexity = O(n^2 * d)" or "O(n^2 * d)"
  if (/^(?:Complexity\s*[:=]\s*)?O\s*\([^\)]+\)$/i.test(trimmed)) {
    return true;
  }

  // If the line has a label prefix ("Name: ...") or Markdown bold prefix, it is a technique or description
  if (/^(?:\*\*)?[A-Za-z0-9\s\-–—/&()]+(?:\*\*)?:\s+/.test(trimmed)) {
    return false;
  }

  // If the line contains explanatory prose words, it is text with inline formulas, NOT a pure standalone equation
  const hasProseWords = /\b(where|allowing|which|denotes|represents|extrapolate|stabilizes|ensures|demonstrates|proposes|computes|defined|consisting|operating|such that|because|divides|projects)\b/i.test(trimmed);
  if (hasProseWords) {
    return false;
  }

  // Count regular English words: if there are more than 4 non-math words, treat as standard text
  const words = trimmed.split(/\s+/).filter(
    (w) =>
      /^[a-zA-Z]{3,}$/.test(w) &&
      !/^(softmax|sqrt|exp|sin|cos|tan|log|min|max|dim|lim|argmax|argmin|Attention|MultiHead|Concat|PE)$/i.test(w)
  );
  if (words.length > 4) {
    return false;
  }

  // Strict standalone equation check: equation must start at the beginning of the line
  if (
    /^(?:Attention|MultiHead|Concat|PE)\s*\([^\)]+\)\s*=/i.test(trimmed) ||
    /^(?:lambda|mu|alpha|beta)\s*\([^\)]+\)\s*=/i.test(trimmed) ||
    /^W(?:_0|\s*0)?\s*\+\s*Delta\s*W\s*=/i.test(trimmed) ||
    /^h\s*=\s*W_?0\s*\*?\s*x/i.test(trimmed) ||
    /^(?:softmax|exp|sqrt)\s*\(.*=/.test(trimmed)
  ) {
    return true;
  }

  return false;
}

export const FormattedText: React.FC<FormattedTextProps> = ({ text, className = '' }) => {
  if (!text) return null;

  // Clean raw formatting noise
  const cleanSource = text.replace(/\$\$/g, '');
  const lines = cleanSource.split(/\r?\n/);
  const elements: React.ReactNode[] = [];

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    // Skip empty lines
    if (!trimmed) {
      elements.push(<div key={`spacer_${i}`} className="h-1.5" />);
      continue;
    }

    // Pure standalone math equation (display mode)
    if (isStandaloneMathEquation(trimmed) && !trimmed.startsWith('#')) {
      elements.push(
        <div key={`eq_line_${i}`} className="my-2.5">
          <MathRenderer formula={trimmed} displayMode={true} />
        </div>
      );
      continue;
    }

    // Heading lines (# or ## or ###)
    if (trimmed.startsWith('### ') || trimmed.startsWith('## ') || trimmed.startsWith('# ')) {
      const headingClean = trimmed.replace(/^#{1,4}\s+/, '');
      elements.push(
        <h3 key={`head_${i}`} className="text-sm sm:text-base font-bold text-slate-900 mt-3 mb-1.5 tracking-tight break-words">
          {renderInlineTokens(headingClean)}
        </h3>
      );
      continue;
    }

    // Bullet point: - or * or 1.
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || /^\d+\.\s/.test(trimmed)) {
      const isNumbered = /^\d+\.\s/.test(trimmed);
      const bulletContent = isNumbered
        ? trimmed.replace(/^\d+\.\s*/, '')
        : trimmed.replace(/^[-*]\s*/, '');

      elements.push(
        <div key={`bullet_${i}`} className="flex items-start gap-2.5 my-1.5 text-xs sm:text-sm text-slate-800 leading-relaxed break-words">
          <span className="w-1.5 h-1.5 rounded-full bg-[#2596be] mt-2 shrink-0" />
          <div className="flex-1 min-w-0">
            {renderInlineTokens(desquishText(bulletContent))}
          </div>
        </div>
      );
      continue;
    }

    // Check if line has a labeled technique format: "Label: Content" or "**Label:** Content"
    const labelMatch = trimmed.match(/^(?:\*\*)?([A-Za-z0-9\s\-–—/&()]+?)(?:\*\*)?:\s+(.*)$/);
    if (labelMatch && !trimmed.startsWith('http')) {
      const label = labelMatch[1].trim();
      const rest = labelMatch[2].trim();

      elements.push(
        <div key={`labeled_${i}`} className="my-1.5 text-xs sm:text-sm text-slate-800 leading-relaxed break-words">
          <span className="font-bold text-slate-900 tracking-tight mr-1.5">{label}:</span>
          {renderInlineTokens(desquishText(rest))}
        </div>
      );
      continue;
    }

    // Standard paragraph with inline formula & prose wrapping
    elements.push(
      <p key={`p_${i}`} className="my-1.5 text-xs sm:text-sm text-slate-800 leading-relaxed break-words">
        {renderInlineTokens(desquishText(trimmed))}
      </p>
    );
  }

  return <div className={`space-y-1 ${className}`}>{elements}</div>;
};

/**
 * Parses bold text (**bold**), formulas, inline math ($math$), and clean variable tokens.
 * Renders formulas inline so surrounding descriptive text wraps naturally and smoothly.
 */
function renderInlineTokens(str: string): React.ReactNode[] {
  if (!str) return [];

  // Match key academic formula patterns, math blocks, bold tokens, and code chips
  const TOKEN_REGEX = /(PE\([^\)]+\)\s*=\s*(?:sin|cos)\([^\)]+\)|(?:Attention|MultiHead|Concat)\([^\)]+\)\s*=\s*(?:softmax\([^\)]+\)\s*\*\s*V|Concat\([^\)]+\)\s*\*\s*W_O|[^,;]+(?:\*\s*V)?)|head_i\s*=\s*Attention\([^\)]+\)|W\s*=\s*W_0\s*\+\s*[^,;]+|h\s*=\s*W_0\s*\*\s*x\s*\+\s*[^,;]+|Output\s*=\s*LayerNorm\([^\)]+\)|Delta\s*W\s*=\s*B\s*\*\s*A|Complexity\s*=\s*O\([^\)]+\)|\bO\([^\)]+\)|sqrt\([^\)]+\)|\$[^\$]+\$|\*\*[^\*]+\*\*|`[^`]+`|\bd_k\s*=\s*d_model\s*\/\s*h\s*=\s*\d+|\bd_(?:model|ff|k|v|q)\s*=\s*\d+|\b[a-zA-Z]+_[a-zA-Z0-9]+(?:\^[a-zA-Z0-9]+)?|\b[a-zA-Z]+\^[a-zA-Z0-9]+)/g;

  const parts = str.split(TOKEN_REGEX);

  return parts.map((part, idx) => {
    if (!part) return null;

    // Check if token is a formula like PE(pos, 2i) = sin(...) or Attention(...) = ... or W = W_0 + ...
    const isFormula =
      /^PE\([^\)]+\)\s*=\s*(?:sin|cos)\([^\)]+\)$/.test(part) ||
      /^(?:Attention|MultiHead|Concat)\([^\)]+\)\s*=\s*/.test(part) ||
      /^head_i\s*=\s*Attention/.test(part) ||
      /^[Wh]\s*=\s*W_0/.test(part) ||
      /^Output\s*=\s*LayerNorm/.test(part) ||
      /^Delta\s*W\s*=\s*B\s*\*\s*A$/.test(part) ||
      /^Complexity\s*=\s*O\(/.test(part);

    if (isFormula) {
      try {
        const html = katex.renderToString(normalizeToKatex(part), {
          displayMode: false,
          throwOnError: false,
        });
        return (
          <span
            key={idx}
            className="inline-flex items-center align-middle mx-1 my-0.5 px-2 py-0.5 bg-slate-100/90 border border-slate-200/90 rounded text-slate-900 text-xs sm:text-sm font-medium shadow-2xs max-w-full overflow-x-auto"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        );
      } catch {
        return (
          <span
            key={idx}
            className="inline-flex items-center align-middle mx-1 my-0.5 px-2 py-0.5 bg-slate-100/90 border border-slate-200/90 rounded font-mono text-[11px] text-[#1d6988] font-semibold"
          >
            {part}
          </span>
        );
      }
    }

    // Inline math $...$
    if (part.startsWith('$') && part.endsWith('$') && part.length > 2) {
      const mathStr = part.slice(1, -1);
      try {
        const html = katex.renderToString(normalizeToKatex(mathStr), {
          displayMode: false,
          throwOnError: false,
        });
        return (
          <span
            key={idx}
            dangerouslySetInnerHTML={{ __html: html }}
            className="inline-flex items-center align-middle mx-0.5 px-1 py-0.5 bg-slate-100/80 border border-slate-200/80 rounded text-slate-900 text-xs font-medium"
          />
        );
      } catch {
        return (
          <span key={idx} className="font-mono text-[#2596be] bg-[#2596be]/10 px-1 py-0.5 rounded text-[11px]">
            {mathStr}
          </span>
        );
      }
    }

    // Big-O notation inline: O(n^2 * d) or O(n^2)
    if (/^O\([^\)]+\)$/i.test(part)) {
      try {
        const html = katex.renderToString(normalizeToKatex(part), { displayMode: false, throwOnError: false });
        return (
          <span
            key={idx}
            dangerouslySetInnerHTML={{ __html: html }}
            className="inline-flex items-center align-middle mx-0.5 px-1 py-0.5 bg-slate-100/80 border border-slate-200/80 rounded text-slate-900 font-semibold"
          />
        );
      } catch {
        return <span key={idx} className="font-mono text-[#2596be]">{part}</span>;
      }
    }

    // Square root inline: sqrt(d_k)
    if (/^sqrt\([^\)]+\)$/i.test(part)) {
      try {
        const html = katex.renderToString(normalizeToKatex(part), { displayMode: false, throwOnError: false });
        return (
          <span
            key={idx}
            dangerouslySetInnerHTML={{ __html: html }}
            className="inline-flex items-center align-middle mx-0.5 px-1 py-0.5 bg-slate-100/80 border border-slate-200/80 rounded text-slate-900 font-medium"
          />
        );
      } catch {
        return <span key={idx} className="font-mono text-[#2596be]">{part}</span>;
      }
    }

    // Variables with subscripts or superscripts: e.g. d_k, W_0, W_q, n^2, QK^T
    if (/^[a-zA-Z]+_[a-zA-Z0-9]+(?:\^[a-zA-Z0-9]+)?$/.test(part) || /^[a-zA-Z]+\^[a-zA-Z0-9]+$/.test(part)) {
      try {
        const html = katex.renderToString(normalizeToKatex(part), { displayMode: false, throwOnError: false });
        return <span key={idx} dangerouslySetInnerHTML={{ __html: html }} className="inline-block px-0.5 align-baseline" />;
      } catch {
        return <span key={idx} className="font-mono text-[#2596be]">{part}</span>;
      }
    }

    // Dimension expressions: d_k = d_model / h = 64
    if (/^d_k\s*=\s*d_model\s*\/\s*h\s*=\s*\d+$/.test(part) || /^d_(?:model|ff|k|v|q)\s*=\s*\d+$/.test(part)) {
      try {
        const html = katex.renderToString(normalizeToKatex(part), { displayMode: false, throwOnError: false });
        return (
          <span
            key={idx}
            dangerouslySetInnerHTML={{ __html: html }}
            className="inline-flex items-center align-middle mx-0.5 px-1.5 py-0.5 bg-slate-100/80 border border-slate-200/80 rounded text-slate-900 font-mono text-xs"
          />
        );
      } catch {
        return <span key={idx} className="font-mono text-[#2596be]">{part}</span>;
      }
    }

    // Bold text **...**
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      const boldText = part.slice(2, -2);
      return (
        <strong key={idx} className="font-bold text-slate-900 tracking-tight">
          {boldText}
        </strong>
      );
    }

    // Inline code `...`
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      const codeText = part.slice(1, -1);
      if (codeText.includes('=') || codeText.includes('_') || codeText.includes('^') || codeText.includes('\\')) {
        try {
          const html = katex.renderToString(normalizeToKatex(codeText), { displayMode: false, throwOnError: false });
          return (
            <span
              key={idx}
              dangerouslySetInnerHTML={{ __html: html }}
              className="inline-flex items-center align-middle mx-0.5 px-1.5 py-0.5 bg-slate-100/90 border border-slate-200/90 rounded text-slate-900"
            />
          );
        } catch {
          return (
            <code key={idx} className="font-mono text-[#1d6988] bg-[#2596be]/10 px-1.5 py-0.5 rounded text-[11px] font-semibold">
              {codeText}
            </code>
          );
        }
      }
      return (
        <code key={idx} className="font-mono text-[#1d6988] bg-[#2596be]/10 px-1.5 py-0.5 rounded text-[11px]">
          {codeText}
        </code>
      );
    }

    // Regular readable text (wraps naturally)
    return <span key={idx}>{part}</span>;
  });
}
