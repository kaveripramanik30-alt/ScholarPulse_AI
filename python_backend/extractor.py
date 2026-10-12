"""
ScholarPulse AI - Academic Document Extraction Engine
Handles Structure-Aware Extraction from PDF bytes or paths:
1. PyMuPDF (fitz) font-size heuristic & layout parser
2. GROBID TEI-XML integration (Header, Sections, Citations)
3. arXiv & DOI resolver utilities
"""

import re
import fitz  # PyMuPDF
from typing import List, Dict, Any, Optional
import requests
from bs4 import BeautifulSoup


class PaperMetadata:
    def __init__(self, title: str, authors: List[str], abstract: str, doi: Optional[str] = None, arxiv_id: Optional[str] = None):
        self.title = title
        self.authors = authors
        self.abstract = abstract
        self.doi = doi
        self.arxiv_id = arxiv_id


class PaperSection:
    def __init__(self, name: str, heading: str, text: str, page_start: int, page_end: int):
        self.name = name
        self.heading = heading
        self.text = text
        self.page_start = page_start
        self.page_end = page_end

    def to_dict(self) -> Dict[str, Any]:
        return {
            "name": self.name,
            "heading": self.heading,
            "text": self.text,
            "page_start": self.page_start,
            "page_end": self.page_end,
            "char_count": len(self.text)
        }


class StructureAwareExtractor:
    """
    Extracts structured academic sections (Title, Abstract, Intro, Methods, Results, Discussion, References)
    using font size hierarchy and layout geometry in PyMuPDF.
    """

    KNOWN_SECTION_PATTERNS = [
        (r'^(?:1|I)?\.?\s*Introduction\b', "Introduction"),
        (r'^(?:2|II)?\.?\s*(?:Related Work|Background|Prior Art)\b', "Related Work"),
        (r'^(?:3|III)?\.?\s*(?:Methodology|Method|Model Architecture|Proposed Method|System Architecture)\b', "Methodology"),
        (r'^(?:4|IV)?\.?\s*(?:Experiments|Experimental Setup|Evaluation|Implementation Details)\b', "Experiments"),
        (r'^(?:5|V)?\.?\s*(?:Results|Discussion|Ablation Studies|Findings)\b', "Results & Discussion"),
        (r'^(?:6|VI)?\.?\s*(?:Limitations|Ethical Considerations|Broader Impact)\b', "Limitations"),
        (r'^(?:7|VII)?\.?\s*(?:Conclusion|Summary and Conclusion)\b', "Conclusion"),
        (r'^(?:References|Bibliography)\b', "References")
    ]

    @classmethod
    def extract_from_pdf_bytes(cls, pdf_bytes: bytes) -> Dict[str, Any]:
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        total_pages = len(doc)
        
        # Analyze font sizes across the first two pages to identify title and headers
        font_stats = []
        raw_blocks_by_page = []

        for page_idx in range(total_pages):
            page = doc[page_idx]
            blocks = page.get_text("dict").get("blocks", [])
            page_text_blocks = []

            for block in blocks:
                if block.get("type") == 0:  # Text block
                    block_text = ""
                    max_size = 0.0
                    is_bold = False

                    for line in block.get("lines", []):
                        for span in line.get("spans", []):
                            txt = span.get("text", "").strip()
                            if txt:
                                block_text += " " + txt
                                sz = span.get("size", 10.0)
                                if sz > max_size:
                                    max_size = sz
                                flags = span.get("flags", 0)
                                if flags & 2 or flags & 16:  # bold flags
                                    is_bold = True

                    block_text = block_text.strip()
                    if block_text:
                        font_stats.append(max_size)
                        page_text_blocks.append({
                            "text": block_text,
                            "font_size": max_size,
                            "is_bold": is_bold,
                            "bbox": block.get("bbox"),
                            "page": page_idx + 1
                        })

            raw_blocks_by_page.append(page_text_blocks)

        median_body_font = sorted(font_stats)[len(font_stats) // 2] if font_stats else 10.0

        # Extract Title (typically highest font size in first 5 blocks of page 1)
        first_page_blocks = raw_blocks_by_page[0] if raw_blocks_by_page else []
        title = "Untitled Academic Paper"
        if first_page_blocks:
            top_blocks = sorted(first_page_blocks[:6], key=lambda b: b["font_size"], reverse=True)
            if top_blocks and top_blocks[0]["font_size"] > median_body_font + 2.0:
                title = top_blocks[0]["text"]

        # Parse sections
        sections: List[PaperSection] = []
        current_section_name = "Abstract"
        current_section_heading = "Abstract"
        current_section_text: List[str] = []
        start_page = 1

        for page_idx, blocks in enumerate(raw_blocks_by_page):
            current_page_num = page_idx + 1
            for b in blocks:
                text = b["text"]
                size = b["font_size"]
                bold = b["is_bold"]

                # Check if this block looks like a section heading
                is_heading = False
                matched_name = None

                if (size > median_body_font + 1.0 or bold) and len(text) < 100:
                    for pattern, sec_name in cls.KNOWN_SECTION_PATTERNS:
                        if re.search(pattern, text, re.IGNORECASE):
                            is_heading = True
                            matched_name = sec_name
                            break

                if is_heading and matched_name:
                    if current_section_text:
                        sections.append(PaperSection(
                            name=current_section_name,
                            heading=current_section_heading,
                            text="\n\n".join(current_section_text),
                            page_start=start_page,
                            page_end=current_page_num
                        ))
                    current_section_name = matched_name
                    current_section_heading = text
                    current_section_text = []
                    start_page = current_page_num
                else:
                    current_section_text.append(text)

        # Append last section
        if current_section_text:
            sections.append(PaperSection(
                name=current_section_name,
                heading=current_section_heading,
                text="\n\n".join(current_section_text),
                page_start=start_page,
                page_end=total_pages
            ))

        return {
            "title": title,
            "total_pages": total_pages,
            "sections": [s.to_dict() for s in sections],
            "raw_full_text": "\n\n".join([b["text"] for page in raw_blocks_by_page for b in page])
        }


class GrobidClient:
    """
    Client for extracting academic papers via GROBID service (TEI-XML output).
    If GROBID server URL is configured, provides full XML DOM structure.
    """
    def __init__(self, grobid_host: str = "http://localhost:8070"):
        self.host = grobid_host

    def process_full_text(self, pdf_bytes: bytes) -> Optional[Dict[str, Any]]:
        url = f"{self.host}/api/processFulltextDocument"
        try:
            files = {"input": ("paper.pdf", pdf_bytes, "application/pdf")}
            resp = requests.post(url, files=files, timeout=60)
            if resp.status_code == 200:
                return self.parse_tei_xml(resp.text)
        except Exception as e:
            print(f"[GROBID] Notice: GROBID service unreachable at {url} ({e}). Falling back to PyMuPDF.")
        return None

    def parse_tei_xml(self, tei_xml: str) -> Dict[str, Any]:
        soup = BeautifulSoup(tei_xml, "xml")
        title = soup.find("title")
        title_text = title.get_text() if title else "Extracted Paper"
        
        abstract = soup.find("abstract")
        abstract_text = abstract.get_text() if abstract else ""

        sections = []
        for div in soup.find_all("div"):
            head = div.find("head")
            heading = head.get_text() if head else "Section"
            p_tags = div.find_all("p")
            sec_text = "\n\n".join([p.get_text() for p in p_tags])
            if sec_text:
                sections.append({
                    "heading": heading,
                    "text": sec_text
                })

        return {
            "title": title_text,
            "abstract": abstract_text,
            "sections": sections
        }
