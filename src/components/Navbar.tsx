import React from 'react';
import { BookOpen, Plus, User as UserIcon } from 'lucide-react';
import { User } from '../firebase';

interface NavbarProps {
  activeTab: 'summary' | 'chat' | 'architecture';
  setActiveTab: (tab: 'summary' | 'chat' | 'architecture') => void;
  onOpenIngest: () => void;
  onOpenHistory: () => void;
  savedCount?: number;
  currentUser: User | null;
  onOpenAuth: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenIngest,
  onOpenHistory,
  currentUser,
  onOpenAuth,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-4 sm:gap-6 h-16">
        {/* Zone 1: Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-[#2596be] flex items-center justify-center text-white shadow-xs">
            <BookOpen className="w-4 h-4" />
          </div>
          <button
            onClick={() => setActiveTab('summary')}
            className="text-left group cursor-pointer focus:outline-none"
          >
            <span className="text-base font-bold tracking-tight text-slate-900 group-hover:text-[#2596be] transition-colors whitespace-nowrap shrink-0">
              ScholarPulse AI
            </span>
          </button>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 lg:gap-8 text-xs sm:text-sm font-medium text-slate-600">
          <button
            onClick={() => setActiveTab('summary')}
            className={`cursor-pointer whitespace-nowrap shrink-0 transition-colors ${
              activeTab === 'summary'
                ? 'text-[#2596be] font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Overview & Summary
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`cursor-pointer whitespace-nowrap shrink-0 transition-colors ${
              activeTab === 'chat'
                ? 'text-[#2596be] font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            RAG Deep Chat
          </button>
          <button
            onClick={() => setActiveTab('architecture')}
            className={`cursor-pointer whitespace-nowrap shrink-0 transition-colors ${
              activeTab === 'architecture'
                ? 'text-[#2596be] font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            System Architecture
          </button>
        </nav>

        {/* Zone 3: Primary Actions (Ingest Paper then Profile, uniform sizing & style) */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* 1. Ingest Paper Button */}
          <button
            onClick={onOpenIngest}
            className="h-9 px-3.5 inline-flex items-center gap-2 text-xs font-semibold text-white bg-[#2596be] hover:bg-[#1d7c9d] rounded-lg shadow-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 shrink-0 stroke-[2.5]" />
            <span>Ingest Paper</span>
          </button>

          {/* 2. Profile Button */}
          {currentUser ? (
            <button
              onClick={onOpenHistory}
              className="h-9 px-3.5 inline-flex items-center gap-2 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              title="View profile and paper library"
            >
              <div className="w-5 h-5 rounded-full bg-[#2596be] text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                {currentUser.displayName
                  ? currentUser.displayName.charAt(0).toUpperCase()
                  : currentUser.email
                  ? currentUser.email.charAt(0).toUpperCase()
                  : 'U'}
              </div>
              <span className="hidden sm:inline max-w-[110px] truncate font-medium">
                {currentUser.displayName || currentUser.email?.split('@')[0] || 'Profile'}
              </span>
            </button>
          ) : (
            <button
              onClick={onOpenAuth}
              className="h-9 px-3.5 inline-flex items-center gap-2 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              title="Sign in to your profile"
            >
              <UserIcon className="w-3.5 h-3.5 text-[#2596be]" />
              <span className="font-semibold text-slate-800">Profile</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
