import { useRef } from 'react';
import { useGSAP, gsap } from '../animations/gsapConfig';
import { batchReveal, motion, parallaxY } from '../animations/animationHelpers';
import AnimatedButton from '../components/AnimatedButton';
import CoverArt from '../components/CoverArt';
import Icon from '../components/Icon';
import SectionHeading from '../components/SectionHeading';
import { usePortfolio } from '../context/PortfolioContext';

export default function About() {
  const { content } = usePortfolio();
  const { about } = content;
  const ref = useRef(null);

  useGSAP(
    () => {
      const root = ref.current;
      const mm = motion(() => {
        batchReveal(root, '[data-reveal]', { stagger: 0.12 });
        batchReveal(root, '[data-card]', { y: 50, stagger: 0.1 });
        parallaxY(root.querySelector('[data-portrait-art]'), root.querySelector('[data-portrait]'), 10);
        gsap.from(root.querySelector('[data-portrait]'), {
          clipPath: 'inset(0 0 100% 0)',
          duration: 1.4,
          ease: 'power4.inOut',
          scrollTrigger: { trigger: root.querySelector('[data-portrait]'), start: 'top 85%', once: true },
        });
      });
      return () => mm.revert();
    },
    { scope: ref }
  );

  return (
    <section id="about" ref={ref} aria-labelledby="about-title" className="section">
      <div className="container-x">
        <SectionHeading number="01" eyebrow={about.eyebrow} title={about.heading} id="about-title" />

        {/* Primary row: large bio block + details panel (wireframe panel 2, top) */}
        <div className="mt-14 grid gap-5 lg:grid-cols-[1.55fr_1fr]">
          <div className="panel p-7 md:p-10" data-reveal>
            <p className="text-[clamp(1.25rem,2.4vw,2rem)] font-medium leading-snug">{about.intro}</p>
            <div className="mt-8 grid gap-6 text-muted md:grid-cols-2">
              {(about.bio || []).map((t) => (
                <p key={t} className="leading-relaxed">
                  {t}
                </p>
              ))}
            </div>
            <div className="mt-10">
              <AnimatedButton href={content.projects.length ? '#projects' : '#contact'}>See selected work</AnimatedButton>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1">
            <div
              data-portrait
              className="panel relative aspect-[4/3] overflow-hidden lg:aspect-auto lg:min-h-[14rem]"
            >
              <div data-portrait-art className="absolute inset-[-12%]">
                <CoverArt
                  image={about.portraitImage}
                  variant="orbit"
                  palette={['#52E5FF', '#C7FF4F', '#8B5CF6']}
                  alt="Shubham Soni — Creative Developer"
                  className="h-full w-full object-cover object-center"
                />
              </div>
              <span className="eyebrow absolute bottom-3 left-3 rounded-full border border-line bg-ink/70 px-3 py-1 backdrop-blur">
                Creative Dev · India
              </span>
            </div>

            <dl className="panel divide-y divide-line" data-reveal>
              {(about.details || []).map((d) => (
                <div key={d.label} className="flex items-baseline justify-between gap-4 px-5 py-4 sm:px-6">
                  <dt className="eyebrow min-w-0 break-words">{d.label}</dt>
                  <dd className="min-w-0 break-words text-right text-sm font-medium">{d.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        {/* Secondary row: 2×2 focus cards + approach list */}
        <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_1.3fr]">
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            {(about.focus || []).map((f) => (
              <li key={f.title} data-card className="panel group p-5 transition-colors hover:border-lime/60">
                <Icon name={f.icon} className="text-lime transition-transform duration-500 group-hover:-translate-y-1" />
                <h3 className="mt-5 font-display text-lg font-bold">{f.title}</h3>
                <p className="mt-1 text-sm text-muted">{f.text}</p>
              </li>
            ))}
          </ul>

          <div className="panel p-7 md:p-9" data-card>
            <p className="eyebrow">Working approach</p>
            <ul className="mt-6 space-y-4">
            {(about.approach || []).map((a, i) => (
                <li key={a} className="flex gap-4">
                  <span className="mt-0.5 font-mono text-xs text-lime">{String(i + 1).padStart(2, '0')}</span>
                  <span className="leading-relaxed text-fg/90">{a}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
