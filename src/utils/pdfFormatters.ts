import { jsPDF } from 'jspdf';

/**
 * Sanitizes strings for jsPDF Helvetica standard WinAnsi encoding.
 * Prevents mangled symbols, unmapped glyphs, and character crashes.
 */
export function sanitizeForPdf(raw: string): string {
  if (!raw) return '';
  return raw
    // Replace common Unicode quotes and dashes
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, ' - ')
    .replace(/\u2026/g, '...')
    // Replace bullet points
    .replace(/[\u2022\u25E6\u2023]/g, '-')
    // Replace middle dots
    .replace(/[\u00B7\u22C5]/g, '*')
    // Mathematical symbols
    .replace(/\u221A/g, 'sqrt')
    .replace(/\u00D7/g, ' x ')
    .replace(/\u00F7/g, ' / ')
    .replace(/\u2248/g, ' ~= ')
    .replace(/\u2260/g, ' != ')
    .replace(/\u2264/g, ' <= ')
    .replace(/\u2265/g, ' >= ')
    .replace(/\u2192/g, ' -> ')
    .replace(/\u2190/g, ' <- ')
    .replace(/\u221E/g, 'inf')
    .replace(/\u03C0/g, 'pi')
    .replace(/\u03B1/g, 'alpha')
    .replace(/\u03B2/g, 'beta')
    .replace(/\u03B3/g, 'gamma')
    .replace(/\u03B4/g, 'delta')
    .replace(/\u03B5/g, 'epsilon')
    .replace(/\u03BB/g, 'lambda')
    .replace(/\u03BC/g, 'mu')
    .replace(/\u03C3/g, 'sigma')
    .replace(/\u03B8/g, 'theta')
    // Superscripts / Subscripts
    .replace(/\u1D40/g, '^T')
    .replace(/\u00B2/g, '^2')
    .replace(/\u00B3/g, '^3')
    .replace(/\u207F/g, '^n')
    .replace(/\u2081/g, '_1')
    .replace(/\u2082/g, '_2')
    .replace(/\u2083/g, '_3')
    .replace(/\u2084/g, '_4')
    .replace(/\u2096/g, '_k')
    // Clean remaining control chars
    .replace(/[\r\t]/g, ' ');
}

/**
 * Transforms raw LaTeX tokens into pristine, human-readable mathematical notation
 * for publication-grade PDF printout.
 */
export function cleanMathText(raw: string): string {
  if (!raw) return '';
  let str = raw;

  // Strip LaTeX delimiters
  str = str.replace(/\$\$/g, '').replace(/\$/g, '');

  // Strip LaTeX text and styling commands
  str = str.replace(/\\text\{([^}]+)\}/g, '$1');
  str = str.replace(/\\mathrm\{([^}]+)\}/g, '$1');
  str = str.replace(/\\mathbf\{([^}]+)\}/g, '$1');
  str = str.replace(/\\boldsymbol\{([^}]+)\}/g, '$1');
  str = str.replace(/\\mathit\{([^}]+)\}/g, '$1');

  // Fractions: \frac{a}{b} -> (a) / (b)
  str = str.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1) / ($2)');

  // Square roots: \sqrt{x} -> sqrt(x)
  str = str.replace(/\\sqrt\{([^}]+)\}/g, 'sqrt($1)');

  // Operators and functions
  str = str.replace(/\\softmax\b/g, 'softmax');
  str = str.replace(/\\exp\b/g, 'exp');
  str = str.replace(/\\log\b/g, 'log');
  str = str.replace(/\\ln\b/g, 'ln');
  str = str.replace(/\\sin\b/g, 'sin');
  str = str.replace(/\\cos\b/g, 'cos');
  str = str.replace(/\\tan\b/g, 'tan');
  str = str.replace(/\\tanh\b/g, 'tanh');
  str = str.replace(/\\min\b/g, 'min');
  str = str.replace(/\\max\b/g, 'max');
  str = str.replace(/\\arg\b/g, 'arg');
  str = str.replace(/\\det\b/g, 'det');

  // Math symbols
  str = str.replace(/\\cdot/g, ' * ');
  str = str.replace(/\\times/g, ' x ');
  str = str.replace(/\\sum_\{([^}]+)\}\^\{([^}]+)\}/g, 'SUM($1..$2)');
  str = str.replace(/\\sum/g, 'SUM');
  str = str.replace(/\\prod/g, 'PROD');
  str = str.replace(/\\in\b/g, ' in ');
  str = str.replace(/\\approx/g, ' ~= ');
  str = str.replace(/\\le/g, ' <= ');
  str = str.replace(/\\ge/g, ' >= ');
  str = str.replace(/\\neq/g, ' != ');
  str = str.replace(/\\to/g, ' -> ');
  str = str.replace(/\\rightarrow/g, ' -> ');

  // Greek letters
  str = str.replace(/\\alpha/g, 'alpha');
  str = str.replace(/\\beta/g, 'beta');
  str = str.replace(/\\gamma/g, 'gamma');
  str = str.replace(/\\delta/g, 'delta');
  str = str.replace(/\\epsilon/g, 'epsilon');
  str = str.replace(/\\lambda/g, 'lambda');
  str = str.replace(/\\mu/g, 'mu');
  str = str.replace(/\\sigma/g, 'sigma');
  str = str.replace(/\\theta/g, 'theta');
  str = str.replace(/\\omega/g, 'omega');

  // Clean superscripts & subscripts curly braces
  str = str.replace(/\^\{([^}]+)\}/g, '^($1)');
  str = str.replace(/_\{([^}]+)\}/g, '_$1');

  // Remove leftover backslashes
  str = str.replace(/\\/g, '');

  return sanitizeForPdf(str).trim();
}

/**
 * Checks if a text snippet represents a mathematical formula or algorithmic equation.
 */
export function isMathematicalItem(text: string): boolean {
  if (!text) return false;
  return (
    text.includes('=') &&
    (text.includes('Attention(') ||
      text.includes('PE(') ||
      text.includes('MultiHead(') ||
      text.includes('softmax(') ||
      text.includes('LayerNorm(') ||
      text.includes('sqrt(') ||
      text.includes('10000^') ||
      text.includes('O(') ||
      text.includes('d_model') ||
      text.includes('d_k') ||
      text.includes('W_O') ||
      text.includes('Q * K') ||
      text.includes('sin(') ||
      text.includes('cos('))
  );
}

/**
 * Parses technique strings into structured components: title, equation, and description.
 * Example input: "Scaled Dot-Product Attention: Attention(Q, K, V) = softmax( (Q * K^T) / sqrt(d_k) ) * V, where sqrt(d_k) divides..."
 */
export function parseTechniqueItem(item: string): {
  title: string;
  equation: string;
  description: string;
} {
  const sanitized = cleanMathText(item);

  // Check for Title: Equation format
  const colonIdx = sanitized.indexOf(':');
  if (colonIdx > 0 && colonIdx < 50) {
    const title = sanitized.slice(0, colonIdx).trim();
    const rest = sanitized.slice(colonIdx + 1).trim();

    // Check for "where ..." or ", where ..." or "; where ..."
    const whereMatch = rest.match(/[,;]?\s+(where\s+.+|allowing\s+.+|to\s+prevent\s+.+)/i);
    if (whereMatch && whereMatch.index !== undefined) {
      const equation = rest.slice(0, whereMatch.index).trim();
      const description = rest.slice(whereMatch.index).replace(/^[,;]\s*/, '').trim();
      return { title, equation, description };
    }

    return { title, equation: rest, description: '' };
  }

  return { title: 'Mathematical Formulation', equation: sanitized, description: '' };
}

/**
 * Renders an isolated, publication-grade Mathematical Callout Card into jsPDF.
 * Uses crisp `#2596be` brand borders, soft tinted background, bold monospace formula,
 * and indented variable descriptions.
 */
export function renderPdfFormulaCard(
  doc: jsPDF,
  title: string,
  equation: string,
  description: string,
  margin: number,
  maxLineWidth: number,
  cursorY: number,
  pageHeight: number,
  checkPageBreak: (neededHeight: number) => void
): number {
  const cleanTitle = sanitizeForPdf(title);
  const cleanEq = cleanMathText(equation);
  const cleanDesc = sanitizeForPdf(description);

  // Measure heights
  doc.setFont('courier', 'bold');
  doc.setFontSize(9.5);
  const eqLines = doc.splitTextToSize(cleanEq, maxLineWidth - 28);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  const descLines = cleanDesc
    ? doc.splitTextToSize(cleanDesc, maxLineWidth - 28)
    : [];

  const headerHeight = 16;
  const eqHeight = eqLines.length * 13 + 6;
  const descHeight = descLines.length > 0 ? descLines.length * 11 + 8 : 0;
  const totalCardHeight = headerHeight + eqHeight + descHeight + 14;

  // Verify page break before drawing card
  checkPageBreak(totalCardHeight + 10);

  // Card Background: Tinted light cyan (#f1f9fc)
  doc.setFillColor(241, 249, 252);
  doc.roundedRect(margin, cursorY, maxLineWidth, totalCardHeight, 4, 4, 'F');

  // Left Accent Bar in Brand Color: #2596be
  doc.setFillColor(37, 150, 190);
  doc.roundedRect(margin, cursorY, 4, totalCardHeight, 2, 2, 'F');

  // Subtle Border
  doc.setDrawColor(210, 232, 242);
  doc.setLineWidth(0.75);
  doc.roundedRect(margin, cursorY, maxLineWidth, totalCardHeight, 4, 4, 'S');

  // Title / Label in Brand Dark
  let localY = cursorY + 13;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(29, 105, 136); // #1d6988
  doc.text(`EQUATION: ${cleanTitle.toUpperCase()}`, margin + 14, localY);
  localY += 13;

  // Equation in Monospace Bold
  doc.setFont('courier', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text(eqLines, margin + 14, localY);
  localY += eqLines.length * 13;

  // Description / Variable glossary
  if (descLines.length > 0) {
    // Hairline divider
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(margin + 14, localY - 3, margin + maxLineWidth - 14, localY - 3);

    localY += 7;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105); // slate-600
    doc.text(descLines, margin + 14, localY);
    localY += descLines.length * 11;
  }

  return cursorY + totalCardHeight + 8;
}
