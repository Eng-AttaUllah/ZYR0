import { MoltenRingCarousel, type MoltenRingItem } from '@/components/ui/molten-ring-carousel';
import Reveal from './Reveal';

const playgroundItems: MoltenRingItem[] = [
  {
    image: '/images/products/studio.svg',
    title: 'ZYR0 Studio',
    description: 'Make apps with words. Prompt-to-production React 19 apps in 60 seconds.',
    meta: 'AI Builder · Instant Deploy',
    badge: 'AI Builder',
    href: '/studio',
  },
  {
    image: '/images/products/school.svg',
    title: 'School OS',
    description: 'Run a campus without losing your mind. Attendance, billing, grading & AI timetables.',
    meta: 'Institution SaaS · Realtime',
    badge: 'Campus OS',
    href: '/school',
  },
  {
    image: '/images/products/research.svg',
    title: 'Research Agent',
    description: 'Let an agent read 100 papers for you with peer-verified citation proofs & LaTeX formulas.',
    meta: 'Autonomous AI · Deep Search',
    badge: 'Deep Search',
    href: '/research',
  },
  {
    image: '/images/products/work.svg',
    title: 'ZYR0 Work',
    description: 'Get hired with actual proof. Real GitHub project tasks and cryptographic offer verification.',
    meta: 'Talent & Proof · Verifiable',
    badge: 'Internships',
    href: '/internships',
  },
  {
    image: '/images/products/skills.svg',
    title: 'Skills Hub',
    description: 'Supercharge anything in 1 click. Modular agent plugins, scrapers, scaffolds & linters.',
    meta: '240+ Modules · Community',
    badge: 'Extensions',
    href: '#skills',
  },
  {
    image: '/images/products/developer.svg',
    title: 'Developer Engine',
    description: 'Hack, build & self-host. Clean CLI tooling, open REST APIs, Git sync & cloud edge export.',
    meta: 'CLI & REST · Cloud Edge',
    badge: 'Open Tools',
    href: '/studio',
  },
];

export default function PlaygroundShowcase() {
  return (
    <section id="products" className="py-20 md:py-28 relative overflow-hidden">
      <div className="max-w-[1264px] mx-auto px-6 md:px-16">
        {/* Casual, Friendly Section Header */}
        <Reveal>
          <div className="max-w-2xl mb-10 md:mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[var(--zyro-border)] bg-[var(--zyro-surface)] mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--zyro-accent)]" />
              <p
                className="font-label text-[11px] tracking-[0.2em] uppercase font-semibold"
                style={{ color: 'var(--zyro-accent)' }}
              >
                The Playground
              </p>
            </div>

            <h2
              className="text-4xl md:text-5xl font-display mb-4"
              style={{ color: 'var(--zyro-text)', letterSpacing: '-0.02em' }}
            >
              Everything you need to build, learn, and ship.
            </h2>
            <p
              className="text-lg leading-relaxed"
              style={{ color: 'var(--zyro-text-secondary)' }}
            >
              No fluff, no endless setup. Four core tools, modular skills, and open APIs — all
              playing together. Spin the liquid deck to explore, or dive straight in.
            </p>
          </div>
        </Reveal>

        {/* Sleek Framed Stage Enclosing the Liquid Carousel */}
        <Reveal delay={0.1}>
          <div
            className="relative rounded-3xl md:rounded-[32px] border overflow-hidden shadow-2xl transition-all duration-300"
            style={{
              background: 'var(--zyro-surface)',
              borderColor: 'var(--zyro-border)',
            }}
          >
            {/* Ambient subtle backdrop glow */}
            <div
              className="pointer-events-none absolute -top-40 left-1/4 w-[500px] h-[300px] rounded-full blur-[100px] opacity-15"
              style={{ background: 'var(--zyro-accent)' }}
            />
            <div
              className="pointer-events-none absolute -bottom-40 right-1/4 w-[500px] h-[300px] rounded-full blur-[100px] opacity-10"
              style={{ background: 'rgb(129, 140, 248)' }}
            />

            {/* The Molten Ring Carousel */}
            <div className="h-[520px] sm:h-[580px] md:h-[640px] w-full">
              <MoltenRingCarousel
                items={playgroundItems}
                brand="ZYR0 PLAYGROUND"
                arc={1.05}
                cardSize={0.27}
                cardRatio={1.5}
                fuse={0.09}
                threads={true}
                glass={true}
                className="bg-transparent"
              />
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
