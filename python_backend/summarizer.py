"""
ScholarPulse AI - Map-Reduce Summarization & RAG Engine (Python)
Implements:
1. Map Step: Section-level summarization with structured prompt contracts
2. Reduce Step: Synthesis into structured academic report
3. RAG Step: Grounded Q&A with section citation extraction
"""

import json
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class PaperSummarySchema(BaseModel):
    title: str = Field(description="Title of the research paper")
    authors: List[str] = Field(description="Authors or research laboratory")
    publication_date: str = Field(description="Publication year or date")
    executive_summary: str = Field(description="High-level 3-4 sentence takeaway")
    core_contributions: List[str] = Field(description="Key novel contributions introduced by the work")
    methodology: Dict[str, Any] = Field(description="Architecture, training setup, mathematical formulations")
    key_findings: Dict[str, Any] = Field(description="Empirical results, benchmark comparisons, and metrics")
    limitations: List[str] = Field(description="Stated assumptions, computational bounds, or vulnerabilities")
    practical_implications: List[str] = Field(description="Industry applications and real-world deployment considerations")
    bibtex_citation: str = Field(description="Formatted BibTeX citation entry")


class MapReduceSummarizer:
    """
    Executes 2-stage Map-Reduce summarization:
    - Map: Compresses each section (Intro, Methods, Results, Limitations) into core factual propositions.
    - Reduce: Merges the propositions into a strictly typed academic summary schema.
    """

    MAP_PROMPT_TEMPLATE = """
You are a senior academic peer reviewer. Analyze the following excerpt from section "{section_name}".
Extract the core factual statements, formulas, metrics, or arguments. Avoid fluff.

Excerpt:
{chunk_text}

Provide 3 to 5 concise, high-density factual bullet points:
"""

    REDUCE_PROMPT_TEMPLATE = """
You are a world-class AI research scientist. Synthesize the following section summaries into a rigorous,
highly technical research paper synthesis. Follow the structured JSON schema strictly.

Extracted Section Proposition Points:
{mapped_summaries}

Return ONLY valid JSON matching this structure:
{{
  "title": "Exact or inferred paper title",
  "authors": ["Author 1", "Author 2"],
  "publication_date": "YYYY or Month YYYY",
  "executive_summary": "Crisp 3-sentence summary of problem, solution, and primary outcome.",
  "core_contributions": [
    "Contribution 1 with specific novelty",
    "Contribution 2 with structural difference"
  ],
  "methodology": {{
    "architecture": "Detailed model or algorithmic design description",
    "key_techniques": ["Technique 1", "Technique 2"],
    "benchmarks_used": ["Benchmark A", "Dataset B"],
    "mathematical_formulation": "Key optimization objective, loss function, or theorem"
  }},
  "key_findings": {{
    "quantitative_results": ["Metric A improved by X% over baseline Y", "Ablation showed Z"],
    "qualitative_insights": ["Key behavioral observation"]
  }},
  "limitations": [
    "Limitation 1 (e.g. compute overhead, synthetic assumptions)",
    "Limitation 2"
  ],
  "practical_implications": [
    "Real-world deployment guidance or efficiency trade-off"
  ],
  "bibtex_citation": "@article{{key, title={{...}}, author={{...}}, year={{...}}}}"
}}
"""
