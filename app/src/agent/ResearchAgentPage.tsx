import { useEffect, useState, useCallback, useRef } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { AgentHero } from '@/agent/components/AgentHero';
import { ResearchReasoning } from '@/agent/components/ResearchReasoning';
import { ThreadInput } from '@/agent/components/ThreadInput';
import { AgentSidebar, type SidebarHistoryItem } from '@/agent/components/AgentSidebar';
import { useAgentChat } from '@/agent/hooks/useAgentChat';
import { useAgentModels } from '@/agent/hooks/useAgentModels';
import { useResearchPipeline } from '@/agent/hooks/useResearchPipeline';
import { renderReportMarkdown } from '@/agent/render/renderReportMarkdown';
import { generateReportPdf } from '@/agent/lib/reportPdf';
import type { ResearchDepth, ResearchReport } from '@/agent/research/types';
import type { AgentAttachment } from '@/agent/core/types';
import { useAuth } from '@/contexts/AuthContext';
import { classifyLocally } from '@/agent/classifyLocally';
import supabase from '@/lib/supabase';
import '@/styles/agent.css';

const SYSTEM_PROMPT = `You are ZYR0's Research Agent: a precise, honest research assistant.
- Answer from first principles; when uncertain, say so and explain what is known.
- Keep answers well-structured with markdown when it helps clarity.
- Never fabricate sources or facts.`;

// How close to the bottom (px) the thread must be before we resume following it.
const STICK_TO_BOTTOM_PX = 100;

function buildFollowUpPrompt(report: ResearchReport): string {
  const sources = report.ledger
    .map((entry) => `[${entry.key}] ${entry.title} — ${entry.sourceName} — ${entry.url}`)
    .join('\n');
  return `${SYSTEM_PROMPT}

You have a completed deep-research report on "${report.topic}" (below). Answer follow-up questions using this report and its citation ledger first; cite claims with the same [n] keys. If a question goes beyond the report's scope, say so and answer from first principles.

--- REPORT ---
${report.markdown}

--- CITATION LEDGER ---
${sources}`;
}

interface HistoryItem {
  id: string;
  prompt: string;
  status: string;
  mode: string;
  created_at: string;
}

// The gateway is text-only, so attached file bytes never reach the model.
// We surface the file names in the message and tell the model not to guess
// at contents it cannot see.
const ATTACHMENT_SYSTEM_NOTE = `- The user may attach files. Only the file names are shared with you — never describe, quote or assume the contents of a file you cannot actually see.`;

function composeAttachmentMessage(text: string, attachments: AgentAttachment[]): string {
  const body = text.trim() || 'Please review the attached file(s).';
  const names = attachments.map((a) => a.name).join(', ');
  return `${body}\n\n📎 Attached: ${names}`;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return 'Yesterday';
  return `${days}d ago`;
}

export default function ResearchAgentPage() {
  const { user } = useAuth();
  const { models, selected, setSelected, loading } = useAgentModels();
  const { messages, streaming, error, sessionId, send, abort, resetSession, loadSession } = useAgentChat(selected);
  const pipeline = useResearchPipeline();
  const [depth, setDepth] = useState<ResearchDepth>('standard');
  const [chatSystem, setChatSystem] = useState(SYSTEM_PROMPT);
  const [mode, setMode] = useState<'chat' | 'research'>('chat');
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth >= 1024);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [restoring, setRestoring] = useState(false);

  const runActive =
    pipeline.stage !== 'idle' || pipeline.review !== null || pipeline.report !== null;
  const isEmpty = messages.length === 0 && !runActive;

  // --- Thread auto-scroll -------------------------------------------------
  // The thread follows the reply only while the user is parked at the bottom.
  // A mouse-wheel or touch drag away from the bottom immediately pauses
  // following, so the reply can keep streaming while the user reads further
  // up; scrolling back down to the bottom resumes it.
  const threadRef = useRef<HTMLDivElement>(null);
  const stickToBottomRef = useRef(true);
  const lastScrollTopRef = useRef(0);

  const handleThreadScroll = useCallback(() => {
    const el = threadRef.current;
    if (!el) return;
    const scrolledUp = el.scrollTop < lastScrollTopRef.current - 1;
    lastScrollTopRef.current = el.scrollTop;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    if (distanceFromBottom <= STICK_TO_BOTTOM_PX) {
      stickToBottomRef.current = true;
    } else if (scrolledUp) {
      // User is reading back through the thread — leave them alone.
      stickToBottomRef.current = false;
    }
  }, []);

  // No dependency array on purpose: this must also run for every streaming
  // token, evidence update and report chunk (each one re-renders this page).
  useEffect(() => {
    const el = threadRef.current;
    if (!el || !stickToBottomRef.current) return;
    el.scrollTop = el.scrollHeight;
  });

  // Pause following the instant the user gestures to read back (wheel up, or
  // finger dragged down). Inferring intent from the async scroll event loses
  // the race against a streaming render, which would snap the view straight
  // back to the bottom before the scroll handler could flip the flag.
  useEffect(() => {
    const el = threadRef.current;
    if (!el) return;

    let lastTouchY: number | null = null;

    const onWheel = (e: WheelEvent) => {
      if (e.deltaY < 0) stickToBottomRef.current = false;
    };
    const onTouchStart = (e: TouchEvent) => {
      lastTouchY = e.touches[0]?.clientY ?? null;
    };
    const onTouchMove = (e: TouchEvent) => {
      const y = e.touches[0]?.clientY;
      if (y == null || lastTouchY == null) return;
      // Finger dragged down = content moving up = reading back through the thread.
      if (y - lastTouchY > 4) stickToBottomRef.current = false;
      lastTouchY = y;
    };
    const onTouchEnd = () => {
      lastTouchY = null;
    };

    el.addEventListener('wheel', onWheel, { passive: true });
    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: true });
    el.addEventListener('touchend', onTouchEnd, { passive: true });

    return () => {
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
    };
    // The thread mounts/unmounts when isEmpty flips between hero and thread.
  }, [isEmpty]);

  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true);
    const { data } = await supabase
      .from('agent_researches')
      .select('id, prompt, status, mode, created_at')
      .order('created_at', { ascending: false })
      .limit(20);
    setHistory((data ?? []) as HistoryItem[]);
    setHistoryLoading(false);
  }, []);

  useEffect(() => {
    void fetchHistory();
  }, [fetchHistory]);

  const handleFollowUp = (report: ResearchReport) => {
    setChatSystem(buildFollowUpPrompt(report));
    setMode('chat');
  };

  const handleResearchSend = (topic: string, runDepth: ResearchDepth = depth) => {
    setMode('research');
    stickToBottomRef.current = true;
    void pipeline.run(topic, runDepth);
  };

  const handleRegenerate = (topic: string) => {
    setMode('research');
    stickToBottomRef.current = true;
    void pipeline.run(topic);
  };

  const handleNewSession = () => {
    resetSession();
    pipeline.clear();
    setChatSystem(SYSTEM_PROMPT);
    setMode('chat');
  };

  const handleSelectHistory = async (id: string, itemMode: string) => {
    setRestoring(true);
    stickToBottomRef.current = true;
    try {
      if (itemMode === 'research') {
        setMode('research');
        await pipeline.loadReport(id);
      } else {
        setMode('chat');
        await loadSession(id);
      }
    } finally {
      setRestoring(false);
    }
  };

  const handleSend = (text: string, attachments: AgentAttachment[] = []) => {
    // A new message always starts pinned to the latest content.
    stickToBottomRef.current = true;
    if (attachments.length > 0) {
      // Attachments only make sense on the chat path: the research pipeline
      // cannot read files, so routing them there would drop them silently.
      send(composeAttachmentMessage(text, attachments), `${chatSystem}\n${ATTACHMENT_SYSTEM_NOTE}`);
      return;
    }
    if (mode === 'research') {
      // Smart routing: greetings and casual messages go to chat, not research.
      const decision = classifyLocally(text);
      if (decision.mode === 'chat') {
        send(text, chatSystem);
        setMode('chat');
        return;
      }
      handleResearchSend(text);
    } else {
      send(text, chatSystem);
    }
  };

  return (
    <div className="agent-root flex h-screen overflow-hidden relative">
      {/* Sidebar */}
      <AgentSidebar
        open={sidebarOpen}
        onToggle={() => setSidebarOpen((v) => !v)}
        onNewSession={handleNewSession}
        onSelectHistory={handleSelectHistory}
        activeId={sessionId ?? pipeline.report?.topic ?? undefined}
        historyItems={history.map((h) => ({
          id: h.id,
          title: h.prompt,
          mode: h.mode as 'chat' | 'research',
          time: timeAgo(h.created_at),
        }))}
        historyLoading={historyLoading}
      />

      {/* Error banner */}
      {error && (
        <div className="absolute top-0 left-0 right-0 z-40 mx-auto max-w-3xl mt-2">
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400 text-center">
            {error}
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 min-w-0 flex flex-col">
      <AnimatePresence mode="wait">
      {isEmpty ? (
        <m.div
          key="hero"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.2 }}
          className="flex-1"
        >
        <AgentHero
          models={models}
          selectedModel={selected}
          onSelectModel={(id) => setSelected(id === 'auto' ? null : id)}
          onSend={handleSend}
          onStop={abort}
          running={pipeline.running || streaming}
          depth={depth}
          onDepthChange={setDepth}
          onOpenHistory={() => setSidebarOpen(true)}
          onToggleSidebar={() => setSidebarOpen((v) => !v)}
        />
        </m.div>
      ) : (
        <m.div
          key="thread"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="flex min-h-0 flex-1 flex-col bg-[#0f0f0f]"
        >
          {/* Active session header */}
          <div className="shrink-0 border-b border-white/5 px-4 py-3">
            <div className="mx-auto max-w-3xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSidebarOpen((v) => !v)}
                  className="flex items-center justify-center size-10 rounded-lg text-[#6a6a6f] hover:text-white hover:bg-white/5 transition-colors"
                >
                  <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <path d="M9 3v18" />
                  </svg>
                </button>
                <button
                  onClick={handleNewSession}
                  className="flex items-center gap-1.5 px-3 py-2.5 rounded-full text-xs font-medium text-[#8a8a8f] hover:text-white hover:bg-white/5 border border-white/5 transition-all duration-200 active:scale-95"
                >
                  <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  <span className="hidden sm:inline">New</span>
                </button>
              </div>
              <div className="flex items-center gap-2">
                <div className={`size-1.5 rounded-full ${pipeline.running || streaming ? 'bg-emerald-400 animate-pulse' : 'bg-[#5a5a5f]'}`} />
                <span className="text-xs text-[#5a5a5f]">
                  {pipeline.running ? 'Researching...' : streaming ? 'Generating...' : 'Ready'}
                </span>
              </div>
            </div>
          </div>

          {/* Thread area */}
          <div
            ref={threadRef}
            onScroll={handleThreadScroll}
            data-lenis-prevent=""
            className="flex-1 min-h-0 overflow-y-auto overscroll-contain"
          >
            <div className="mx-auto max-w-3xl px-4 py-6 flex flex-col gap-4">
              {/* Restoring indicator */}
              {restoring && (
                <div className="flex justify-center py-8">
                  <div className="flex items-center gap-2 text-[#5a5a5f] text-xs">
                    <div className="size-3 border-2 border-[#5a5a5f] border-t-transparent rounded-full animate-spin" />
                    Loading session...
                  </div>
                </div>
              )}

              {/* Messages */}
              {!restoring && messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`agent-fade-up flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-[#1488fc] text-white'
                        : 'bg-[#1e1e22] text-[#e5e5e5] ring-1 ring-white/[0.08]'
                    }`}
                  >
                    {msg.streaming && !msg.content && (
                      <div className="flex gap-1.5">
                        <div className="w-2 h-2 bg-[#4da5fc] rounded-full agent-pulse-dot" />
                        <div className="w-2 h-2 bg-[#4da5fc] rounded-full agent-pulse-dot" />
                        <div className="w-2 h-2 bg-[#4da5fc] rounded-full agent-pulse-dot" />
                      </div>
                    )}
                    {msg.error ? (
                      <span className="text-red-400">{msg.error}</span>
                    ) : (
                      <span className="agent-whitespace-pre-wrap">{msg.content}</span>
                    )}
                    {msg.streaming && msg.content && (
                      <span className="inline-block w-0.5 h-4 bg-white/70 ml-0.5 animate-pulse" />
                    )}
                  </div>
                </div>
              ))}

              {/* Pipeline reasoning */}
              {runActive && (
                <div className="agent-fade-up">
                  <ResearchReasoning
                    stage={pipeline.stage}
                    message={pipeline.message}
                    detail={pipeline.detail}
                    contracts={pipeline.contracts}
                    evidence={pipeline.evidence}
                    ledger={pipeline.ledger}
                    errors={pipeline.errors}
                    running={pipeline.running}
                    className="bg-[#1e1e22] rounded-xl ring-1 ring-white/[0.08] p-3"
                  />
                </div>
              )}

              {/* Report */}
              {pipeline.report && (
                <div className="agent-fade-up bg-[#1e1e22] rounded-xl ring-1 ring-white/[0.08] p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs text-emerald-400 font-medium">Report Complete</span>
                    <span className="text-xs text-[#5a5a5f]">
                      {pipeline.ledger.filter(l => l.verified).length} verified sources
                    </span>
                  </div>
                  <div className="prose prose-invert prose-sm max-w-none text-[#c5c5c5] leading-relaxed">
                    {renderReportMarkdown(pipeline.report.markdown, {
                      citationVerified: (key) => {
                        const entry = pipeline.ledger.find(l => l.key === key);
                        return entry?.verified ?? false;
                      },
                      onCitationClick: (key) => {
                        const sourcesEl = document.getElementById('report-sources');
                        if (sourcesEl) {
                          sourcesEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                      },
                    })}
                  </div>
                  <div id="report-sources" className="mt-6 pt-3 border-t border-white/5">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-[#5a5a5f] mb-2">Sources</p>
                    <div className="space-y-1.5">
                      {pipeline.ledger.map((entry) => (
                        <div key={entry.key} className="flex items-start gap-2 text-xs">
                          <span className={`font-mono shrink-0 ${entry.verified ? 'text-emerald-400' : 'text-amber-500'}`}>
                            [{entry.key}]
                          </span>
                          <a
                            href={entry.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#a0a0a5] hover:text-white transition-colors truncate"
                          >
                            {entry.title}
                          </a>
                          <span className="text-[#5a5a5f] shrink-0">— {entry.sourceName}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-white/5">
                    <button
                      onClick={() => handleFollowUp(pipeline.report!)}
                      className="text-xs px-3 py-2 rounded-lg text-[#6a6a6f] hover:text-white hover:bg-white/5 transition-colors"
                    >
                      Follow up
                    </button>
                    <button
                      onClick={() => handleRegenerate(pipeline.report!.topic)}
                      className="text-xs px-3 py-2 rounded-lg text-[#6a6a6f] hover:text-white hover:bg-white/5 transition-colors"
                    >
                      Regenerate
                    </button>
                    <button
                      onClick={() => generateReportPdf(pipeline.report!)}
                      className="text-xs px-3 py-2 rounded-lg text-[#6a6a6f] hover:text-white hover:bg-white/5 transition-colors"
                    >
                      Download PDF
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bottom input */}
          <ThreadInput
            mode={mode}
            onModeChange={setMode}
            models={models}
            selectedModel={selected}
            onSelectModel={(id) => setSelected(id === 'auto' ? null : id)}
            depth={depth}
            onDepthChange={setDepth}
            onSend={handleSend}
            onStop={abort}
            running={pipeline.running || streaming}
          />
        </m.div>
      )}
      </AnimatePresence>
      </div>
    </div>
  );
}
