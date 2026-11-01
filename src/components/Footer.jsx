import { useRef } from 'react';
import { ArrowUp, ArrowUpRight } from 'lucide-react';
import { useGSAP, gsap } from '../animations/gsapConfig';
import { motion } from '../animations/animationHelpers';
import { scrollToId } from '../hooks/useSmoothScroll';
import SplitText from './SplitText';
import { usePortfolio } from '../context/PortfolioContext';

/** Large curved footer panel that overlaps the Contact section. */
export default function Footer({ links = [] }) {
  const { content } = usePortfolio();
  const { site, socials, footer } = content;
  const brandParts = (site.brand || 'shubham.dev').split('.');
  const ref = useRef(null);

  useGSAP(
    () => {
      const root = ref.current;
      const mm = motion(() => {
        gsap.from(root.querySelectorAll('.footer-char'), {
          yPercent: 100,
          opacity: 0,
          stagger: 0.025,
          duration: 1,
          ease: 'power4.out',
          scrollTrigger: { trigger: root, start: 'top 75%', once: true },
        });
        const footerTitle = root.querySelector('[data-footer-title]');
        if (footerTitle) {
          gsap.fromTo(
            footerTitle,
            { opacity: 0.35, y: 24, scale: 0.96 },
            {
              opacity: 1,
              y: 0,
              scale: 1,
              ease: 'power2.out',
              scrollTrigger: { trigger: footerTitle, start: 'top 95%', end: 'bottom 80%', scrub: 0.6 },
            }
          );
        }
        gsap.from(root.querySelectorAll('[data-fade]'), {
          y: 30,
          opacity: 0,
          stagger: 0.1,
          duration: 0.9,
          scrollTrigger: { trigger: root.querySelector('[data-fade]'), start: 'top 90%', once: true },
        });
      });
      return () => mm.revert();
    },
    { scope: ref }
  );

  const go = (id) => (e) => {
    e.preventDefault();
    scrollToId(id);
  };

  return (
    <footer
      ref={ref}
      className="relative mt-8 overflow-hidden rounded-t-[2.5rem] border-t border-line bg-surface md:mt-12 md:rounded-t-[4rem]"
    >
      <div className="container-x pb-8 pt-16 md:pt-24">
        <div className="grid gap-14 lg:grid-cols-[1.5fr_1fr]">
          <div>
            <p className="eyebrow" data-fade>
              {footer.nextStepLabel || 'Next step'}
            </p>
            <h2 className="display mt-5 text-[clamp(2.4rem,7vw,6.5rem)]">
              <SplitText text={footer.heading || "Let's build something meaningful."} charClass="footer-char" />
            </h2>
            {site.email && <div className="mt-10 flex flex-wrap items-center gap-4" data-fade>
              <a
                href={`mailto:${site.email}`}
                className="link-underline inline-flex items-center gap-2 text-lg font-semibold text-lime"
              >
                {site.email || ''} <ArrowUpRight size={18} aria-hidden="true" />
              </a>
            </div>}
          </div>

          <div className="grid grid-cols-2 gap-8" data-fade>
            <nav aria-label="Footer navigation">
              <p className="eyebrow mb-5">Navigate</p>
              <ul className="space-y-3">
                {links.map((l) => (
                  <li key={l.id}>
                    <a
                      href={`#${l.id}`}
                      onClick={go(l.id)}
                      className="link-underline text-fg/85 transition-colors hover:text-lime"
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
            {socials.length > 0 && <div>
              <p className="eyebrow mb-5">Elsewhere</p>
              <ul className="space-y-3">
                {socials.map((s) => (
                  <li key={s.label}>
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="link-underline text-fg/85 transition-colors hover:text-lime"
                    >
                      {s.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>}
          </div>
        </div>

        {/* Large signature footer heading */}
        <div className="my-10 select-none text-center sm:my-14" aria-hidden="true">
          <p
            data-footer-title
            className="footer-hero-text font-heading mx-auto w-full text-center leading-none text-transparent"
            style={{
              fontSize: 'clamp(2rem, 9.8vw, 11.5rem)',
              letterSpacing: '-0.025em',
              WebkitTextStroke: '1.5px rgba(245,247,250,0.18)',
            }}
          >
            {site.heroTitle}
          </p>
        </div>

        <div className="flex flex-col items-start justify-between gap-6 border-t border-line pt-6 text-sm text-muted md:flex-row md:items-center">
          <div className="flex flex-col gap-1">
            <a
              href="#top"
              onClick={go('top')}
              className="font-display text-lg font-extrabold text-fg"
              aria-label={`${site.brand} — back to top`}
            >
              {brandParts[0]}
              {brandParts[1] && <span className="text-lime">.{brandParts.slice(1).join('.')}</span>}
            </a>
            <p>
              © {new Date().getFullYear()} {site.name}. {footer.copyrightText || 'All rights reserved.'}
            </p>
            <p>{footer.creditText || `Designed & built by ${site.name} with React, GSAP and Three.js.`}</p>
          </div>
          <button
            type="button"
            onClick={() => scrollToId('top')}
            className="group inline-flex items-center gap-3 rounded-full border border-line px-5 py-3 font-semibold text-fg transition-colors hover:border-lime hover:text-lime"
          >
            Back to top
            <ArrowUp
              size={18}
              aria-hidden="true"
              className="transition-transform duration-300 group-hover:-translate-y-1"
            />
          </button>
        </div>
      </div>
    </footer>
  );
}
