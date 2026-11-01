import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { gsap, Draggable, useGSAP } from '../animations/gsapConfig';
import { isFinePointer, motion } from '../animations/animationHelpers';
import useReducedMotion from '../hooks/useReducedMotion';
import AnimatedButton from '../components/AnimatedButton';
import ErrorBoundary from '../components/ErrorBoundary';
import HeroSlider from '../components/HeroSlider';
import SplitText from '../components/SplitText';
import { usePortfolio } from '../context/PortfolioContext';

// Heavy 3D code is split into its own chunk and loaded on demand.
const HeroScene = lazy(() => import('../scenes/HeroScene'));

function detectWebGL() {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(
      window.WebGLRenderingContext && (canvas.getContext('webgl2') || canvas.getContext('webgl'))
    );
  } catch {
    return false;
  }
}

export default function Hero() {
  const { content } = usePortfolio();
  const { site } = content;
  const rootRef = useRef(null);
  const sceneRef = useRef(null);
  const dragRef = useRef(null);
  const parRef = useRef(null);
  // Shared with the Three.js scene — mutated every frame, never causes re-renders.
  const pointer = useRef({ x: 0, y: 0, dragX: 0, dragY: 0, dragging: false, overHeading: false });

  const reduced = useReducedMotion();
  const [webgl] = useState(detectWebGL);
  const [lite] = useState(
    () => window.innerWidth < 768 || (navigator.hardwareConcurrency || 8) <= 4
  );
  const [inView, setInView] = useState(true);
  const [pageVisible, setPageVisible] = useState(true);
  const noPublishedProjects = content.projects.length === 0;
  const primaryCtaTargetsMissingProjects = site.primaryCtaUrl === '#projects' && noPublishedProjects;
  const primaryCtaUrl = primaryCtaTargetsMissingProjects
    ? '#contact'
    : site.primaryCtaUrl || (content.projects.length ? '#projects' : '#contact');

  // Pause rendering when the hero is off-screen or the tab is hidden.
  useEffect(() => {
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      threshold: 0,
    });
    io.observe(rootRef.current);
    const onVis = () => setPageVisible(!document.hidden);
    document.addEventListener('visibilitychange', onVis);
    return () => {
      io.disconnect();
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  useGSAP(
    () => {
      const root = rootRef.current;
      const dragEl = dragRef.current;
      const par = parRef.current;
      const p = pointer.current;

      const mm = motion(() => {
        const fine = isFinePointer();

        /* ---------- Intro timeline ---------- */
        const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
        tl.from(sceneRef.current, { opacity: 0, duration: 1.8, ease: 'power2.out' }, 0)
          .from(
            root.querySelectorAll('.hero-title .char'),
            { yPercent: 60, opacity: 0, scale: 0.8, stagger: 0.05, duration: 1.2 },
            0.15
          )
          .from('[data-hero-sub]', { opacity: 0, y: 20, duration: 0.9 }, '-=0.7')
          .from(root.querySelector('[data-hero-slider] > div'), { y: 90, opacity: 0, scale: 0.95, duration: 1.3 }, '-=0.8');

        // An empty portfolio has no project thumbnails; skip that animation
        // rather than asking GSAP to animate a missing selector.
        const thumbnails = root.querySelectorAll('[data-hero-thumb]');
        if (thumbnails.length) {
          tl.from(thumbnails, { y: 30, opacity: 0, stagger: 0.07, duration: 0.8 }, '-=0.8');
        }
        tl.from(root.querySelectorAll('[data-hero-meta]'), { opacity: 0, y: 20, stagger: 0.08, duration: 0.8 }, '-=1');

        /* ---------- Pointer parallax on the heading ---------- */
        const xTo = gsap.quickTo(par, 'x', { duration: 1.1, ease: 'power3' });
        const yTo = gsap.quickTo(par, 'y', { duration: 1.1, ease: 'power3' });
        const onMove = (e) => {
          p.x = (e.clientX / window.innerWidth - 0.5) * 2;
          p.y = (e.clientY / window.innerHeight - 0.5) * 2;
          if (fine) {
            xTo(p.x * -22);
            yTo(p.y * -14);
          }
        };
        const onLeave = () => {
          p.x = 0;
          p.y = 0;
          xTo(0);
          yTo(0);
        };
        root.addEventListener('pointermove', onMove, { passive: true });
        root.addEventListener('pointerleave', onLeave);

        const onEnter = () => {
          p.overHeading = true;
        };
        const onExit = () => {
          p.overHeading = false;
        };
        dragEl.addEventListener('pointerenter', onEnter);
        dragEl.addEventListener('pointerleave', onExit);

        /* ---------- Draggable heading ---------- */
        const getBounds = () => {
          const mx = root.clientWidth * 0.16;
          const my = Math.min(root.clientHeight * 0.07, 70);
          return { minX: -mx, maxX: mx, minY: -my, maxY: my };
        };
        const syncScene = () => {
          const b = getBounds();
          p.dragX = gsap.getProperty(dragEl, 'x') / b.maxX;
          p.dragY = gsap.getProperty(dragEl, 'y') / b.maxY;
        };

        const skewTo = gsap.quickTo(dragEl, 'skewX', { duration: 0.5, ease: 'power3' });
        const rotTo = gsap.quickTo(dragEl, 'rotation', { duration: 0.5, ease: 'power3' });
        let settleCall = null;

        const settle = () => {
          gsap.to(dragEl, {
            x: 0,
            y: 0,
            duration: 2,
            ease: 'elastic.out(1, 0.4)',
            overwrite: 'auto',
            onUpdate: () => {
              drag.update();
              syncScene();
            },
          });
        };

        const drag = Draggable.create(dragEl, {
          // Touch: horizontal only so vertical page scrolling keeps working.
          type: fine ? 'x,y' : 'x',
          inertia: true,
          bounds: getBounds(),
          edgeResistance: 0.8,
          minimumMovement: 4,
          dragClickables: false,
          onPress() {
            settleCall?.kill();
            gsap.killTweensOf(dragEl, 'x,y');
            p.dragging = true;
            dragEl.classList.add('is-dragging');
            gsap.to(dragEl, { scale: 1.03, duration: 0.4, overwrite: 'auto' });
          },
          onDrag() {
            skewTo(gsap.utils.clamp(-14, 14, this.deltaX * -0.8));
            rotTo(gsap.utils.clamp(-2, 2, this.deltaX * 0.08));
            syncScene();
          },
          onThrowUpdate: syncScene,
          onRelease() {
            p.dragging = false;
            dragEl.classList.remove('is-dragging');
            skewTo(0);
            rotTo(0);
            gsap.to(dragEl, { scale: 1, duration: 0.7, ease: 'elastic.out(1, 0.5)', overwrite: 'auto' });
            settleCall?.kill();
            settleCall = gsap.delayedCall(1.1, settle);
          },
        })[0];

        dragEl.classList.add('is-draggable');

        const onResize = () => drag.applyBounds(getBounds());
        window.addEventListener('resize', onResize);

        return () => {
          root.removeEventListener('pointermove', onMove);
          root.removeEventListener('pointerleave', onLeave);
          dragEl.removeEventListener('pointerenter', onEnter);
          dragEl.removeEventListener('pointerleave', onExit);
          window.removeEventListener('resize', onResize);
          settleCall?.kill();
          drag.kill();
          dragEl.classList.remove('is-draggable', 'is-dragging');
          p.dragX = 0;
          p.dragY = 0;
          p.dragging = false;
          gsap.set(dragEl, { clearProps: 'all' });
        };
      });

      return () => mm.revert();
    },
    { scope: rootRef }
  );

  return (
    <section
      id="top"
      ref={rootRef}
      aria-label="Introduction"
      className="relative min-h-[100svh] overflow-x-clip pb-16 pt-[calc(var(--nav-h)+1.25rem)] sm:pt-[calc(var(--nav-h)+2rem)] flex flex-col justify-between"
    >
      {/* Layer 0 — WebGL scene (never intercepts input) */}
      <div ref={sceneRef} className="pointer-events-none absolute inset-0 z-0" aria-hidden="true">
        {webgl ? (
          <ErrorBoundary fallback={<div className="hero-fallback" />}>
            <Suspense fallback={<div className="hero-fallback" />}>
              <HeroScene
                pointer={pointer}
                active={inView && pageVisible}
                lite={lite}
                reduced={reduced}
              />
            </Suspense>
          </ErrorBoundary>
        ) : (
          <div className="hero-fallback" />
        )}
        <div className="absolute inset-0 bg-[radial-gradient(70%_60%_at_50%_45%,transparent,rgba(8,9,13,0.85))]" />
      </div>

      {/* Left rail */}
      <p
        data-hero-meta
        className="eyebrow pointer-events-none absolute left-4 top-1/2 z-20 hidden origin-left -rotate-90 items-center gap-3 xl:flex"
      >
        <span className="h-px w-10 bg-line" aria-hidden="true" />
        {site.location}
      </p>

      {/* Main hero content container */}
      <div className="container-x relative z-20 flex-1 flex flex-col justify-center">
        {/* Layer 1 — giant draggable heading, clearly visible ABOVE the slider */}
        <div className="flex w-full justify-center">
          <div ref={dragRef} className="hero-drag pointer-events-auto max-w-full" data-cursor="Drag">
            <div ref={parRef} className="flex max-w-full flex-col items-center">
              <h1 className="hero-title select-none">
                <SplitText text={site.heroTitle} />
                <span className="sr-only">, {site.role}</span>
              </h1>
              <p
                data-hero-sub
                className="mt-3 sm:mt-4 text-center font-mono text-[clamp(0.68rem,1.2vw,0.92rem)] tracking-[0.35em] sm:tracking-[0.5em] text-lime"
              >
                {site.heroWords}
              </p>
            </div>
          </div>
        </div>

        {/* Layer 2 — foreground: featured slider + supporting copy below the heading */}
        <div className="mt-7 w-full sm:mt-9 lg:mt-11">
          <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_17rem] lg:gap-10">
            <HeroSlider />

            <aside className="flex flex-col gap-5">
              <p data-hero-meta className="eyebrow text-lime">
                {site.role}
              </p>
              <p data-hero-meta className="text-base leading-relaxed text-fg/85">
                {site.tagline}
              </p>
              <ul data-hero-meta className="space-y-1.5 text-sm text-muted">
                <li>{site.location}</li>
                <li>{site.availability}</li>
              </ul>
              <div data-hero-meta className="flex flex-wrap gap-3">
                <AnimatedButton href={primaryCtaUrl}>{primaryCtaTargetsMissingProjects ? "Let's talk" : site.primaryCta}</AnimatedButton>
                <AnimatedButton href={site.secondaryCtaUrl || '#contact'} variant="ghost">
                  {site.secondaryCta}
                </AnimatedButton>
              </div>
              {content.projects.length > 0 && (
                <p data-hero-meta className="eyebrow">Explore selected projects ↓</p>
              )}
            </aside>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div
        className="pointer-events-none mt-10 hidden flex-col items-center justify-center gap-2 md:flex"
        aria-hidden="true"
      >
        <span className="eyebrow">Scroll to discover</span>
        <span className="h-8 w-px bg-gradient-to-b from-lime to-transparent motion-safe:animate-pulse" />
      </div>
    </section>
  );
}
