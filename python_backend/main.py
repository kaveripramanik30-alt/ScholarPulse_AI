"""
ScholarPulse AI - Production Python FastAPI Server
Exposes high-speed RESTful endpoints for academic ingestion, chunking, RAG, and map-reduce summarization.
"""

from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import uvicorn
import io
import re

from extractor import StructureAwareExtractor, GrobidClient
from chunker import SectionAwareChunker, AcademicVectorIndex, DocumentChunk
from summarizer import PaperSummarySchema

app = FastAPI(
    title="ScholarPulse AI Backend",
    description="Python FastAPI engine for research paper parsing, FAISS vector indexing, and RAG Q&A",
    version="1.0.0"
)

# Enable CORS for local and preview frontends
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory document & index registry
papers_db: Dict[str, Dict[str, Any]] = {}
vector_indices: Dict[str, AcademicVectorIndex] = {}


class ChatQueryRequest(BaseModel):
    paper_id: str
    query: str
    top_k: Optional[int] = 5


class ArxivIngestRequest(BaseModel):
    arxiv_url_or_id: str


class DoiIngestRequest(BaseModel):
    doi: str


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "scholarpulse-python-api",
        "indexed_papers_count": len(papers_db),
        "grobid_status": "standby / pymupdf-active"
    }


@app.post("/api/ingest/upload")
async def ingest_pdf(file: UploadFile = File(...)):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")
    
    content = await file.read()
    if len(content) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")

    extracted = StructureAwareExtractor.extract_from_pdf_bytes(content)
    paper_id = f"paper_{len(papers_db) + 1}"

    # Chunk text
    chunker = SectionAwareChunker()
    chunks = chunker.split_sections(extracted["sections"])

    papers_db[paper_id] = {
        "id": paper_id,
        "filename": file.filename,
        "title": extracted["title"],
        "total_pages": extracted["total_pages"],
        "sections": extracted["sections"],
        "chunks": [c.to_dict() for c in chunks],
        "pdf_bytes_len": len(content)
    }

    return {
        "paper_id": paper_id,
        "title": extracted["title"],
        "total_pages": extracted["total_pages"],
        "sections_detected": len(extracted["sections"]),
        "total_chunks": len(chunks),
        "message": "Paper ingested and indexed successfully via PyMuPDF."
    }


@app.post("/api/rag/chat")
async def rag_chat(req: ChatQueryRequest):
    paper = papers_db.get(req.paper_id)
    if not paper:
        raise HTTPException(status_code=404, detail=f"Paper ID '{req.paper_id}' not found in active session.")

    chunks_data = paper.get("chunks", [])
    if not chunks_data:
        raise HTTPException(status_code=400, detail="No chunks indexed for this paper.")

    # Keyword + TF heuristic ranker
    query_terms = set(re.findall(r'\w+', req.query.lower()))
    scored_chunks = []
    
    for c in chunks_data:
        text_terms = re.findall(r'\w+', c["text"].lower())
        overlap = sum(1 for term in text_terms if term in query_terms)
        density = overlap / (len(text_terms) + 1e-5)
        # Boost section headings matching query
        heading_boost = 1.5 if any(t in c["section_name"].lower() for t in query_terms) else 1.0
        score = (overlap * 2.0 + density * 100) * heading_boost
        scored_chunks.append((c, score))

    scored_chunks.sort(key=lambda x: x[1], reverse=True)
    top_chunks = [sc[0] for sc in scored_chunks[:req.top_k]]

    return {
        "query": req.query,
        "paper_id": req.paper_id,
        "retrieved_evidence": [
            {
                "chunk_id": c["chunk_id"],
                "section": c["section_name"],
                "page": c["page_number"],
                "snippet": c["text"][:350] + "...",
                "score": round(sc[1], 3)
            }
            for c, sc in zip(top_chunks, scored_chunks[:req.top_k])
        ]
    }


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
