import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage, CitationEvidence } from '../types';
import { FormattedText } from './FormattedText';
import { Send, MessageSquare, ChevronDown, ChevronUp, Copy, Check, Loader2, Sparkles } from 'lucide-react';
import { User } from '../firebase';
import { getPaperDetail, askPaperQuestion } from '../services/api';

interface RagChatProps {
  paperId: string;
  paperTitle: string;
  currentUser?: User | null;
}

export const RagChat: React.FC<RagChatProps> = ({ paperId, paperTitle, currentUser }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [expandedCitation, setExpandedCitation] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load chat history from backend for this paper
  useEffect(() => {
    let isMounted = true;
    const fetchChatHistory = async () => {
      try {
        const params = new URLSearchParams();
        if (currentUser?.uid) params.append('userId', currentUser.uid);
        if (currentUser?.email) params.append('userEmail', currentUser.email);
        const queryStr = params.toString() ? `?${params.toString()}` : '';
        const res = await fetch(`/api/paper/${paperId}/chats${queryStr}`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.chats && data.chats.length > 0) {
            setMessages(data.chats);
            return;
          }
        }
      } catch (err) {
        console.warn('Could not fetch chat history:', err);
      }

      // Default welcome message if no history
      if (isMounted) {
        setMessages([
          {
            id: 'init_1',
            sender: 'assistant',
            text: `Hello! I am ScholarPulse AI, connected to the vector index and full manuscript of **"${paperTitle}"**.\n\nYou can ask me any technical, conceptual, or mathematical questions about this paper — including architectural choices, intuitive explanations for why components work, mathematical formulations, Big-O complexity, ablation results, or limitations. Every explanation combines deep scientific intuition with grounded section citations.`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      }
    };

    fetchChatHistory();
    return () => {
      isMounted = false;
    };
  }, [paperId, paperTitle, currentUser?.uid, currentUser?.email]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const sampleQuestions = [
    'Explain the intuition behind why this architecture works so effectively.',
    'What are the primary mathematical formulas and variable definitions?',
    'What is the computational and memory complexity, and why?',
    'What are the critical limitations or boundary conditions of this method?',
  ];

  const handleSend = async (queryText?: string) => {
    const q = queryText || inputQuery;
    if (!q.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      userId: currentUser?.uid,
      sender: 'user',
      text: q.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsLoading(true);

    try {
      const paper = await getPaperDetail(paperId, currentUser || null);
      const { answer, citations } = await askPaperQuestion(paperId, q.trim(), paper, currentUser || null);

      const botMsg: ChatMessage = {
        id: `bot_${Date.now()}`,
        userId: currentUser?.uid,
        sender: 'assistant',
        text: answer,
        citations: citations || [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMsg]);

      // Attempt to persist bot message to backend
      fetch(`/api/paper/${paperId}/chats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userMessage: userMsg,
          botMessage: botMsg,
          userId: currentUser?.uid,
          userEmail: currentUser?.email,
        }),
      }).catch((e) => console.warn('Chat persistence warning:', e));
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `err_${Date.now()}`,
        sender: 'assistant',
        text: `Error retrieving response: ${err.message}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const copyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-[#2596be]" />
          <h3 className="text-xs font-bold text-slate-900 uppercase font-mono tracking-wider">
            Grounded RAG Dialogue Engine & Scientific Q&A
          </h3>
        </div>
        <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded font-medium">
          Hybrid Vector & Intuition Active
        </span>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[92%] rounded-xl p-4 text-xs leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-[#2596be] text-white rounded-br-xs'
                  : 'bg-slate-50 text-slate-900 border border-slate-200 rounded-bl-xs'
              }`}
            >
              {msg.sender === 'assistant' ? (
                <FormattedText text={msg.text} />
              ) : (
                <div className="whitespace-pre-wrap text-xs sm:text-sm font-medium">{msg.text}</div>
              )}

              {/* Citations & Evidence Container */}
              {msg.citations && msg.citations.length > 0 && (
                <div className="mt-4 pt-3 border-t border-slate-200/80">
                  <span className="text-[10px] font-mono uppercase font-bold text-slate-500 block mb-2">
                    Grounded Document Evidence ({msg.citations.length} Sources)
                  </span>

                  <div className="space-y-2">
                    {msg.citations.map((cite, i) => {
                      const isExpanded = expandedCitation === `${msg.id}_${i}`;
                      return (
                        <div
                          key={i}
                          className="bg-white border border-slate-200 rounded-lg p-2.5 text-slate-700"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 text-[11px] font-medium">
                              <span className="text-[#2596be] font-mono font-semibold">
                                [Source {cite.evidenceId}]
                              </span>
                              <span className="text-slate-900 font-semibold">{cite.section}</span>
                              <span className="text-slate-400">·</span>
                              <span className="text-slate-500 font-mono text-[10px]">
                                Page {cite.page}
                              </span>
                            </div>

                            <button
                              onClick={() => setExpandedCitation(isExpanded ? null : `${msg.id}_${i}`)}
                              className="text-[11px] text-slate-500 hover:text-[#2596be] flex items-center gap-1 cursor-pointer"
                            >
                              <span>{isExpanded ? 'Hide' : 'Inspect'}</span>
                              {isExpanded ? (
                                <ChevronUp className="w-3.5 h-3.5" />
                              ) : (
                                <ChevronDown className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>

                          {isExpanded && (
                            <div className="mt-2 pt-2 border-t border-slate-100 text-[11px] font-mono text-slate-600 bg-slate-50 p-2 rounded leading-relaxed">
                              "{cite.snippet}"
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Footer row with timestamp & copy button */}
              <div className="flex items-center justify-between gap-2 mt-2 pt-1 text-[10px] opacity-70">
                <span>{msg.timestamp}</span>
                {msg.sender === 'assistant' && (
                  <button
                    onClick={() => copyText(msg.id, msg.text)}
                    className="hover:opacity-100 flex items-center gap-1 cursor-pointer"
                  >
                    {copiedId === msg.id ? (
                      <Check className="w-3 h-3 text-emerald-600" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                    <span>{copiedId === msg.id ? 'Copied' : 'Copy'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-start">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-600 flex items-center gap-2.5">
              <Loader2 className="w-4 h-4 text-[#2596be] animate-spin" />
              <span>Analyzing manuscript sections & synthesizing deep insights...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested prompts strip */}
      {messages.length <= 2 && (
        <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/50 flex items-center gap-2 overflow-x-auto">
          <span className="text-[10px] font-mono uppercase font-bold text-slate-400 shrink-0">
            Suggested:
          </span>
          {sampleQuestions.map((sq, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(sq)}
              className="text-[11px] whitespace-nowrap px-2.5 py-1 bg-white border border-slate-200 hover:border-[#2596be]/40 hover:text-[#2596be] rounded-lg text-slate-600 transition-colors cursor-pointer shrink-0"
            >
              {sq}
            </button>
          ))}
        </div>
      )}

      {/* Input query bar */}
      <div className="p-3 border-t border-slate-200 bg-white">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder="Ask a technical, mathematical, or intuitive question about this paper..."
            disabled={isLoading}
            className="flex-1 px-3.5 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2596be] focus:border-[#2596be] disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!inputQuery.trim() || isLoading}
            className="px-4 py-2 bg-[#2596be] hover:bg-[#1d7c9d] text-white rounded-lg text-xs font-semibold shadow-xs disabled:opacity-40 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Ask</span>
          </button>
        </form>
      </div>
    </div>
  );
};
