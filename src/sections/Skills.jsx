import { useEffect, useRef, useState } from 'react';
import { useGSAP, gsap } from '../animations/gsapConfig';
import { batchReveal, motion } from '../animations/animationHelpers';
import Icon from '../components/Icon';
import SectionHeading from '../components/SectionHeading';
import { usePortfolio } from '../context/PortfolioContext';

export default function Skills() {
  const { content } = usePortfolio();
  const { skillGroups } = content;
  const ref = useRef(null);
  const firstRender = useRef(true);
  const [filter, setFilter] = useState('all');

  useGSAP(
    () => {
      const root = ref.current;
      const mm = motion(() => {
        batchReveal(root, '[data-skill-card]', { y: 50, stagger: 0.08 });
      });
      return () => mm.revert();
    },
    { scope: ref }
  );

  // Re-animate visible cards when the filter changes.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return undefined;
    }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const cards = ref.current.querySelectorAll('[data-skill-card]:not([hidden])');
    const tween = gsap.fromTo(
      cards,
      { y: 24, opacity: 0 },
      { y: 0, opacity: 1, stagger: 0.06, duration: 0.6, overwrite: true }
    );
    return () => tween.kill();
  }, [filter]);

  // Cursor-following spotlight
  const onMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`);
  };

  const tabs = [{ id: 'all', title: 'All' }, ...skillGroups];

  return (
    <section id="skills" ref={ref} aria-labelledby="skills-title" className="section">
      <div className="container-x">
        <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
          <SectionHeading number="02" eyebrow="Skills & technologies" title="Tools I build with." id="skills-title" />
          <p className="max-w-sm text-muted">
            A snapshot of the tools and technologies used across the work.
          </p>
        </div>

        <div className="mt-10 flex flex-wrap gap-2" role="group" aria-label="Filter skill groups">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              aria-pressed={filter === t.id}
              onClick={() => setFilter(t.id)}
              className={`rounded-full border px-4 py-2 font-mono text-xs tracking-wide transition-colors ${
                filter === t.id
                  ? 'border-lime bg-lime text-ink'
                  : 'border-line text-fg/80 hover:border-lime/60 hover:text-lime'
              }`}
            >
              {t.title}
            </button>
          ))}
        </div>

        <ul className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {skillGroups.map((g, i) => (
            <li
              key={g.id || g.recordId}
              data-skill-card
              hidden={filter !== 'all' && filter !== g.id}
              onPointerMove={onMove}
              className={`panel spotlight group p-7 transition-colors hover:border-lime/50 ${
                i % 5 === 0 ? 'xl:col-span-2' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <span className="grid h-12 w-12 place-items-center rounded-full border border-line text-lime transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110">
                  <Icon name={g.icon} />
                </span>
                <span className="font-mono text-xs text-muted">
                  {String((g.skills || []).length).padStart(2, '0')} items
                </span>
              </div>
              <h3 className="mt-6 font-display text-xl font-bold">{g.title}</h3>
              <ul className="mt-5 flex flex-wrap gap-2">
                {(g.skills || []).map((s) => (
                  <li
                    key={s}
                    className="chip transition-all duration-300 hover:-translate-y-0.5 hover:border-cyan hover:text-cyan"
                  >
                    {s}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
