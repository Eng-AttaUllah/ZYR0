import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Sparkles } from 'lucide-react';
import { MoltenRingCarousel, type MoltenRingItem } from '@/components/ui/molten-ring-carousel';

const playgroundItems: (MoltenRingItem & { color: string })[] = [
  {
    image: '/images/products/studio.svg',
    title: 'ZYR0 Studio',
    description: 'Make full-stack apps with words. Prompt-to-production React 19 apps in 60s with zero boilerplate.',
    meta: 'AI Builder · Instant Edge Deploy',
    badge: 'AI Builder',
    href: '/studio',
    color: '#38bdf8',
  },
  {
    image: '/images/products/school.svg',
    title: 'School OS',
    description: 'Run your campus without losing your mind. Automated admissions, fee invoicing, and AI timetables.',
    meta: 'Institution SaaS · Live Telemetry',
    badge: 'Campus OS',
    href: '/school',
    color: '#818cf8',
  },
  {
    image: '/images/products/research.svg',
    title: 'Research Agent',
    description: 'Let an agent read 100 papers for you with verifiable mathematical proofs & LaTeX exports.',
    meta: 'Autonomous AI · 140+ Sources',
    badge: 'Deep Search',
    href: '/research',
    color: '#f43f5e',
  },
  {
    image: '/images/products/work.svg',
    title: 'ZYR0 Work',
    description: 'Get hired with actual proof. Real GitHub project tasks and cryptographically verified credentials.',
    meta: 'Proof of Work · ECDSA Verified',
    badge: 'Internships',
    href: '/internships',
    color: '#34d399',
  },
  {
    image: '/images/products/skills.svg',
    title: 'Skills Hub',
    description: 'Supercharge anything in 1 click. 240+ modular plugins, bots, scrapers, and SaaS scaffolds.',
    meta: '240+ Modules · Open Ecosystem',
    badge: 'Extensions',
    href: '#skills',
    color: '#c084fc',
  },
  {
    image: '/images/products/developer.svg',
    title: 'Developer Engine',
    description: 'Hack, build & self-host. Clean CLI tooling, open REST APIs, Git sync & cloud edge export.',
    meta: 'CLI & REST · Cloud Edge',
    badge: 'Open Tools',
    href: '/studio',
    color: '#f59e0b',
  },
];

export default function PlaygroundShowcase() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const [controlledFloatIndex, setControlledFloatIndex] = useState<number | undefined>(undefined);
  const [isEntered, setIsEntered] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const count = playgroundItems.length;

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle scroll-driven synchronization while pinned
  const onScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const windowH = window.innerHeight;
    const totalDist = el.offsetHeight - windowH;

    if (totalDist <= 0) return;

    // Trigger entry bloom as soon as the section top arrives into view
    if (rect.top <= windowH * 0.75) {
      setIsEntered(true);
    }

    // Progress within the pinned track (0 to 1)
    const scrolled = -rect.top;
    const rawProgress = scrolled / totalDist;
    const progress = Math.min(1, Math.max(0, rawProgress));

    // Map progress smoothly across the cards (0 to count - 1)
    const targetCardIndex = progress * (count - 1);
    setControlledFloatIndex(targetCardIndex);

    const roundedIdx = Math.min(count - 1, Math.max(0, Math.round(targetCardIndex)));
    setActiveIdx(roundedIdx);
  }, [count]);

  useEffect(() => {
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [onScroll]);

  // Click on a scrubber pill jumps smoothly to that card's scroll position
  const scrollToCard = (index: number) => {
    const el = containerRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const containerTop = rect.top + scrollTop;
    const windowH = window.innerHeight;
    const totalDist = el.offsetHeight - windowH;

    const clampedIndex = Math.min(count - 1, Math.max(0, index));
    const targetScrollY = containerTop + (clampedIndex / (count - 1)) * totalDist;
    window.scrollTo({
      top: targetScrollY,
      behavior: 'smooth',
    });
  };

  // Mobile horizontal swipe detection to step between cards
  const touchStartRef = useRef<{ x: number; y: number; time: number }>({ x: 0, y: 0, time: 0 });
  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        time: performance.now(),
      };
    }
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (e.changedTouches.length === 1) {
      const dx = e.changedTouches[0].clientX - touchStartRef.current.x;
      const dy = e.changedTouches[0].clientY - touchStartRef.current.y;
      const dt = performance.now() - touchStartRef.current.time;
      // If horizontal flick is clearly dominant (> 45px, more horizontal than vertical, under 500ms)
      if (Math.abs(dx) > Math.abs(dy) * 1.25 && Math.abs(dx) > 45 && dt < 500) {
        if (dx < 0 && activeIdx < count - 1) {
          scrollToCard(activeIdx + 1);
        } else if (dx > 0 && activeIdx > 0) {
          scrollToCard(activeIdx - 1);
        }
      }
    }
  };

  const activeItem = playgroundItems[activeIdx] || playgroundItems[0];

  return (
    <section
      id="products"
      ref={containerRef}
      className="relative w-full touch-pan-y"
      style={{ height: `${(count + 1) * (isMobile ? 55 : 80)}vh` }}
    >
      {/* Sticky Fullscreen Pinned Stage (100vw × 100vh true edge-to-edge immersion) */}
      <div
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        className="sticky top-0 h-screen w-screen -mx-[calc((100vw-100%)/2)] overflow-hidden bg-[#05070d] select-none touch-pan-y"
      >
        {/* Dynamic Color Accent Backlight */}
        <div
          className="pointer-events-none absolute inset-0 transition-all duration-700 opacity-20"
          style={{
            background: `radial-gradient(1100px circle at 50% 50%, ${activeItem.color}33, transparent 75%)`,
          }}
        />

        {/* Ambient Subtle Grid */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)`,
            backgroundSize: '40px 40px',
          }}
        />

        {/* 100% Viewport Centerpiece Liquid Carousel (Underneath overlays, fills entire screen) */}
        <div className="absolute inset-0 h-full w-full z-10 flex items-center justify-center touch-pan-y">
          <MoltenRingCarousel
            items={playgroundItems}
            brand={undefined}
            arc={1.4}
            cardSize={0.64}
            cardRatio={1.5}
            fuse={0.016}
            threads={true}
            glass={true}
            scrollControlled={true}
            controlledIndex={controlledFloatIndex}
            onActiveChange={setActiveIdx}
            activeInView={isEntered}
            showFlanks={false}
            className="h-full w-full bg-transparent touch-pan-y"
          />
        </div>

        {/* Floating Top HUD Bar (Doesn't eat vertical screen space) */}
        <div className="absolute top-5 sm:top-8 inset-x-0 z-30 px-4 sm:px-12 flex items-center justify-between pointer-events-none">
          {/* Left Brand Badge */}
          <div className="pointer-events-auto flex items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 sm:px-3.5 sm:py-1.5 rounded-full border border-white/10 bg-[#0b0f1a]/80 backdrop-blur-xl shadow-lg">
              <span
                className="w-2 h-2 rounded-full transition-colors duration-500 animate-pulse"
                style={{ backgroundColor: activeItem.color }}
              />
              <span className="font-mono text-[10px] sm:text-[11px] font-bold tracking-widest uppercase text-white/90">
                The Playground
              </span>
              <span className="text-white/20">|</span>
              <span className="text-xs font-semibold text-white/70 max-w-[110px] sm:max-w-none truncate">
                {activeItem.title}
              </span>
            </div>
          </div>

          {/* Right Live Card Status Counter & Scroll Hint */}
          <div className="pointer-events-auto flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 sm:px-3.5 sm:py-1.5 rounded-full border border-white/10 bg-[#0b0f1a]/70 backdrop-blur-xl text-white/70 font-mono text-xs shadow-lg">
              <span
                className="font-bold tabular-nums"
                style={{ color: activeItem.color }}
              >
                0{activeIdx + 1}
              </span>
              <span className="text-white/30">/</span>
              <span className="text-white/50">0{count}</span>
              <span className="hidden md:inline text-white/30 ml-1">· Scroll down to spin</span>
            </div>
          </div>
        </div>

        {/* Floating Bottom Scrubber & Interactive Action Bar */}
        <div className="absolute bottom-4 sm:bottom-10 inset-x-0 z-30 px-3 sm:px-8 flex justify-center pointer-events-none touch-pan-y">
          <div
            className="pointer-events-auto flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-6 px-4 py-2.5 sm:px-6 sm:py-3.5 rounded-2xl sm:rounded-full border border-white/10 shadow-2xl backdrop-blur-2xl transition-all duration-300 max-w-[960px] w-full touch-pan-y"
            style={{
              background: 'rgba(11, 15, 26, 0.85)',
            }}
          >
            {/* Top row on mobile / Left on desktop: Active Item Description + Mobile Launch Button */}
            <div className="flex items-center justify-between gap-2.5 w-full sm:w-auto min-w-0">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span
                  className="text-[10px] font-mono uppercase tracking-widest px-2.5 py-0.5 rounded-full font-bold border shrink-0"
                  style={{
                    color: activeItem.color,
                    borderColor: `${activeItem.color}50`,
                    backgroundColor: `${activeItem.color}15`,
                  }}
                >
                  {activeItem.badge}
                </span>
                <p className="text-xs text-white/80 truncate font-medium">
                  {activeItem.description}
                </p>
              </div>

              {/* Direct Launch Link (Inline on mobile right) */}
              <Link
                to={activeItem.href || '/'}
                className="sm:hidden shrink-0 inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-white shadow-md transition-all active:scale-95"
                style={{
                  backgroundColor: activeItem.color,
                }}
              >
                <span>Launch</span>
                <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>

            {/* Center: Segmented Navigation Dots / Scrubber */}
            <div className="flex items-center gap-2 shrink-0">
              {playgroundItems.map((item, i) => (
                <button
                  key={item.title}
                  onClick={() => scrollToCard(i)}
                  className="group relative py-1.5 px-1 focus:outline-none transition-transform hover:scale-110"
                  aria-label={`Jump to ${item.title}`}
                >
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      i === activeIdx
                        ? 'w-8 shadow-sm'
                        : 'w-2 bg-white/20 hover:bg-white/50'
                    }`}
                    style={{
                      backgroundColor: i === activeIdx ? activeItem.color : undefined,
                    }}
                  />
                </button>
              ))}
            </div>

            {/* Right: Direct Launch Link (Desktop only) */}
            <div className="hidden sm:flex shrink-0 justify-end">
              <Link
                to={activeItem.href || '/'}
                className="inline-flex items-center justify-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold text-white shadow-md transition-all duration-200 hover:scale-105 active:scale-95 group"
                style={{
                  backgroundColor: activeItem.color,
                }}
              >
                <span>Launch {activeItem.title.replace('ZYR0 ', '')}</span>
                <ArrowUpRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
