import React, { useState } from 'react';
import { X, UploadCloud, Link as LinkIcon, Database, CheckCircle2, AlertCircle, Loader2, Sparkles, FileText } from 'lucide-react';
import { User } from '../firebase';

interface IngestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaperIngested: (paperId: string) => void;
  currentUser?: User | null;
}

export const IngestModal: React.FC<IngestModalProps> = ({
  isOpen,
  onClose,
  onPaperIngested,
  currentUser,
}) => {
  const [activeMode, setActiveMode] = useState<'arxiv' | 'doi' | 'upload'>('arxiv');
  const [arxivInput, setArxivInput] = useState('');
  const [doiInput, setDoiInput] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleArxivSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!arxivInput.trim()) return;

    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/paper/arxiv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: arxivInput,
          userId: currentUser?.uid,
          userEmail: currentUser?.email,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to parse arXiv paper');
      }

      setSuccessMsg(`Successfully parsed "${data.title}"`);
      setTimeout(() => {
        onPaperIngested(data.paperId);
        onClose();
      }, 700);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error occurred while contacting arXiv');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDoiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doiInput.trim()) return;

    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/paper/doi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doi: doiInput,
          userId: currentUser?.uid,
          userEmail: currentUser?.email,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to resolve DOI');
      }

      setSuccessMsg(`Successfully resolved "${data.title}"`);
      setTimeout(() => {
        onPaperIngested(data.paperId);
        onClose();
      }, 700);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error occurred while resolving DOI via CrossRef');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      if (currentUser?.uid) {
        formData.append('userId', currentUser.uid);
      }
      if (currentUser?.email) {
        formData.append('userEmail', currentUser.email);
      }

      const res = await fetch('/api/paper/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to process uploaded PDF');
      }

      setSuccessMsg(`Extracted ${data.sectionsCount} sections and ${data.chunksCount} chunks.`);
      setTimeout(() => {
        onPaperIngested(data.paperId);
        onClose();
      }, 800);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error uploading and extracting PDF');
    } finally {
      setIsLoading(false);
    }
  };

  const quickPresets = [
    { label: 'Attention Is All You Need (1706.03762)', id: '1706.03762' },
    { label: 'LoRA: Low-Rank Adaptation (2106.09685)', id: '2106.09685' },
    { label: 'FlashAttention (2205.14135)', id: '2205.14135' },
    { label: 'DeepSeek-R1 Reasoning (2501.12948)', id: '2501.12948' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Ingest Research Paper</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Structure-aware extraction from arXiv links, DOIs, or uploaded PDF manuscripts
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex border-b border-slate-200 px-6 pt-3 gap-2 bg-slate-50/30">
          <button
            onClick={() => { setActiveMode('arxiv'); setErrorMsg(null); }}
            className={`flex items-center gap-2 pb-2.5 px-3 text-xs font-medium border-b-2 transition-colors ${
              activeMode === 'arxiv'
                ? 'border-[#2596be] text-[#2596be] font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <LinkIcon className="w-3.5 h-3.5" />
            <span>arXiv Link / ID</span>
          </button>
          <button
            onClick={() => { setActiveMode('upload'); setErrorMsg(null); }}
            className={`flex items-center gap-2 pb-2.5 px-3 text-xs font-medium border-b-2 transition-colors ${
              activeMode === 'upload'
                ? 'border-[#2596be] text-[#2596be] font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>PDF File Upload</span>
          </button>
          <button
            onClick={() => { setActiveMode('doi'); setErrorMsg(null); }}
            className={`flex items-center gap-2 pb-2.5 px-3 text-xs font-medium border-b-2 transition-colors ${
              activeMode === 'doi'
                ? 'border-[#2596be] text-[#2596be] font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>DOI Identifier</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6">
          {errorMsg && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2.5 text-xs text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2 text-xs text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Mode 1: arXiv */}
          {activeMode === 'arxiv' && (
            <form onSubmit={handleArxivSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  arXiv URL or Identifier
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={arxivInput}
                    onChange={(e) => setArxivInput(e.target.value)}
                    placeholder="e.g. 1706.03762 or https://arxiv.org/abs/2312.00752"
                    className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2596be] focus:border-[#2596be] font-mono"
                    disabled={isLoading}
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Fetches title, abstract, authors, and full PDF directly from the arXiv Open Access repository.
                </p>
              </div>

              {/* Landmark Paper Presets */}
              <div>
                <span className="text-[11px] font-medium text-slate-500 block mb-1.5">
                  Or load a seminal benchmark paper:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {quickPresets.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setArxivInput(preset.id)}
                      className="text-[11px] text-slate-700 bg-slate-100 hover:bg-[#2596be]/10 hover:text-[#2596be] hover:border-[#2596be]/30 border border-slate-200 px-2.5 py-1 rounded transition-colors text-left"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !arxivInput.trim()}
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#2596be] hover:bg-[#1d7c9d] rounded-lg disabled:opacity-50 flex items-center gap-2 shadow-sm transition-colors"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Ingesting & Chunking...</span>
                    </>
                  ) : (
                    <span>Ingest from arXiv</span>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Mode 2: PDF File Upload */}
          {activeMode === 'upload' && (
            <form onSubmit={handleFileUpload} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Upload PDF Research Paper
                </label>
                <div
                  className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                    selectedFile
                      ? 'border-[#2596be] bg-[#2596be]/5'
                      : 'border-slate-300 hover:border-slate-400 bg-slate-50/50'
                  }`}
                  onClick={() => document.getElementById('pdf-file-input')?.click()}
                >
                  <input
                    id="pdf-file-input"
                    type="file"
                    accept=".pdf,application/pdf"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setSelectedFile(e.target.files[0]);
                      }
                    }}
                    disabled={isLoading}
                  />
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                      <FileText className="w-5 h-5 text-[#2596be]" />
                    </div>
                    {selectedFile ? (
                      <div>
                        <p className="text-xs font-semibold text-slate-900">{selectedFile.name}</p>
                        <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                          {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-xs font-medium text-slate-700">
                          Click to select or drop academic PDF file
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Supports multi-column academic layouts up to 35 MB
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !selectedFile}
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#2596be] hover:bg-[#1d7c9d] rounded-lg disabled:opacity-50 flex items-center gap-2 shadow-sm transition-colors"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Extracting Layout & Chunks...</span>
                    </>
                  ) : (
                    <span>Parse and Index PDF</span>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Mode 3: DOI */}
          {activeMode === 'doi' && (
            <form onSubmit={handleDoiSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Digital Object Identifier (DOI)
                </label>
                <input
                  type="text"
                  value={doiInput}
                  onChange={(e) => setDoiInput(e.target.value)}
                  placeholder="e.g. 10.1038/s41586-020-2649-2 or 10.1145/3318464.3389700"
                  className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2596be] focus:border-[#2596be] font-mono"
                  disabled={isLoading}
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Resolves metadata, peer-reviewed authors, publication venue, and Open Access link via CrossRef API.
                </p>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !doiInput.trim()}
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#2596be] hover:bg-[#1d7c9d] rounded-lg disabled:opacity-50 flex items-center gap-2 shadow-sm transition-colors"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Resolving via CrossRef...</span>
                    </>
                  ) : (
                    <span>Resolve DOI</span>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
