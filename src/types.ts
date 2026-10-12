/**
 * Type definitions for ScholarPulse AI
 */

export interface PaperSection {
  id: string;
  name: string;
  heading: string;
  text: string;
  pageStart: number;
  pageEnd: number;
  charCount: number;
}

export interface PaperChunk {
  id: string;
  sectionName: string;
  heading: string;
  pageNumber: number;
  text: string;
  charCount: number;
  tokenEstimate: number;
}

export interface PaperSummary {
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
    mathematicalFormulation: string;
  };
  keyFindings: {
    quantitativeResults: string[];
    qualitativeInsights: string[];
  };
  limitations: string[];
  practicalImplications: string[];
  keyEquationsOrTheorems: {
    label: string;
    formulaOrDescription: string;
  }[];
  criticalEvaluation: {
    strengths: string[];
    weaknesses: string[];
    potentialBiases: string[];
  };
  bibtexCitation: string;
  apaCitation: string;
}

export interface PaperListItem {
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
  sectionCount: number;
  chunkCount: number;
  hasSummary: boolean;
  ingestionSource: 'upload' | 'arxiv' | 'doi' | 'curated';
  createdAt: string;
  pdfUrl?: string;
}

export interface PaperDetail extends PaperListItem {
  sections: PaperSection[];
  summary?: PaperSummary;
}

export interface CitationEvidence {
  evidenceId: number;
  section: string;
  heading: string;
  page: number;
  snippet: string;
  relevanceScore: number;
}

export interface ChatMessage {
  id: string;
  userId?: string;
  sender: 'user' | 'assistant';
  text: string;
  citations?: CitationEvidence[];
  timestamp: string;
  suggestedFollowUps?: string[];
}
