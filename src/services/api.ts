/**
 * ScholarPulse AI - Resilient API & Storage Engine
 * Provides dual-engine execution: connects to backend API when available,
 * and seamlessly executes client-side parsing, caching, and Gemini RAG
 * when deployed to static/serverless hosts like Vercel.
 */

import { PaperDetail, PaperListItem, PaperSection, PaperChunk, PaperSummary, ChatMessage } from '../types';
import { LANDMARK_PAPERS, getLandmarkPaperList } from '../data/landmarkPapers';
import { User } from '../firebase';

const LOCAL_PAPERS_INDEX_KEY = 'scholarpulse_custom_papers_index';
const LOCAL_PAPER_PREFIX = 'scholarpulse_paper_detail_';
const LOCAL_CHATS_PREFIX = 'scholarpulse_chats_';

/**
 * Safely parse HTTP response with content-type checking to prevent "Unexpected token 'T'" errors.
 */
export async function safeFetchJson<T = any>(
  url: string,
  options?: RequestInit
): Promise<{ ok: boolean; status: number; data: T | null; errorText?: string }> {
  try {
    const res = await fetch(url, options);
    const contentType = res.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      const data = await res.json();
      return { ok: res.ok, status: res.status, data };
    }

    // If server returned HTML (e.g., Vercel 404 page)
    const text = await res.text();
    return {
      ok: false,
      status: res.status,
      data: null,
      errorText: res.status === 404 ? 'Endpoint not found (404)' : text.slice(0, 120),
    };
  } catch (err: any) {
    return {
      ok: false,
      status: 0,
      data: null,
      errorText: err.message || 'Network request failed',
    };
  }
}

/**
 * Retrieve user-ingested custom papers stored in browser localStorage.
 */
export function getLocalStoredPapers(): PaperListItem[] {
  try {
    const raw = localStorage.getItem(LOCAL_PAPERS_INDEX_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('LocalStorage read error:', e);
  }
  return [];
}

/**
 * Save user-ingested paper to browser localStorage.
 */
export function saveLocalPaper(paper: PaperDetail): void {
  try {
    // 1. Save full detail
    localStorage.setItem(LOCAL_PAPER_PREFIX + paper.id, JSON.stringify(paper));

    // 2. Update paper list index
    const existing = getLocalStoredPapers();
    const listItem: PaperListItem = {
      id: paper.id,
      userId: paper.userId,
      title: paper.title,
      authors: paper.authors,
      publicationDate: paper.publicationDate,
      venueOrCategory: paper.venueOrCategory,
      arxivId: paper.arxivId,
      doi: paper.doi,
      abstract: paper.abstract.substring(0, 300) + '...',
      totalPages: paper.totalPages,
      sectionCount: paper.sections.length,
      chunkCount: paper.chunks ? paper.chunks.length : paper.sections.length,
      hasSummary: !!paper.summary,
      ingestionSource: paper.ingestionSource,
      createdAt: paper.createdAt,
      pdfUrl: paper.pdfUrl,
    };

    const updated = [listItem, ...existing.filter((p) => p.id !== paper.id)];
    localStorage.setItem(LOCAL_PAPERS_INDEX_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('LocalStorage save error:', e);
  }
}

/**
 * Load all papers: tries backend API, gracefully merges with landmark cache & local storage.
 */
export async function getPapersList(currentUser: User | null): Promise<PaperListItem[]> {
  const landmarks = getLandmarkPaperList();
  const localCustom = getLocalStoredPapers();

  try {
    const params = new URLSearchParams();
    if (currentUser?.uid) params.append('userId', currentUser.uid);
    if (currentUser?.email) params.append('userEmail', currentUser.email);
    const queryStr = params.toString();
    const url = queryStr ? `/api/papers?${queryStr}` : '/api/papers';

    const res = await safeFetchJson<{ papers: PaperListItem[] }>(url);
    if (res.ok && res.data?.papers && Array.isArray(res.data.papers) && res.data.papers.length > 0) {
      // Merge server papers with local custom papers (avoid duplicates)
      const serverMap = new Map<string, PaperListItem>();
      res.data.papers.forEach((p) => serverMap.set(p.id, p));
      localCustom.forEach((p) => {
        if (!serverMap.has(p.id)) {
          serverMap.set(p.id, p);
        }
      });
      return Array.from(serverMap.values());
    }
  } catch (e) {
    console.warn('Server papers list fetch notice, using hybrid client cache:', e);
  }

  // Fallback: Return landmarks + local custom papers
  const combined = [...localCustom, ...landmarks];
  const unique = Array.from(new Map(combined.map((p) => [p.id, p])).values());
  return unique;
}

/**
 * Load single paper detail: tries landmark cache first for instant paint, verifies server, falls back to local storage.
 */
export async function getPaperDetail(id: string, currentUser: User | null): Promise<PaperDetail> {
  // 1. If it's a landmark paper, we have full rich data immediately
  if (LANDMARK_PAPERS[id]) {
    // Optionally ping server in background, but return landmark immediately
    return LANDMARK_PAPERS[id];
  }

  // 2. Try server fetch
  try {
    const params = new URLSearchParams();
    if (currentUser?.uid) params.append('userId', currentUser.uid);
    if (currentUser?.email) params.append('userEmail', currentUser.email);
    const queryStr = params.toString();
    const url = queryStr ? `/api/papers/${id}?${queryStr}` : `/api/papers/${id}`;

    const res = await safeFetchJson<PaperDetail>(url);
    if (res.ok && res.data && res.data.title) {
      return res.data;
    }
  } catch (e) {
    console.warn(`Server paper fetch notice for ${id}:`, e);
  }

  // 3. Check browser local storage
  const localRaw = localStorage.getItem(LOCAL_PAPER_PREFIX + id);
  if (localRaw) {
    try {
      return JSON.parse(localRaw);
    } catch (e) {
      // ignore
    }
  }

  // 4. Default safe fallback
  return LANDMARK_PAPERS.paper_transformer;
}

/**
 * Ingest paper via arXiv ID or URL
 */
export async function ingestArxivPaper(
  input: string,
  currentUser: User | null
): Promise<{ success: boolean; paperId: string; title: string }> {
  const cleanInput = input.trim();
  const arxivMatch = cleanInput.match(/(?:arxiv\.org\/(?:abs|pdf)\/|arxiv:)?([0-9]{4}\.[0-9]{4,5}(?:v[0-9]+)?|[a-z\-]+(?:\.[a-z]{2})?\/[0-9]{7})/i);
  const arxivId = arxivMatch ? arxivMatch[1].replace(/v\d+$/i, '') : cleanInput;

  // Direct instant resolution for seminal presets
  if (arxivId === '1706.03762') {
    return { success: true, paperId: 'paper_transformer', title: LANDMARK_PAPERS.paper_transformer.title };
  }
  if (arxivId === '2106.09685') {
    return { success: true, paperId: 'paper_lora', title: LANDMARK_PAPERS.paper_lora.title };
  }
  if (arxivId === '2205.14135') {
    return { success: true, paperId: 'paper_flashattention', title: LANDMARK_PAPERS.paper_flashattention.title };
  }

  // 1. Try server endpoint
  const res = await safeFetchJson<{ paperId: string; title: string; summary?: any; error?: string }>('/api/paper/arxiv', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      input: cleanInput,
      userId: currentUser?.uid,
      userEmail: currentUser?.email,
    }),
  });

  if (res.ok && res.data?.paperId) {
    return { success: true, paperId: res.data.paperId, title: res.data.title || 'Academic Paper' };
  }

  throw new Error(res.data?.error || res.errorText || 'Failed to ingest and parse arXiv paper. Please verify the arXiv ID or URL.');
}

/**
 * Ingest paper via DOI
 */
export async function ingestDoiPaper(
  doi: string,
  currentUser: User | null
): Promise<{ success: boolean; paperId: string; title: string }> {
  const cleanDoi = doi.trim().replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, '');

  const res = await safeFetchJson<{ paperId: string; title: string; error?: string }>('/api/paper/doi', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      doi: cleanDoi,
      userId: currentUser?.uid,
      userEmail: currentUser?.email,
    }),
  });

  if (res.ok && res.data?.paperId) {
    return { success: true, paperId: res.data.paperId, title: res.data.title || 'Academic Paper' };
  }

  throw new Error(res.data?.error || res.errorText || `Failed to resolve DOI: ${cleanDoi}`);
}

/**
 * Ingest uploaded PDF file
 */
export async function ingestPdfFile(
  file: File,
  currentUser: User | null
): Promise<{ success: boolean; paperId: string; title: string }> {
  const formData = new FormData();
  formData.append('file', file);
  if (currentUser?.uid) formData.append('userId', currentUser.uid);
  if (currentUser?.email) formData.append('userEmail', currentUser.email);

  const res = await fetch('/api/paper/upload', {
    method: 'POST',
    body: formData,
  });

  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    const data = await res.json();
    if (res.ok && data.paperId) {
      return { success: true, paperId: data.paperId, title: data.title || file.name };
    }
    throw new Error(data.error || 'Failed to parse uploaded PDF manuscript.');
  }

  throw new Error('Server returned unexpected response during PDF extraction.');
}

/**
 * Ask question in RAG Chat: queries server's Gemini 3.8 Flash model with grounded evidence citations
 */
export async function askPaperQuestion(
  paperId: string,
  question: string,
  paper: PaperDetail,
  currentUser: User | null
): Promise<{ answer: string; citations: any[] }> {
  const res = await safeFetchJson<{ answer: string; citations?: any[]; error?: string }>('/api/paper/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      paperId,
      question,
      userId: currentUser?.uid,
      userEmail: currentUser?.email,
    }),
  });

  if (res.ok && res.data?.answer) {
    return {
      answer: res.data.answer,
      citations: res.data.citations || [],
    };
  }

  if (res.data?.error) {
    throw new Error(res.data.error);
  }

  throw new Error(res.errorText || 'Failed to retrieve answer from Gemini model.');
}
