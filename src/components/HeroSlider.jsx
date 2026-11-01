import { useRef, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { A11y, Autoplay, EffectCreative, Keyboard, Parallax } from 'swiper/modules';
import { ArrowLeft, ArrowRight, ArrowUpRight } from 'lucide-react';
import { useProjectModal } from '../context/ProjectModalContext';
import useReducedMotion from '../hooks/useReducedMotion';
import CoverArt from './CoverArt';
import { usePortfolio } from '../context/PortfolioContext';

/** Foreground hero slider + overlapping "next" panel + thumbnail strip. */
export default function HeroSlider() {
  const { content } = usePortfolio();
  const { projects } = content;
  const swiperRef = useRef(null);
  const [index, setIndex] = useState(0);
  const reduced = useReducedMotion();
  const { open } = useProjectModal();
  const total = projects.length;
  const next = projects[(index + 1) % total];
  const pad = (n) => String(n).padStart(2, '0');

  if (!total) {
    return (
      <div data-hero-slider className="hero-slider hero-slider--root hero-slider--empty flex h-[clamp(280px,46vh,520px)] items-end border border-line bg-surface p-6 sm:p-8">
        <div className="max-w-lg">
          <p className="eyebrow text-lime">Selected work</p>
          <p className="mt-3 font-display text-xl font-bold text-fg sm:text-2xl">New projects are on the way.</p>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">Published project previews will appear here automatically.</p>
        </div>
      </div>
    );
  }

  return (
    <div data-hero-slider className="hero-slider--root">
      <div className="relative">
        <div
          className="hero-slider hero-slider--viewport relative h-[clamp(280px,46vh,520px)] overflow-hidden border border-line bg-surface"
          role="region"
          aria-roledescription="carousel"
          aria-label="Featured projects"
        >
          <Swiper
            modules={[A11y, Autoplay, EffectCreative, Keyboard, Parallax]}
            effect="creative"
            creativeEffect={{
              prev: { translate: ['-25%', 0, -1], opacity: 0.4 },
              next: { translate: ['100%', 0, 0] },
            }}
            parallax
            speed={reduced ? 0 : 900}
            rewind
            keyboard={{ enabled: true }}
            autoplay={reduced || total < 2 ? false : { delay: 6500, disableOnInteraction: false, pauseOnMouseEnter: true }}
            onSwiper={(s) => {
              swiperRef.current = s;
            }}
            onSlideChange={(s) => setIndex(s.activeIndex)}
            a11y={{ prevSlideMessage: 'Previous project', nextSlideMessage: 'Next project' }}
            className="h-full"
          >
            {projects.map((p, pIdx) => (
              <SwiperSlide key={p.recordId || p.id} aria-label={`${p.number} of ${pad(total)}: ${p.title}`}>
                <div className="relative h-full w-full overflow-hidden">
                  <div className="absolute inset-[-8%]" data-swiper-parallax="-10%">
                    <CoverArt
                      image={p.image}
                      {...p.cover}
                      alt={`Featured preview for ${p.title}`}
                      loading={pIdx === 0 ? 'eager' : 'lazy'}
                      className="h-full w-full object-cover object-center"
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/25 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 flex flex-col gap-4 p-5 sm:p-8 md:flex-row md:items-end md:justify-between">
                    <div data-swiper-parallax="-30%" data-swiper-parallax-opacity="0.2">
                      <p className="eyebrow flex flex-wrap items-center gap-3 text-fg/80">
                        <span className="text-lime">{p.number}</span>
                        <span>{p.category}</span>
                      </p>
                      <h2 className="hero-slider__title display mt-3 text-[clamp(1.5rem,3.8vw,3.2rem)]">{p.title}</h2>
                    </div>
                    <button
                      type="button"
                      onClick={() => open(p.id)}
                      data-cursor="View"
                      className="btn btn-primary self-start md:self-auto"
                    >
                      View Project <ArrowUpRight size={18} aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>

          <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-center justify-between p-4 sm:p-6">
            <p className="eyebrow rounded-full border border-line bg-ink/60 px-3 py-1.5 text-fg backdrop-blur" aria-live="polite">
              <span className="text-lime">{pad(index + 1)}</span> / {pad(total)}
            </p>
            <div className="pointer-events-auto flex gap-2">
              <button
                type="button"
                aria-label="Previous project"
                disabled={total < 2}
                onClick={() => swiperRef.current?.slidePrev()}
                className="grid h-11 w-11 place-items-center rounded-full border border-line bg-ink/60 backdrop-blur transition-colors hover:border-lime hover:text-lime disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:border-line disabled:hover:text-fg"
              >
                <ArrowLeft size={18} aria-hidden="true" />
              </button>
              <button
                type="button"
                aria-label="Next project"
                disabled={total < 2}
                onClick={() => swiperRef.current?.slideNext()}
                className="grid h-11 w-11 place-items-center rounded-full border border-line bg-ink/60 backdrop-blur transition-colors hover:border-lime hover:text-lime disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:border-line disabled:hover:text-fg"
              >
                <ArrowRight size={18} aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>

        {/* Overlapping adjacent panel */}
        {total > 1 && <button
          type="button"
          aria-label={`Next project: ${next.title}`}
          onClick={() => swiperRef.current?.slideNext()}
          className="absolute -bottom-7 -right-3 z-10 hidden aspect-[4/3] w-[20%] rotate-3 overflow-hidden border border-line bg-surface shadow-[0_20px_60px_rgba(0,0,0,0.6)] transition-transform duration-500 hover:rotate-0 md:block"
        >
          <CoverArt image={next.image} {...next.cover} alt="" className="h-full w-full object-cover object-center" />
          <span className="absolute inset-x-0 bottom-0 bg-ink/70 px-2 py-1 text-left font-mono text-[0.6rem] uppercase tracking-widest backdrop-blur">
            Next · {next.number}
          </span>
        </button>}
      </div>

      {/* Thumbnails */}
      <ul className="mt-7 sm:mt-9 grid grid-cols-5 gap-2 sm:gap-3" aria-label="Choose a project">
        {projects.map((p, i) => (
          <li key={p.recordId || p.id} data-hero-thumb>
            <button
              type="button"
              onClick={() => swiperRef.current?.slideTo(i)}
              aria-label={`Show project ${p.number}: ${p.title}`}
              aria-current={i === index ? 'true' : undefined}
              className={`group relative block aspect-[4/3] w-full overflow-hidden border transition-colors ${
                i === index ? 'border-lime' : 'border-line hover:border-fg/40'
              }`}
            >
              <CoverArt image={p.image} {...p.cover} alt="" className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-110" />
              <span className="absolute left-1.5 top-1.5 font-mono text-[0.6rem] text-fg/90 bg-ink/70 px-1 py-0.5 rounded backdrop-blur">{p.number}</span>
              <span
                className={`absolute inset-x-0 bottom-0 h-0.5 origin-left bg-lime transition-transform duration-500 ${
                  i === index ? 'scale-x-100' : 'scale-x-0'
                }`}
              />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
