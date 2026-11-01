import { useEffect, useRef } from 'react';
import { useGSAP, gsap } from '../animations/gsapConfig';
import { attachTilt, isFinePointer, motion, parallaxY } from '../animations/animationHelpers';
import AnimatedButton from '../components/AnimatedButton';
import CoverArt from '../components/CoverArt';
import useReducedMotion from '../hooks/useReducedMotion';
import { usePortfolio } from '../context/PortfolioContext';

/** Wide creative-showcase banner with layered depth and a scroll-driven reveal. */
export default function FeaturedShowcase() {
  const { content } = usePortfolio();
  const { featured } = content;
  const panels = featured.panels || [];
  const link = featured.link || {};
  const ref = useRef(null);
  const tiltRef = useRef(null);
  const reduced = useReducedMotion();

  useGSAP(
    () => {
      const root = ref.current;
      const mm = motion(({ desktop }) => {
        const banner = root.querySelector('[data-banner]');

        // Scroll-scrubbed reveal: banner opens up as it enters the viewport
        gsap.fromTo(
          banner,
          { clipPath: 'inset(8% 6% 8% 6% round 8px)', scale: 0.94 },
          {
            clipPath: 'inset(0% 0% 0% 0% round 0px)',
            scale: 1,
            ease: 'none',
            scrollTrigger: { trigger: banner, start: 'top 90%', end: 'top 25%', scrub: 0.6 },
          }
        );
        parallaxY(root.querySelector('[data-banner-art]'), banner, 10);

        // Layered panels move at different speeds
        if (desktop) {
          gsap.to(root.querySelector('[data-layer="a"]'), {
            yPercent: -30,
            ease: 'none',
            scrollTrigger: { trigger: root, start: 'top bottom', end: 'bottom top', scrub: true },
          });
          gsap.to(root.querySelector('[data-layer="b"]'), {
            yPercent: 22,
            ease: 'none',
            scrollTrigger: { trigger: root, start: 'top bottom', end: 'bottom top', scrub: true },
          });
        }

        gsap.from(root.querySelectorAll('[data-in]'), {
          y: 40,
          opacity: 0,
          stagger: 0.1,
          duration: 0.9,
          scrollTrigger: { trigger: root.querySelector('[data-in]'), start: 'top 85%', once: true },
        });
      });
      return () => mm.revert();
    },
    { scope: ref }
  );

  useEffect(() => {
    if (reduced || !isFinePointer()) return undefined;
    return attachTilt(tiltRef.current, { max: 3 });
  }, [reduced]);

  return (
    <section id="showcase" ref={ref} aria-labelledby="showcase-title" className="section overflow-x-clip !py-0">
      <div className="container-x relative py-16 md:py-24">
        <div ref={tiltRef} className="relative">
          <div data-banner className="relative min-h-[26rem] w-full overflow-hidden border border-line sm:min-h-[22rem] md:min-h-[34rem]">
            <div data-banner-art className="absolute inset-[-10%]">
              <CoverArt
                image={featured.image}
                {...featured.cover}
                alt={`Artwork for the ${featured.title} showcase`}
                className="h-full w-full object-cover object-center"
              />
            </div>
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-ink/90 via-ink/40 to-transparent" />
            <div className="relative z-10 flex min-h-[26rem] flex-col justify-end gap-5 p-6 sm:min-h-[22rem] md:min-h-[34rem] md:pr-64 md:p-12 lg:max-w-[62%] lg:pr-12">
              <p data-in className="eyebrow text-lime">
                {featured.kicker}
              </p>
              <h2 id="showcase-title" data-in className="display text-[clamp(2.2rem,7vw,6.5rem)]">
                {featured.title}
              </h2>
              <p data-in className="max-w-lg text-fg/85">
                {featured.description}
              </p>
              <ul data-in className="flex flex-wrap gap-2">
                {(featured.tech || []).map((t) => (
                  <li key={t} className="chip bg-ink/50 backdrop-blur">
                    {t}
                  </li>
                ))}
              </ul>
              <div data-in>
                {link.url && link.label && <AnimatedButton href={link.url}>{link.label}</AnimatedButton>}
              </div>
            </div>
          </div>

          {/* Overlapping info panels */}
          <div
            data-layer="a"
            className="panel absolute -bottom-10 right-3 hidden w-60 p-5 shadow-[0_30px_80px_rgba(0,0,0,0.6)] backdrop-blur md:block lg:right-10"
          >
            <p className="eyebrow">{panels[0]?.label}</p>
            <p className="mt-2 font-display text-lg font-bold">{panels[0]?.value}</p>
          </div>
          <div
            data-layer="b"
            className="panel absolute right-4 top-6 hidden w-52 p-5 backdrop-blur lg:right-[22rem] lg:block"
          >
            <p className="eyebrow">{panels[1]?.label}</p>
            <p className="mt-2 font-display text-lg font-bold">{panels[1]?.value}</p>
          </div>
        </div>

        {/* Small panels on narrow screens */}
        <dl className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3 md:hidden">
          {panels.map((p) => (
            <div key={p.label} className="panel p-4">
              <dt className="eyebrow">{p.label}</dt>
              <dd className="mt-1 font-display font-bold">{p.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
