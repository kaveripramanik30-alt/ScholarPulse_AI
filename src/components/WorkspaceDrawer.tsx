import React, { useState } from 'react';
import { PaperListItem } from '../types';
import { User, signOut } from '../firebase';
import {
  X,
  Search,
  BookOpen,
  User as UserIcon,
  LogOut,
  LogIn,
  Sparkles,
  FileText,
  Plus,
  Bookmark,
  CheckCircle2,
  Clock,
  Layers,
} from 'lucide-react';

interface WorkspaceDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  papers: PaperListItem[];
  currentPaperId: string;
  onSelectPaper: (id: string) => void;
  currentUser: User | null;
  onOpenAuth: () => void;
  onOpenIngest: () => void;
}

export const WorkspaceDrawer: React.FC<WorkspaceDrawerProps> = ({
  isOpen,
  onClose,
  papers,
  currentPaperId,
  onSelectPaper,
  currentUser,
  onOpenAuth,
  onOpenIngest,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'user' | 'curated'>('all');

  if (!isOpen) return null;

  // Filter papers based on search and tab
  const filtered = papers.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.venueOrCategory.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.authors.some((a) => a.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (filterTab === 'user') {
      return p.ingestionSource !== 'curated';
    }
    if (filterTab === 'curated') {
      return p.ingestionSource === 'curated';
    }
    return true;
  });

  const handleLogout = async () => {
    try {
      await signOut();
      onSelectPaper('paper_transformer');
      onClose();
      // As requested: "then after logging out i should see login with auth"
      onOpenAuth();
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const userIngestedCount = papers.filter((p) => p.ingestionSource !== 'curated').length;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white border-l border-slate-200 shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-5 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#2596be]" />
              <h3 className="text-sm font-bold text-slate-900 uppercase font-mono tracking-wider">
                My Research Workspace
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Account Profile Section (Displays solely the user's personal account) */}
          <div className="p-4 border-b border-slate-200 bg-slate-50/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#2596be] text-white font-bold flex items-center justify-center text-sm shadow-2xs">
                  {currentUser?.photoURL ? (
                    <img
                      src={currentUser.photoURL}
                      alt="Avatar"
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : currentUser?.displayName ? (
                    currentUser.displayName.charAt(0).toUpperCase()
                  ) : currentUser?.email ? (
                    currentUser.email.charAt(0).toUpperCase()
                  ) : (
                    <UserIcon className="w-5 h-5" />
                  )}
                </div>

                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-slate-900 truncate">
                    {currentUser?.displayName ||
                      (currentUser?.isAnonymous
                        ? 'Guest Researcher'
                        : currentUser?.email
                        ? currentUser.email.split('@')[0]
                        : 'Not Signed In')}
                  </h4>
                  <p className="text-[11px] text-slate-500 font-mono truncate">
                    {currentUser?.email ||
                      (currentUser?.isAnonymous
                        ? 'Anonymous Session'
                        : 'Sign in with Firebase Auth')}
                  </p>
                  {currentUser?.uid && (
                    <span className="inline-block text-[9px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded mt-0.5">
                      Account Verified
                    </span>
                  )}
                </div>
              </div>

              {currentUser ? (
                <button
                  onClick={handleLogout}
                  className="px-2.5 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                  title="Sign out and open login screen"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Logout</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    onClose();
                    onOpenAuth();
                  }}
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-[#2596be] hover:bg-[#1d7c9d] rounded-lg flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer shrink-0"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </button>
              )}
            </div>
          </div>

          {/* Action Row & Ingest */}
          <div className="p-3 border-b border-slate-100 flex items-center justify-between gap-2 bg-white">
            <button
              onClick={() => {
                onOpenIngest();
                onClose();
              }}
              className="flex-1 py-2 px-3 bg-[#2596be] hover:bg-[#1d7c9d] text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Ingest New Paper (arXiv / PDF / DOI)</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="p-3 border-b border-slate-100 bg-slate-50/30">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search workspace papers by title or author..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2596be] focus:border-[#2596be]"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 mt-2.5">
              <button
                onClick={() => setFilterTab('all')}
                className={`px-2.5 py-1 text-[11px] font-mono rounded-md transition-colors cursor-pointer ${
                  filterTab === 'all'
                    ? 'bg-[#2596be] text-white font-semibold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All ({papers.length})
              </button>
              <button
                onClick={() => setFilterTab('user')}
                className={`px-2.5 py-1 text-[11px] font-mono rounded-md transition-colors cursor-pointer ${
                  filterTab === 'user'
                    ? 'bg-emerald-600 text-white font-semibold'
                    : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                }`}
              >
                My Ingested ({userIngestedCount})
              </button>
              <button
                onClick={() => setFilterTab('curated')}
                className={`px-2.5 py-1 text-[11px] font-mono rounded-md transition-colors cursor-pointer ${
                  filterTab === 'curated'
                    ? 'bg-[#2596be] text-white font-semibold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Landmarks ({papers.length - userIngestedCount})
              </button>
            </div>
          </div>

          {/* Papers List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 uppercase font-bold px-1 mb-1">
              <span>Saved Manuscripts</span>
              <span>{filtered.length} Papers</span>
            </div>

            {filtered.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs space-y-3">
                <FileText className="w-8 h-8 text-slate-300 mx-auto" />
                <p>
                  {searchQuery
                    ? `No papers found matching "${searchQuery}".`
                    : filterTab === 'user'
                    ? 'No uploaded or arXiv papers ingested yet.'
                    : 'No papers in your workspace yet.'}
                </p>
                <button
                  onClick={() => {
                    onOpenIngest();
                    onClose();
                  }}
                  className="px-3 py-1.5 bg-[#2596be]/10 text-[#2596be] border border-[#2596be]/30 rounded-lg text-xs font-semibold cursor-pointer hover:bg-[#2596be]/20"
                >
                  Ingest Paper Now
                </button>
              </div>
            ) : (
              filtered.map((paper) => {
                const isActive = paper.id === currentPaperId;
                const isUserIngested = paper.ingestionSource !== 'curated';

                return (
                  <div
                    key={paper.id}
                    onClick={() => {
                      onSelectPaper(paper.id);
                      onClose();
                    }}
                    className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                      isActive
                        ? 'bg-[#2596be]/10 border-[#2596be] shadow-xs ring-1 ring-[#2596be]/30'
                        : isUserIngested
                        ? 'bg-emerald-50/30 border-emerald-200 hover:border-emerald-300 hover:bg-emerald-50/60'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {isUserIngested ? (
                          <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-1.5 py-0.2 rounded shrink-0 flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-emerald-600" />
                            <span>My Ingested Paper</span>
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono text-slate-500 font-semibold truncate uppercase">
                            {paper.venueOrCategory}
                          </span>
                        )}
                        {paper.arxivId && (
                          <span className="text-[10px] font-mono text-[#2596be] bg-[#2596be]/10 border border-[#2596be]/20 px-1.5 py-0.2 rounded shrink-0">
                            arXiv:{paper.arxivId}
                          </span>
                        )}
                      </div>

                      {paper.hasSummary && (
                        <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded shrink-0">
                          Synthesized
                        </span>
                      )}
                    </div>

                    <h4 className="text-xs font-semibold text-slate-900 leading-snug line-clamp-2">
                      {paper.title.replace(/^["']|["']$/g, '')}
                    </h4>

                    <p className="text-[11px] text-slate-500 mt-1 truncate">
                      {paper.authors && paper.authors.length > 0 && paper.authors[0] !== 'Extracted from Uploaded PDF'
                        ? paper.authors.join(', ')
                        : 'Contributing Academic Researchers'}
                    </p>

                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-100 text-[10px] font-mono text-slate-400">
                      <span>{paper.totalPages} Pages</span>
                      <span>·</span>
                      <span>{paper.chunkCount} Chunks</span>
                      <span>·</span>
                      <span>{paper.publicationDate}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
