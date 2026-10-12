import React from 'react';
import katex from 'katex';

interface MathRendererProps {
  formula: string;
  displayMode?: boolean;
  className?: string;
}

/**
 * Normalizes academic and scientific formulas into crisp KaTeX syntax
 */
export function normalizeToKatex(raw: string): string {
  if (!raw) return '';
  let str = raw.trim();

  // Strip wrapping $$ or $ or ``` or backticks
  str = str.replace(/^\$\$|\$\$$|^```(?:latex|math)?|```$|^`|`$/g, '').trim();

  // Extract pure formula if squished with "where..." explanation
  if (/,?\s*where\s+/i.test(str) && (str.includes('=') || str.includes('\\sum') || str.includes('sum'))) {
    const parts = str.split(/,?\s*\bwhere\b/i);
    str = parts[0].trim();
  }

  // Handle Big-O Complexity: e.g. "Complexity = O(n^2 * d)" or "O(n^2 * d)"
  if (/Complexity\s*[:=]\s*O\s*\(([^)]+)\)/i.test(str)) {
    str = str.replace(/Complexity\s*[:=]\s*O\s*\(([^)]+)\)/gi, (_, inner) => {
      const cleanInner = inner
        .replace(/[\*∗]/g, ' \\cdot ')
        .replace(/\s+/g, ' ')
        .replace(/n\^2/g, 'n^2')
        .replace(/d_k/g, 'd_k');
      return `\\text{Complexity} = \\mathcal{O}(${cleanInner})`;
    });
  } else if (/\bO\s*\(([^)]+)\)/i.test(str)) {
    str = str.replace(/\bO\s*\(([^)]+)\)/gi, (_, inner) => {
      const cleanInner = inner
        .replace(/[\*∗]/g, ' \\cdot ')
        .replace(/\s+/g, ' ')
        .replace(/n\^2/g, 'n^2')
        .replace(/d_k/g, 'd_k');
      return `\\mathcal{O}(${cleanInner})`;
    });
  }

  // Convert asterisks / unicode asterisks to multiplication dot
  str = str.replace(/[∗\*]/g, ' \\cdot ');

  // Hawkes process & Point processes:
  // e.g. "lambda(t)=mu(t)+sum t i <t alpha*exp(-beta*(t-t i))"
  str = str.replace(/\bsum\s+(?:t\s*i|t_i)\s*<\s*t\b/gi, '\\sum_{t_i < t}');
  str = str.replace(/\bsum\b(?!\w|\{)/g, '\\sum');

  // Subscript t i -> t_i
  str = str.replace(/\bt\s+i\b/g, 't_i');

  // Greek letters (case-insensitive where appropriate)
  str = str.replace(/\blambda\b/gi, '\\lambda');
  str = str.replace(/\bmu\b/gi, '\\mu');
  str = str.replace(/\balpha\b/gi, '\\alpha');
  str = str.replace(/\bbeta\b/gi, '\\beta');
  str = str.replace(/\bsigma\b/gi, '\\sigma');
  str = str.replace(/\bDelta\b/g, '\\Delta');
  str = str.replace(/\bgamma\b/gi, '\\gamma');
  str = str.replace(/\btheta\b/gi, '\\theta');
  str = str.replace(/\bomega\b/gi, '\\omega');
  str = str.replace(/\bepsilon\b/gi, '\\epsilon');

  // Math functions & architectural terms
  str = str.replace(/\bPE\b/g, '\\text{PE}');
  str = str.replace(/\bpos\b/g, '\\text{pos}');
  str = str.replace(/\bLayerNorm\b/g, '\\text{LayerNorm}');
  str = str.replace(/\bSublayer\b/g, '\\text{Sublayer}');
  str = str.replace(/\bexp\b/g, '\\exp');
  str = str.replace(/\bsoftmax\b/g, '\\text{softmax}');
  str = str.replace(/\bAttention\b/g, '\\text{Attention}');
  str = str.replace(/\bMultiHead\b/g, '\\text{MultiHead}');
  str = str.replace(/\bConcat\b/g, '\\text{Concat}');
  str = str.replace(/\bsin\b/g, '\\sin');
  str = str.replace(/\bcos\b/g, '\\cos');

  // Square roots: sqrt(...) -> \sqrt{...}
  str = str.replace(/sqrt\(([^)]+)\)/g, '\\sqrt{$1}');
  str = str.replace(/sqrt\s*([a-zA-Z0-9_]+)/g, '\\sqrt{$1}');

  // Scaled Dot-Product Attention fraction:
  // e.g., (Q \cdot K^T) / \sqrt{d_k} or (Q * K^T) / sqrt(d_k)
  str = str.replace(/\(\s*(Q\s*\\cdot\s*K\^T|Q\s*K\^T)\s*\)\s*\/\s*\\sqrt\{d_k\}/g, '\\frac{$1}{\\sqrt{d_k}}');
  str = str.replace(/(Q\s*\\cdot\s*K\^T|Q\s*K\^T)\s*\/\s*\\sqrt\{d_k\}/g, '\\frac{$1}{\\sqrt{d_k}}');
  str = str.replace(/1\s*\/\s*\\sqrt\{d_k\}/g, '\\frac{1}{\\sqrt{d_k}}');

  // General fractions: (A) / (B) or (A) / \sqrt{B}
  str = str.replace(/\(\s*([^\)]+)\s*\)\s*\/\s*\(\s*([^\)]+)\s*\)/g, '\\frac{$1}{$2}');
  str = str.replace(/\(\s*([^\)]+)\s*\)\s*\/\s*(\\sqrt\{[^\}]+\}|[a-zA-Z0-9_\\]+)/g, '\\frac{$1}{$2}');
  str = str.replace(/([a-zA-Z0-9_\^\{\}]+)\s*\/\s*(\\sqrt\{[^\}]+\}|[a-zA-Z0-9_\\]+)/g, '\\frac{$1}{$2}');

  // Model dimensions & subscripts
  str = str.replace(/d_model/g, 'd_{\\text{model}}');
  str = str.replace(/d_ff/g, 'd_{\\text{ff}}');
  str = str.replace(/d_k/g, 'd_k');

  // Transpose: K^T or Q^T
  str = str.replace(/([A-Z])\^T\b/g, '$1^T');

  return str;
}

export const MathRenderer: React.FC<MathRendererProps> = ({
  formula,
  displayMode = true,
  className = '',
}) => {
  const normalized = normalizeToKatex(formula);

  try {
    const html = katex.renderToString(normalized, {
      displayMode,
      throwOnError: false,
      output: 'htmlAndMathml',
    });

    return (
      <div
        className={`overflow-x-auto py-3.5 px-4 bg-slate-50/90 rounded-xl border border-slate-200/90 text-slate-900 text-sm sm:text-base my-2 font-medium ${className}`}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  } catch (err) {
    // Graceful fallback with formatted text
    return (
      <div className={`p-3 bg-slate-50 rounded-lg border border-slate-200 font-mono text-xs text-slate-800 ${className}`}>
        {formula}
      </div>
    );
  }
};
