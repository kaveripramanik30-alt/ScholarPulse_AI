# ScholarPulse AI — Deep Technical Architecture

## 1. Document Extraction Mechanics: GROBID vs PyMuPDF

Academic papers differ fundamentally from standard web text. They feature multi-column layouts, floating figure captions, footnote interruptions, and inline citations. Naive PDF extraction concatenates columns horizontally, jumbling sentences.

### Comparison Table

| Metric | PyMuPDF (`fitz`) Heuristic | GROBID (TEI-XML) | Naive PDF Parser / OCR |
| :--- | :--- | :--- | :--- |
| **Speed** | 20–50 ms per page | 1500–4000 ms per document | 500–2000 ms per page |
| **Dependency** | Self-contained C-library binary | Heavy Java server / Docker container | Tesseract / external OCR API |
| **Section Boundary Accuracy** | ~92% on standard conference templates | ~96% with TEI schema | < 50% (loses headings) |
| **Mathematical Equation Integrity** | Preserves inline Unicode & font size | Extracts LaTeX formulas into tags | Severely fragmented |
| **Resource Footprint** | Extremely lightweight (~40MB RAM) | Heavy (~2GB RAM for CRF models) | Moderate |

### ScholarPulse Implementation Strategy

ScholarPulse employs a **hybrid fallback architecture**:
1. It executes PyMuPDF font-size hierarchy parsing locally for sub-second structure extraction.
2. It parses font sizes across pages to compute the median body font size $\mu_{\text{font}}$. Any block with font size $\ge \mu_{\text{font}} + 1.5\text{pt}$ or bold flags matching academic section regex patterns is classified as a section header.
3. If a GROBID server is configured via `GROBID_HOST`, it sends the PDF to `/api/processFulltextDocument` to extract full TEI-XML representations with bibliography cross-linking.

---

## 2. Section-Aware Overlapping Chunking

Standard chunkers split text purely by token counts (e.g., every 500 tokens). In academic papers, this frequently severs critical context, such as separating a theorem statement from its proof condition or cutting an author citation `[Devlin et al., 2018]` in half.

### ScholarPulse Chunker Algorithm

$$\text{Chunk Size} = 1100 \text{ characters} \quad (\approx 250 \text{ tokens})$$
$$\text{Chunk Overlap} = 200 \text{ characters} \quad (\approx 45 \text{ tokens})$$

1. **Section Boundary Enforcement**: Chunks NEVER cross section boundaries. A chunk created from Section 3 (Methodology) will never spill into Section 4 (Experiments).
2. **Paragraph Cohesion**: Text is split on double newline boundaries (`\n\n`) first. If an individual paragraph exceeds the chunk size, it is partitioned using a sliding window with a 200-character overlap.
3. **Chunk Metadata Envelope**: Every chunk includes:
   ```json
   {
     "id": "chk_4",
     "sectionName": "Methodology",
     "heading": "3.2 Multi-Head Attention",
     "pageNumber": 3,
     "charCount": 980,
     "tokenEstimate": 245
   }
   ```

---

## 3. Map-Reduce Summarization Architecture

To summarize a 20-page research paper without hallucination or context window overflow, ScholarPulse utilizes a **two-phase Map-Reduce pipeline**:

```
[ Full Paper Chunks / Sections ]
            │
            ├──> [ Map: Intro & Abstract ] ──────> [ Core Problem & Hypothesis ]
            ├──> [ Map: Methodology ]   ─────────> [ Architectural Invariants & Equations ]
            ├──> [ Map: Experiments & Results ] ─> [ Quantitative Benchmarks & SOTA Deltas ]
            └──> [ Map: Limitations ]  ──────────> [ Assumptions, Compute & Vulnerabilities ]
                                            │
                                            ▼
                          [ Reduce Synthesis: Gemini 3.8 Flash ]
                                            │
                                            ▼
               [ Strict Schema JSON: Executive Summary, Contributions,
                 Methodology, Benchmarks, Limitations, BibTeX ]
```

### JSON Schema Guarantee

By specifying `responseMimeType: 'application/json'` with Google Gemini 3.8 Flash, the model's logits are strictly constrained to generate valid JSON containing:
- `executiveSummary`
- `coreContributions` (array of strings)
- `methodology` (object with `architecture`, `keyTechniques`, `mathematicalFormulation`)
- `keyFindings` (object with `quantitativeResults`, `qualitativeInsights`)
- `limitations` (array of strings)
- `practicalImplications` (array of strings)
- `bibtexCitation` (valid BibTeX format)

---

## 4. Grounded RAG Retrieval & Verification

For deep interactive Q&A, ScholarPulse utilizes a hybrid retrieval engine combining dense vector representations and section importance scoring:

$$\text{Score}(c, q) = 3.0 \cdot \left(\frac{|\text{Tokens}(c) \cap \text{Tokens}(q)|}{|\text{Tokens}(q)|}\right) + 1.5 \cdot \mathbb{I}(\text{Heading}(c) \cap q) + 3.0 \cdot \mathbb{I}(\text{ExactPhrase}(c, q))$$

Top-$k$ (default $k=5$) chunks are assembled into an evidence context block passed to Gemini 3.8 Flash with a strict system instruction:
> "Every factual claim must be cited with section references such as `[Section: Methodology, p. 3]`. If the answer cannot be determined from the evidence, state clearly what the paper mentions and what remains unspecified."
