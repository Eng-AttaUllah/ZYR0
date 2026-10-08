import { useState } from 'react';
import { History, Plus, Settings, ChevronLeft, ChevronRight, ChevronDown, Search } from 'lucide-react';

export interface SidebarHistoryItem {
  id: string;
  title: string;
  mode: 'chat' | 'research';
  time: string;
}

/**
 * ZYR0 Research mark — `/logos/research.png` is a vertical lockup (sphere over
 * the "ZYRO RESEARCH" wordmark), so it is scaled to 140% and nudged up to frame
 * just the sphere; the wordmark baked into the file would be illegible (and
 * wrongly spelled for this workspace) at sidebar sizes.
 */
function ResearchLogo({ className }: { className?: string }) {
  return (
    <span className={`relative block overflow-hidden ${className ?? 'size-7'}`} aria-hidden="true">
      <img
        src="/logos/research.png"
        alt=""
        className="absolute top-[-5.5%] left-1/2 w-[140%] max-w-none -translate-x-1/2"
        draggable={false}
      />
    </span>
  );
}

/**
 * "Recent" mark — history clock stroked with the ZYRO blue→violet gradient
 * and a soft glow, so the section header reads as a premium affordance
 * rather than a plain uppercase label.
 */
function RecentIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id="recent-icon-grad" x1="3" y1="3" x2="21" y2="21" gradientUnits="userSpaceOnUse">
          <stop stopColor="#4da5fc" />
          <stop offset="1" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
      <g
        stroke="url(#recent-icon-grad)"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
        <path d="M3 3v5h5" />
        <path d="M12 7.5v4.8l3.4 1.9" />
      </g>
    </svg>
  );
}

/**
 * Per-item marks for the Recent list — same gradient-stroke + glow language as
 * RecentIcon, in two colourways so a research report is told apart from a plain
 * chat at a glance (blue→violet for research, emerald→blue for chat).
 */
function ResearchItemIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="research-item-grad" x1="4" y1="3" x2="20" y2="21" gradientUnits="userSpaceOnUse">
          <stop stopColor="#4da5fc" />
          <stop offset="1" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
      <g
        stroke="url(#research-item-grad)"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
        <path d="M14 3v5h5" />
        <path d="M9 13.5h6" />
      </g>
    </svg>
  );
}

function ChatItemIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="chat-item-grad" x1="3" y1="3" x2="21" y2="21" gradientUnits="userSpaceOnUse">
          <stop stopColor="#34d399" />
          <stop offset="1" stopColor="#4da5fc" />
        </linearGradient>
      </defs>
      <g
        stroke="url(#chat-item-grad)"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
      </g>
    </svg>
  );
}

export function AgentSidebar({
  open,
  onToggle,
  onNewSession,
  onSelectHistory,
  activeId,
  historyItems,
  historyLoading,
}: {
  open: boolean;
  onToggle: () => void;
  onNewSession: () => void;
  onSelectHistory?: (id: string, mode: string) => void;
  activeId?: string;
  historyItems?: SidebarHistoryItem[];
  historyLoading?: boolean;
}) {
  const [search, setSearch] = useState('');
  const [recentOpen, setRecentOpen] = useState(true);

  const filtered = (historyItems ?? []).filter((item) =>
    item.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Opener while the sidebar is closed (mobile: the rail itself is hidden) */}
      {!open && (
        <button
          onClick={onToggle}
          aria-label="Open sidebar"
          title="Open sidebar"
          className="fixed top-3 left-3 z-40 size-9 lg:hidden flex items-center justify-center rounded-lg border border-white/10 bg-[#111113]/80 backdrop-blur-sm text-[#8a8a8f] hover:text-white hover:bg-white/10 transition-colors"
        >
          <ChevronRight className="size-4" />
        </button>
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 bottom-0 z-50 flex flex-col bg-[#111113] border-r border-white/5 transition-all duration-300 ease-out max-w-[85vw] ${
          open
            ? 'w-[280px] translate-x-0'
            : 'w-[280px] -translate-x-full lg:translate-x-0 lg:w-[48px]'
        }`}
      >
        {/* Top section */}
        <div
          className={`flex border-b border-white/5 ${
            open ? 'items-center justify-between p-3' : 'flex-col items-center gap-1 p-2'
          }`}
        >
          {open ? (
            <>
              <span className="flex min-w-0 items-center gap-2">
                <ResearchLogo className="size-7 shrink-0" />
                <span className="text-sm font-semibold text-white tracking-tight">ZYR0 Research</span>
              </span>
              <button
                onClick={onToggle}
                aria-label="Close sidebar"
                title="Close sidebar"
                className="size-10 flex items-center justify-center rounded-lg text-[#6a6a6f] hover:text-white hover:bg-white/5 transition-colors"
              >
                <ChevronLeft className="size-4" />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onToggle}
                aria-label="Open sidebar"
                title="Open sidebar"
                className="size-7 flex items-center justify-center rounded-lg text-[#6a6a6f] hover:text-white hover:bg-white/5 transition-colors"
              >
                <ChevronRight className="size-4" />
              </button>
              <button
                onClick={onToggle}
                aria-label="ZYR0 Research"
                title="ZYR0 Research"
                className="size-7 flex items-center justify-center rounded-lg hover:bg-white/5 transition-colors"
              >
                <ResearchLogo className="size-5" />
              </button>
            </>
          )}
        </div>

        {/* Collapsed icon-only nav */}
        {!open && (
          <div className="flex flex-col items-center gap-2 py-3">
            <button
              onClick={onNewSession}
              className="size-10 flex items-center justify-center rounded-lg text-[#6a6a6f] hover:text-white hover:bg-white/5 transition-colors"
              title="New Chat"
            >
              <Plus className="size-4" />
            </button>
            <button
              onClick={onToggle}
              className="size-10 flex items-center justify-center rounded-lg text-[#6a6a6f] hover:text-white hover:bg-white/5 transition-colors"
              title="History"
            >
              <History className="size-4" />
            </button>
          </div>
        )}

        {/* Expanded content */}
        {open && (
          <div className="flex flex-col flex-1 min-h-0">
            {/* New Chat button */}
            <div className="p-3">
              <button
                onClick={onNewSession}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-white bg-white/5 hover:bg-white/10 border border-white/5 transition-all duration-150 active:scale-[0.98]"
              >
                <Plus className="size-4" />
                New Chat
              </button>
            </div>

            {/* Search */}
            <div className="px-3 pb-2">
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-white/5 border border-white/5">
                <Search className="size-3.5 text-[#5a5a5f]" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search history..."
                  className="flex-1 bg-transparent text-sm text-white placeholder-[#5a5a5f] outline-none"
                />
              </div>
            </div>

            {/* Recent — collapsible dropdown */}
            <div className="flex-1 overflow-y-auto px-2" data-lenis-prevent="">
              <button
                type="button"
                onClick={() => setRecentOpen((v) => !v)}
                aria-expanded={recentOpen}
                aria-controls="agent-recent-list"
                className="w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-md text-[10px] font-semibold uppercase tracking-wider text-[#5a5a5f] hover:text-white hover:bg-white/5 transition-colors"
              >
                <span className="flex items-center gap-1.5">
                  <RecentIcon className="size-3.5 shrink-0 drop-shadow-[0_0_3px_rgba(77,165,252,0.45)]" />
                  Recent
                </span>
                <ChevronDown
                  className={`size-3 shrink-0 transition-transform duration-200 ${
                    recentOpen ? '' : '-rotate-90'
                  }`}
                />
              </button>

              {recentOpen && (
                <div id="agent-recent-list" className="pt-1 pb-2">
                  {historyLoading ? (
                    <div className="px-4 py-8 text-center">
                      <p className="text-xs text-[#5a5a5f]">Loading...</p>
                    </div>
                  ) : filtered.length === 0 ? (
                    <div className="px-4 py-8 text-center">
                      <p className="text-xs text-[#5a5a5f]">No history yet</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-0.5">
                      {filtered.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => onSelectHistory?.(item.id, item.mode)}
                          className={`w-full flex items-start gap-2.5 px-2.5 py-2.5 rounded-lg text-left transition-colors duration-150 ${
                            activeId === item.id
                              ? 'bg-white/10 text-white'
                              : 'text-[#a0a0a5] hover:bg-white/5 hover:text-white'
                          }`}
                        >
                          {item.mode === 'research' ? (
                            <ResearchItemIcon className="size-3.5 mt-0.5 shrink-0 drop-shadow-[0_0_3px_rgba(77,165,252,0.45)]" />
                          ) : (
                            <ChatItemIcon className="size-3.5 mt-0.5 shrink-0 drop-shadow-[0_0_3px_rgba(52,211,153,0.45)]" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm truncate">{item.title}</p>
                            <p className="text-[10px] text-[#5a5a5f] mt-0.5">{item.time}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Bottom: Settings */}
            <div className="p-3 border-t border-white/5">
              <button className="w-full flex items-center gap-2.5 px-2.5 py-2.5 rounded-lg text-sm text-[#6a6a6f] hover:text-white hover:bg-white/5 transition-colors">
                <Settings className="size-4" />
                Settings
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Spacer when sidebar is open on desktop */}
      {open && <div className="hidden lg:block shrink-0 w-[280px]" />}
    </>
  );
}
