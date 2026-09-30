import { useCallback, useRef } from 'react';
import { MoltenRingCarousel, type MoltenRingItem } from '@/components/ui/molten-ring-carousel';

const playgroundItems: MoltenRingItem[] = [
  {
    image: '/images/products/studio.svg',
    title: 'ZYR0 Studio',
    meta: 'AI Builder · Instant Edge Deploy',
  },
  {
    image: '/images/products/school.svg',
    title: 'School OS',
    meta: 'Institution SaaS · Live Telemetry',
  },
  {
    image: '/images/products/research.svg',
    title: 'Research Agent',
    meta: 'Autonomous AI · 140+ Sources',
  },
  {
    image: '/images/products/work.svg',
    title: 'ZYR0 Work',
    meta: 'Proof of Work · ECDSA Verified',
  },
  {
    image: '/images/products/skills.svg',
    title: 'Skills Hub',
    meta: '240+ Modules · Open Ecosystem',
  },
  {
    image: '/images/products/developer.svg',
    title: 'Developer Engine',
    meta: 'CLI & REST · Cloud Edge',
  },
];

const count = playgroundItems.length;

export default function PlaygroundShowcase() {
  const containerRef = useRef<HTMLElement>(null);

  // Read straight off the layout from inside the ring's own frame loop, so the
  // page stays the clock without React ever being involved. The previous shape
  // - a scroll listener calling setState - re-rendered the whole subtree on
  // every scroll event, and subtracted window.innerHeight from a viewport-unit
  // track: on mobile the URL bar changes innerHeight as you drag, so the
  // denominator moved mid-gesture and the ring jumped.
  const readProgress = useCallback(() => {
    const el = containerRef.current;
    if (!el) return 0;
    const stage = el.firstElementChild as HTMLElement | null;
    // Both heights come from viewport units, so neither is disturbed by the bar.
    const totalDist = el.offsetHeight - (stage ? stage.offsetHeight : window.innerHeight);
    if (totalDist <= 0) return 0;
    const passed = -el.getBoundingClientRect().top;
    return Math.min(1, Math.max(0, passed / totalDist)) * (count - 1);
  }, []);

  return (
    <section
      id="products"
      ref={containerRef}
      className="relative w-full"
      style={{ height: `${(count + 1) * 80}vh` }}
    >
      <div className="sticky top-0 h-screen w-full overflow-hidden bg-[#05070d]">
        <MoltenRingCarousel
          items={playgroundItems}
          brand="The Playground"
          controlledIndex={readProgress}
          scrollControlled
          className="h-full w-full bg-transparent"
        />
      </div>
    </section>
  );
}
