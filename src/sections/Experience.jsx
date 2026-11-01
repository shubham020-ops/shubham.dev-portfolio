import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { useGSAP, gsap } from '../animations/gsapConfig';
import { motion } from '../animations/animationHelpers';
import SectionHeading from '../components/SectionHeading';
import { usePortfolio } from '../context/PortfolioContext';

// The desktop track occupies its own grid row. Experience cards stay in normal
// flow above/below it, so their rows grow to fit any published description.
const VB_W = 1000;
const TRACK_H = 56;
const GRID_COLUMN_MIN_WIDTH = 300;

function timelinePoints(count, width = VB_W) {
  return Array.from({ length: count }, (_, i) => [
    (width * (i + 0.5)) / count,
    i % 2 ? 40 : 16,
  ]);
}

function experienceId(item, index) {
  return item.id || item.recordId || `experience-${index}`;
}

/** Catmull-Rom → cubic Bézier so the path passes smoothly through every node. */
function smoothPath(pts) {
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i += 1) {
    const p0 = pts[i - 1] || pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] || p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C ${c1[0]} ${c1[1]}, ${c2[0]} ${c2[1]}, ${p2[0]} ${p2[1]}`;
  }
  return d;
}

export default function Experience() {
  const { content } = usePortfolio();
  const { experience } = content;
  const ref = useRef(null);
  const [activeId, setActiveId] = useState(() =>
    experience.length ? experienceId(experience.at(-1), experience.length - 1) : ''
  );
  const points = useMemo(() => timelinePoints(experience.length), [experience.length]);
  const d = useMemo(() => points.length ? smoothPath(points) : '', [points]);
  const items = experience;

  useEffect(() => {
    if (!items.some((item, index) => experienceId(item, index) === activeId)) {
      setActiveId(items.length ? experienceId(items.at(-1), items.length - 1) : '');
    }
  }, [activeId, items]);

  useGSAP(
    () => {
      const root = ref.current;
      const mm = motion(({ desktop }) => {
        if (!items.length) return undefined;
        if (desktop) {
          const wrap = root.querySelector('[data-tl-desktop]');
          const path = wrap.querySelector('[data-tl-path]');
          const nodes = Array.from(wrap.querySelectorAll('.tl-node'));
          nodes.forEach((el) => {
            el.dataset.off = 'true';
          });

          gsap.set(path, { strokeDashoffset: 1 });
          gsap.to(path, {
            strokeDashoffset: 0,
            ease: 'none',
            scrollTrigger: {
              trigger: wrap,
              start: 'top 75%',
              end: 'bottom 55%',
              scrub: 0.6,
              onUpdate: (self) => {
                nodes.forEach((n, i) => {
                  const on = nodes.length === 1 || self.progress >= i / Math.max(1, nodes.length - 1) - 0.03;
                  n.dataset.off = String(!on);
                });
              },
            },
          });
          return () => nodes.forEach((el) => delete el.dataset.off);
        }

        // Mobile: vertical line scrubs down the list
        const list = root.querySelector('[data-tl-mobile]');
        gsap.fromTo(
          list.querySelector('[data-tl-line]'),
          { scaleY: 0 },
          {
            scaleY: 1,
            ease: 'none',
            scrollTrigger: { trigger: list, start: 'top 75%', end: 'bottom 60%', scrub: 0.5 },
          }
        );
        gsap.from(list.querySelectorAll('[data-tl-item]'), {
          y: 24,
          opacity: 0,
          stagger: 0.12,
          scrollTrigger: { trigger: list, start: 'top 80%', once: true },
        });
        return undefined;
      });
      return () => mm.revert();
    },
    { scope: ref, dependencies: [experience] }
  );

  const renderCard = (item, className = '', style = undefined, itemId = item.id || item.recordId) => (
    <article
      tabIndex={0}
      onMouseEnter={() => setActiveId(itemId)}
      onFocus={() => setActiveId(itemId)}
      style={style}
      className={`tl-card panel min-w-0 p-5 ${
        activeId === itemId ? '!border-lime/70 shadow-[0_0_0_1px_rgba(199,255,79,0.25)]' : ''
      } ${className}`}
    >
      {(item.type || item.date) && (
        <p className="eyebrow flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 break-words">
          {item.type && <span className="text-lime">{item.type}</span>}
          {item.date && <span>{item.date}</span>}
        </p>
      )}
      {item.role && <h3 className="mt-3 break-words font-display text-lg font-bold leading-tight">{item.role}</h3>}
      {item.org && <p className="mt-0.5 break-words text-sm text-cyan">{item.org}</p>}
      {item.text && <p className="mt-3 whitespace-pre-line break-words text-sm leading-relaxed text-muted">{item.text}</p>}
    </article>
  );

  return (
    <section id="experience" ref={ref} aria-labelledby="experience-title" className="section">
      <div className="container-x">
        <SectionHeading number="04" eyebrow="Experience & journey" title="The path so far." id="experience-title" />
        <p className="mt-6 max-w-xl text-muted">
          Education, roles and milestones.
        </p>

        {!items.length ? (
          <div className="panel mt-10 p-6 sm:p-8">
            <p className="eyebrow text-lime">Experience update in progress</p>
            <h3 className="mt-3 font-display text-xl font-bold sm:text-2xl">Your journey will appear here soon.</h3>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">Apni verified roles, education, dates aur milestones ko Admin panel se add karke publish karein.</p>
          </div>
        ) : (
          <>
            {/* Desktop: the cards participate in grid flow so each row expands to its content. */}
            <div className="mt-12 hidden overflow-x-auto lg:block">
              <div
                data-tl-desktop
                className="grid min-w-full gap-x-0 gap-y-6"
                style={{
                  minWidth: `${items.length * GRID_COLUMN_MIN_WIDTH}px`,
                  gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))`,
                  gridTemplateRows: `auto ${TRACK_H}px auto`,
                }}
              >
                <svg
                  viewBox={`0 0 ${VB_W} ${TRACK_H}`}
                  preserveAspectRatio="none"
                  className="pointer-events-none col-span-full row-start-2 h-full w-full"
                  aria-hidden="true"
                >
                  <defs>
                    <linearGradient id="tl-grad" x1="0" x2="1">
                      <stop offset="0" stopColor="#C7FF4F" />
                      <stop offset="1" stopColor="#52E5FF" />
                    </linearGradient>
                  </defs>
                  <path d={d} fill="none" stroke="rgba(245,247,250,0.12)" strokeWidth="2" strokeDasharray="4 8" />
                  <path
                    data-tl-path
                    d={d}
                    pathLength="1"
                    fill="none"
                    stroke="url(#tl-grad)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray="1"
                    strokeDashoffset="0"
                  />
                  <line x1="0" y1={TRACK_H - 2} x2={VB_W} y2={TRACK_H - 2} stroke="rgba(245,247,250,0.12)" />
                </svg>

                {items.map((item, i) => {
                  const [, y] = points[i];
                  const above = i % 2 === 1;
                  const itemId = experienceId(item, i);
                  return (
                    <Fragment key={itemId}>
                      <button
                        type="button"
                        aria-label={`${item.type || 'Experience'}: ${item.role || item.org || 'timeline entry'}`}
                        onClick={() => setActiveId(itemId)}
                        className="tl-node z-10 grid h-6 w-6 place-items-center rounded-full border-2 border-lime bg-ink"
                        style={{ gridColumn: i + 1, gridRow: 2, justifySelf: 'center', alignSelf: 'start', marginTop: `${y - 12}px` }}
                      >
                        <span className={`h-2.5 w-2.5 rounded-full ${activeId === itemId ? 'bg-lime motion-safe:animate-pulse' : 'bg-lime/40'}`} />
                      </button>
                      {renderCard(item, 'w-full max-w-[260px]', {
                        gridColumn: i + 1,
                        gridRow: above ? 1 : 3,
                        justifySelf: 'center',
                        alignSelf: above ? 'end' : 'start',
                      }, itemId)}
                    </Fragment>
                  );
                })}
              </div>
            </div>

            {/* Mobile / tablet: vertical timeline */}
            <div data-tl-mobile className="relative mt-12 lg:hidden">
              <span aria-hidden="true" className="absolute bottom-0 left-[11px] top-0 w-px bg-line" />
              <span data-tl-line aria-hidden="true" className="absolute bottom-0 left-[11px] top-0 w-px origin-top bg-gradient-to-b from-lime to-cyan" />
              <ol className="space-y-6">
                {items.map((item, index) => {
                  const itemId = experienceId(item, index);
                  return (
                    <li key={itemId} data-tl-item className="relative pl-10">
                      <span
                        aria-hidden="true"
                        className="absolute left-0 top-6 grid h-6 w-6 place-items-center rounded-full border-2 border-lime bg-ink"
                      >
                        <span className="h-2.5 w-2.5 rounded-full bg-lime" />
                      </span>
                      {renderCard(item, 'w-full', undefined, itemId)}
                    </li>
                  );
                })}
              </ol>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
