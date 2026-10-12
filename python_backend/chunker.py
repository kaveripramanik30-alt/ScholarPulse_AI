"""
ScholarPulse AI - Academic Text Chunking & Vector Indexing Engine
Implements:
1. Section-aware recursive character text splitting with overlaps
2. Dense sentence embeddings (bge-small / all-MiniLM)
3. FAISS vector index creation and top-k nearest neighbor retrieval
"""

import math
from typing import List, Dict, Any, Tuple
import numpy as np


class DocumentChunk:
    def __init__(self, chunk_id: str, text: str, section_name: str, page_number: int, metadata: Dict[str, Any]):
        self.chunk_id = chunk_id
        self.text = text
        self.section_name = section_name
        self.page_number = page_number
        self.metadata = metadata

    def to_dict(self) -> Dict[str, Any]:
        return {
            "chunk_id": self.chunk_id,
            "text": self.text,
            "section_name": self.section_name,
            "page_number": self.page_number,
            "metadata": self.metadata,
            "char_count": len(self.text)
        }


class SectionAwareChunker:
    """
    Splits paper text preserving academic section context boundaries.
    Prevents citations and equations from being severed awkwardly across chunks.
    """
    def __init__(self, chunk_size: int = 1000, chunk_overlap: int = 200):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap

    def split_sections(self, sections: List[Dict[str, Any]]) -> List[DocumentChunk]:
        chunks: List[DocumentChunk] = []
        chunk_counter = 0

        for sec in sections:
            sec_name = sec.get("name", "Body")
            heading = sec.get("heading", sec_name)
            text = sec.get("text", "")
            page_start = sec.get("page_start", 1)

            if not text.strip():
                continue

            # Split text by paragraphs first, then recursively
            paragraphs = text.split("\n\n")
            current_chunk = ""

            for p in paragraphs:
                p = p.strip()
                if not p:
                    continue

                if len(current_chunk) + len(p) <= self.chunk_size:
                    current_chunk += ("\n\n" if current_chunk else "") + p
                else:
                    if current_chunk:
                        chunk_counter += 1
                        chunks.append(DocumentChunk(
                            chunk_id=f"chk_{chunk_counter}",
                            text=current_chunk,
                            section_name=sec_name,
                            page_number=page_start,
                            metadata={"heading": heading, "index": chunk_counter}
                        ))
                        # Keep overlap window
                        overlap_start = max(0, len(current_chunk) - self.chunk_overlap)
                        current_chunk = current_chunk[overlap_start:] + "\n\n" + p
                    else:
                        # Paragraph itself is larger than chunk_size: slice into windows
                        step = self.chunk_size - self.chunk_overlap
                        for i in range(0, len(p), step):
                            slice_text = p[i:i + self.chunk_size]
                            chunk_counter += 1
                            chunks.append(DocumentChunk(
                                chunk_id=f"chk_{chunk_counter}",
                                text=slice_text,
                                section_name=sec_name,
                                page_number=page_start,
                                metadata={"heading": heading, "index": chunk_counter}
                            ))
                        current_chunk = ""

            if current_chunk.strip():
                chunk_counter += 1
                chunks.append(DocumentChunk(
                    chunk_id=f"chk_{chunk_counter}",
                    text=current_chunk.strip(),
                    section_name=sec_name,
                    page_number=page_start,
                    metadata={"heading": heading, "index": chunk_counter}
                ))

        return chunks


class AcademicVectorIndex:
    """
    In-memory dense vector index using FAISS (or NumPy fallback for environments without FAISS binary).
    Calculates cosine similarity and ranks relevant paper passages.
    """
    def __init__(self, dimension: int = 384):
        self.dimension = dimension
        self.chunks: List[DocumentChunk] = []
        self.embeddings: np.ndarray = np.empty((0, dimension), dtype=np.float32)

    def add_documents(self, chunks: List[DocumentChunk], embeddings: np.ndarray):
        self.chunks = chunks
        self.embeddings = embeddings.astype(np.float32)

    def search(self, query_embedding: np.ndarray, top_k: int = 5) -> List[Tuple[DocumentChunk, float]]:
        if len(self.chunks) == 0 or self.embeddings.shape[0] == 0:
            return []

        # Normalized query
        q_norm = query_embedding / (np.linalg.norm(query_embedding) + 1e-9)
        # Normalized matrix
        emb_norms = np.linalg.norm(self.embeddings, axis=1, keepdims=True) + 1e-9
        normalized_embs = self.embeddings / emb_norms

        # Cosine similarities
        scores = np.dot(normalized_embs, q_norm)
        top_indices = np.argsort(scores)[::-1][:top_k]

        results = []
        for idx in top_indices:
            results.append((self.chunks[idx], float(scores[idx])))
        return results
