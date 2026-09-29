import { useCallback, useEffect, useRef, useState } from 'react';
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
  const [progress, setProgress] = useState(0);

  // Scroll progress through the pinned track, in card slots (0 .. count - 1).
  const onScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const totalDist = el.offsetHeight - window.innerHeight;
    if (totalDist <= 0) return;
    const passed = -el.getBoundingClientRect().top;
    setProgress(Math.min(1, Math.max(0, passed / totalDist)) * (count - 1));
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [onScroll]);

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
          controlledIndex={progress}
          scrollControlled
          className="h-full w-full bg-transparent"
        />
      </div>
    </section>
  );
}
