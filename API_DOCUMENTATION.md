# ScholarPulse AI — RESTful API Specification

Base URL: `http://localhost:3000` (or `http://localhost:8000` for Python FastAPI backend)

---

## 1. Paper Ingestion

### `POST /api/paper/upload`
Uploads a raw multi-column academic PDF.
- **Content-Type**: `multipart/form-data`
- **Body**: `file: <Binary PDF>` (up to 35MB)
- **Response**:
```json
{
  "success": true,
  "paperId": "paper_up_1742081234",
  "title": "Extracted Paper Title",
  "totalPages": 12,
  "sectionsCount": 8,
  "chunksCount": 34,
  "message": "PDF successfully ingested and structured."
}
```

### `POST /api/paper/arxiv`
Ingests directly from arXiv via Open Access XML API and PDF repository.
- **Content-Type**: `application/json`
- **Body**:
```json
{
  "input": "1706.03762" // or "https://arxiv.org/abs/1706.03762"
}
```
- **Response**:
```json
{
  "success": true,
  "paperId": "paper_arxiv_1706_03762",
  "title": "Attention Is All You Need",
  "authors": ["Ashish Vaswani", "Noam Shazeer", "..."],
  "totalPages": 11,
  "sectionsCount": 5,
  "chunksCount": 28,
  "pdfUrl": "https://arxiv.org/pdf/1706.03762.pdf"
}
```

### `POST /api/paper/doi`
Resolves publication metadata and Open Access link from CrossRef API.
- **Content-Type**: `application/json`
- **Body**:
```json
{
  "doi": "10.1038/s41586-020-2649-2"
}
```

---

## 2. Summarization & Map-Reduce

### `POST /api/paper/summarize`
Executes Map-Reduce summarization using Google Gemini 3.8 Flash.
- **Body**:
```json
{
  "paperId": "paper_transformer"
}
```
- **Response**:
```json
{
  "summary": {
    "title": "Attention Is All You Need",
    "authors": ["Ashish Vaswani", "..."],
    "publicationDate": "2017",
    "venueOrCategory": "NeurIPS 2017 (cs.CL)",
    "executiveSummary": "Introduces the Transformer architecture...",
    "coreContributions": ["Multi-head self attention...", "..."],
    "methodology": {
      "architecture": "Encoder-Decoder stack of 6 layers...",
      "keyTechniques": ["Scaled Dot-Product", "Positional Encodings"],
      "benchmarksUsed": ["WMT 2014 En-De", "WMT 2014 En-Fr"],
      "mathematicalFormulation": "Attention(Q, K, V) = softmax(QK^T / sqrt(d_k))V"
    },
    "keyFindings": {
      "quantitativeResults": ["28.4 BLEU on En-De..."],
      "qualitativeInsights": ["Heads specialize in syntax..."]
    },
    "limitations": ["O(N^2) memory complexity..."],
    "practicalImplications": ["Foundation for all modern LLMs..."],
    "bibtexCitation": "@article{vaswani2017attention,...}"
  }
}
```

---

## 3. Grounded RAG Dialogue

### `POST /api/paper/chat`
Ask any technical question with grounded citations.
- **Body**:
```json
{
  "paperId": "paper_transformer",
  "question": "What is the computational complexity of self-attention per layer?"
}
```
- **Response**:
```json
{
  "answer": "The computational complexity of self-attention per layer is O(n^2 * d)... [Section: Limitations, p. 7]",
  "citations": [
    {
      "evidenceId": 1,
      "section": "Limitations",
      "heading": "6 Limitations & Complexity",
      "page": 7,
      "snippet": "While self-attention connects all positions...",
      "relevanceScore": 0.94
    }
  ],
  "paperId": "paper_transformer"
}
```

---

## 4. Export

### `GET /api/paper/:id/export?format=markdown|bibtex`
Downloads the formatted report or citation file.
