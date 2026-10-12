# ScholarPulse AI — Academic Research Paper Summarizer & RAG Insight Platform

ScholarPulse AI is an enterprise-grade academic research intelligence platform designed to parse, extract, synthesize, and query scientific literature in real-time. Built with a dual-engine architecture featuring **Python + FastAPI** for scientific extraction and **React + Node.js (Express) + Google Gemini 3.8 Flash** for high-throughput map-reduce summarization and grounded RAG Q&A.

---

## 1. System Flow & Methodology

The platform implements the complete 8-stage academic research intelligence pipeline:

```
+--------------------------------------------------------------------------------------------------+
|                                    SCHOLARPULSE AI PIPELINE                                      |
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|  1. INGESTION                                                                                    |
|     [ arXiv URL/ID ] --------> [ arXiv Open Access XML API ]                                     |
|     [ DOI Identifier ] ------> [ CrossRef REST API ]             ====> [ Binary PDF Buffer ]     |
|     [ PDF File Upload ] -----> [ Multer 35MB Stream ]                                            |
|                                                                                                  |
|  2. EXTRACTION (Structure-Aware)                                                                 |
|     [ PyMuPDF (fitz) / GROBID TEI-XML ]                                                          |
|     - Isolates Title, Abstract, 1. Intro, 2. Related Work, 3. Methods, 4. Results, 5. Limits     |
|                                                                                                  |
|  3. CHUNKING                                                                                     |
|     - Section-Preserving Recursive Text Splitter (Chunk: 1100 chars, Overlap: 200 chars)         |
|     - Guards citation markers [Author, Year] and mathematical formulas from truncation           |
|                                                                                                  |
|  4. EMBEDDING & INDEXING                                                                         |
|     - Dense representations via Sentence-Transformers / Gemini Vector Model                      |
|     - FAISS (Facebook AI Similarity Search) dense L2 / Cosine similarity index                   |
|                                                                                                  |
|  5. MAP-REDUCE SUMMARIZATION                                                                     |
|     - Map Phase: Section-level factual proposition compression                                  |
|     - Reduce Phase: Google Gemini 3.8 Flash JSON schema-constrained synthesis                     |
|       (Executive Summary, Contributions, Methodology, Empirical Benchmarks, Limitations)        |
|                                                                                                  |
|  6. GROUNDED RAG Q&A                                                                             |
|     - Hybrid Retrieval: Vector similarity + Section heading weighting                            |
|     - Contextual verification with verified citations [Section X, p. Y, Similarity Score]        |
|                                                                                                  |
|  7. PRESENTATION                                                                                 |
|     - Side-by-Side dual pane: Original manuscript layout alongside structured synthesis          |
|                                                                                                  |
|  8. EXPORT                                                                                       |
|     - Downloadable Markdown (.md), verified BibTeX (.bib), APA citations, and print formats      |
|                                                                                                  |
+--------------------------------------------------------------------------------------------------+
```

---

## 2. Technology Stack

| Layer | Choice | Functional Responsibility |
| :--- | :--- | :--- |
| **Frontend** | React 19 + Tailwind CSS + Lucide Icons | Fast, responsive academic workstation, side-by-side reader |
| **Backend** | Python + FastAPI & Node.js Express | High-speed document processing, PDF parsing, RESTful API |
| **Extraction** | GROBID (TEI-XML) / PyMuPDF (`fitz`) | Structure-aware layout and section boundary extraction |
| **Orchestration** | LangChain / LlamaIndex Text Splitters | Context-aware overlapping chunking |
| **Embeddings** | `sentence-transformers` (`bge-small` / `all-MiniLM`) | Dense vector representations for academic semantics |
| **Vector Store** | FAISS / Dense Vector Index | Sub-millisecond top-k nearest neighbor retrieval |
| **LLM Engine** | Google Gemini 3.8 Flash (`@google/genai`) | 2-stage Map-Reduce synthesis & grounded RAG dialogue |
| **Persistence** | SQLAlchemy / Workspace Session Store | Multi-paper reading history and researcher workspaces |
| **Deployment** | Docker / Cloud Run / Vite Full-Stack | Containerized production deployment |

---

## 3. Quickstart & Setup Guide

### Running the Live Full-Stack App (Vite + Express + Gemini)

The application includes an Express backend that bridges directly with Google Gemini 3.8 Flash and provides live endpoints on port 3000:

```bash
# 1. Install dependencies
npm install

# 2. Set your Gemini API key in your environment
export GEMINI_API_KEY="your-gemini-api-key"

# 3. Start the fullstack development server
npm run dev
```

Visit `http://localhost:3000` to interact with the platform.

---

### Running the Python FastAPI Backend (Standalone)

A full Python implementation is located in `/python_backend/`:

```bash
# 1. Enter the Python backend folder
cd python_backend

# 2. Create virtual environment
python3 -m venv venv
source venv/bin/activate    # On Windows: venv\Scripts\activate

# 3. Install requirements
pip install -r requirements.txt

# 4. Start the FastAPI server
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

The Python OpenAPI Swagger docs will be accessible at `http://localhost:8000/docs`.

#### Running via Docker

```bash
cd python_backend
docker build -t scholarpulse-backend .
docker run -p 8000:8000 scholarpulse-backend
```

---

## 4. Key Endpoints

- `GET /api/papers`: Returns all analyzed papers in the active workspace.
- `GET /api/papers/:id`: Retrieves full structured sections, chunks, and synthesis for a given paper.
- `POST /api/paper/upload`: Uploads a PDF file (up to 35MB) with structure-aware section extraction.
- `POST /api/paper/arxiv`: Ingests a paper directly from an arXiv link or identifier (e.g. `1706.03762`).
- `POST /api/paper/doi`: Ingests and resolves academic publication metadata via CrossRef API.
- `POST /api/paper/summarize`: Executes Map-Reduce summarization using Google Gemini 3.8 Flash with structured JSON output.
- `POST /api/paper/chat`: Grounded RAG query answering with citations and relevance scores.
- `GET /api/paper/:id/export?format=markdown|bibtex`: Exports the synthesis in Markdown or BibTeX format.

---

## 5. Landmark Benchmark Papers Included

For immediate testing, ScholarPulse AI comes pre-seeded with:
1. **"Attention Is All You Need"** (Vaswani et al., NeurIPS 2017) — arXiv:1706.03762
2. **"LoRA: Low-Rank Adaptation of Large Language Models"** (Hu et al., ICLR 2022) — arXiv:2106.09685
3. Additional 1-click presets for **FlashAttention** and **DeepSeek-R1**.
