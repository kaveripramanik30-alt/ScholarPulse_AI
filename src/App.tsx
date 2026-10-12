import React, { useState, useEffect } from 'react';
import { PaperListItem, PaperDetail } from './types';
import { Navbar } from './components/Navbar';
import { PaperOverview } from './components/PaperOverview';
import { StructuredSummary } from './components/StructuredSummary';
import { RagChat } from './components/RagChat';
import { ArchitectureView } from './components/ArchitectureView';
import { IngestModal } from './components/IngestModal';
import { ExportModal } from './components/ExportModal';
import { WorkspaceDrawer } from './components/WorkspaceDrawer';
import { AuthModal } from './components/AuthModal';
import { Loader2, AlertCircle, BookOpen, Sparkles, Plus } from 'lucide-react';
import { auth, onAuthStateChanged, User } from './firebase';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [papers, setPapers] = useState<PaperListItem[]>([]);
  const [currentPaperId, setCurrentPaperId] = useState<string>('paper_transformer');
  const [currentPaper, setCurrentPaper] = useState<PaperDetail | null>(null);
  const [activeTab, setActiveTab] = useState<'summary' | 'chat' | 'architecture'>('summary');

  // Modals & Drawers
  const [isIngestOpen, setIsIngestOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  // States
  const [isLoadingPaper, setIsLoadingPaper] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Fetch papers list on load or when auth user changes
  const loadPapers = async () => {
    try {
      const params = new URLSearchParams();
      if (currentUser?.uid) params.append('userId', currentUser.uid);
      if (currentUser?.email) params.append('userEmail', currentUser.email);
      const queryStr = params.toString();
      const url = queryStr ? `/api/papers?${queryStr}` : '/api/papers';

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const paperList: PaperListItem[] = data.papers || [];
        setPapers(paperList);

        // Ensure active paper belongs to current account's workspace
        setCurrentPaperId((prevId) => {
          const isAccessible = paperList.some((p) => p.id === prevId);
          if (!isAccessible) {
            return paperList[0]?.id || 'paper_transformer';
          }
          return prevId;
        });
      }
    } catch (err) {
      console.warn('Failed to fetch papers list:', err);
    }
  };

  // Fetch paper details when currentPaperId changes
  const loadPaperDetail = async (id: string) => {
    setIsLoadingPaper(true);
    setErrorMessage(null);
    try {
      const params = new URLSearchParams();
      if (currentUser?.uid) params.append('userId', currentUser.uid);
      if (currentUser?.email) params.append('userEmail', currentUser.email);
      const queryStr = params.toString();
      const url = queryStr ? `/api/papers/${id}?${queryStr}` : `/api/papers/${id}`;

      const res = await fetch(url);
      if (!res.ok) {
        if (res.status === 403 || res.status === 404) {
          if (id !== 'paper_transformer') {
            setCurrentPaperId('paper_transformer');
            return;
          }
        }
        throw new Error(`Could not load paper ${id}`);
      }
      const data: PaperDetail = await res.json();
      setCurrentPaper(data);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error loading paper details');
    } finally {
      setIsLoadingPaper(false);
    }
  };

  useEffect(() => {
    setCurrentPaper(null);
    loadPapers();
  }, [currentUser]);

  useEffect(() => {
    if (currentPaperId) {
      loadPaperDetail(currentPaperId);
    }
  }, [currentPaperId]);

  // Summarize handler
  const handleRunSummarize = async () => {
    if (!currentPaper || isSummarizing) return;
    setIsSummarizing(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/paper/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paperId: currentPaper.id,
          userId: currentUser?.uid,
          userEmail: currentUser?.email,
          force: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to synthesize summary');
      }

      setCurrentPaper((prev) => (prev ? {
        ...prev,
        title: data.summary?.title || prev.title,
        authors: (data.summary?.authors && data.summary.authors.length > 0 && data.summary.authors[0] !== 'Contributing Academic Researchers')
          ? data.summary.authors
          : prev.authors,
        summary: data.summary,
      } : null));
      loadPapers(); // refresh summary status in list
    } catch (err: any) {
      setErrorMessage(err.message || 'Summarization failed');
    } finally {
      setIsSummarizing(false);
    }
  };

  const handlePaperIngested = (newPaperId: string) => {
    loadPapers();
    setCurrentPaperId(newPaperId);
    setActiveTab('summary');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Top Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenIngest={() => setIsIngestOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        savedCount={papers.length}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-4">
        {/* Error notification banner */}
        {errorMessage && (
          <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between text-xs text-rose-800">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-rose-600 hover:text-rose-800 font-medium ml-4 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Paper Detail Header */}
        {currentPaper ? (
          <>
            <PaperOverview
              paper={currentPaper}
              onSummarize={handleRunSummarize}
              isSummarizing={isSummarizing}
              onOpenExport={() => setIsExportOpen(true)}
            />

            {/* View Switcher Container */}
            {isLoadingPaper ? (
              <div className="py-24 text-center">
                <Loader2 className="w-8 h-8 text-[#2596be] animate-spin mx-auto mb-3" />
                <p className="text-xs text-slate-500 font-mono">
                  Loading manuscript layout, vector chunks, and verified formulas...
                </p>
              </div>
            ) : (
              <>
                {activeTab === 'summary' && (
                  <StructuredSummary
                    paper={currentPaper}
                    onRunSummarize={handleRunSummarize}
                    isSummarizing={isSummarizing}
                    onOpenChatWithQuery={() => {
                      setActiveTab('chat');
                    }}
                  />
                )}

                {activeTab === 'chat' && (
                  <div className="my-6 bg-white rounded-xl border border-slate-200 shadow-xs h-[780px]">
                    <RagChat
                      paperId={currentPaper.id}
                      paperTitle={currentPaper.title}
                      currentUser={currentUser}
                    />
                  </div>
                )}

                {activeTab === 'architecture' && <ArchitectureView />}
              </>
            )}
          </>
        ) : (
          <div className="py-24 text-center">
            <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-700">No Paper Selected</h3>
            <p className="text-xs text-slate-400 mt-1 mb-4">
              Select a paper from your workspace or ingest an arXiv paper.
            </p>
            <button
              onClick={() => setIsIngestOpen(true)}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#2596be] hover:bg-[#1d7c9d] rounded-lg cursor-pointer transition-colors"
            >
              Ingest Paper
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-5 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] font-mono">
          <p>
            ScholarPulse AI · Structure-Aware Academic Extraction & Grounded RAG Platform
          </p>
          <p className="text-slate-400">
            Powered by Google Gemini 3.8 Flash & Vector Indexing
          </p>
        </div>
      </footer>

      {/* Modals & Drawers */}
      <IngestModal
        isOpen={isIngestOpen}
        onClose={() => setIsIngestOpen(false)}
        onPaperIngested={handlePaperIngested}
        currentUser={currentUser}
      />

      {currentPaper && (
        <ExportModal
          isOpen={isExportOpen}
          onClose={() => setIsExportOpen(false)}
          paper={currentPaper}
        />
      )}

      <WorkspaceDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        papers={papers}
        currentPaperId={currentPaperId}
        onSelectPaper={(id) => setCurrentPaperId(id)}
        currentUser={currentUser}
        onOpenAuth={() => {
          setIsHistoryOpen(false);
          setIsAuthOpen(true);
        }}
        onOpenIngest={() => setIsIngestOpen(true)}
      />

      <AuthModal
        key={isAuthOpen ? 'auth-modal-opened' : 'auth-modal-closed'}
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={() => loadPapers()}
      />
    </div>
  );
}
