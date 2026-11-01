import { useEffect, useRef, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { A11y, EffectCreative, Keyboard } from 'swiper/modules';
import { ArrowLeft, ArrowRight, Star } from 'lucide-react';
import { usePortfolio } from '../context/PortfolioContext';
import useReducedMotion from '../hooks/useReducedMotion';
import CoverArt from './CoverArt';

const palettes = [
  ['#C7FF4F', '#52E5FF', '#8B5CF6'],
  ['#52E5FF', '#8B5CF6', '#C7FF4F'],
  ['#8B5CF6', '#C7FF4F', '#52E5FF'],
];

/** Wireframe: portrait left · stars + quote centre · decorative image right. */
export default function TestimonialSlider() {
  const { content } = usePortfolio();
  const { testimonials } = content;
  const swiperRef = useRef(null);
  const [index, setIndex] = useState(0);
  const reduced = useReducedMotion();
  const pad = (n) => String(n).padStart(2, '0');

  useEffect(() => setIndex(0), [testimonials.length]);

  return (
    <div role="region" aria-roledescription="carousel" aria-label="Testimonials">
      <Swiper
        modules={[A11y, EffectCreative, Keyboard]}
        effect="creative"
        creativeEffect={{
          prev: { translate: ['-30%', 0, -1], opacity: 0 },
          next: { translate: ['30%', 0, -1], opacity: 0 },
        }}
        speed={reduced ? 0 : 800}
        keyboard={{ enabled: true }}
        grabCursor
        onSwiper={(s) => {
          swiperRef.current = s;
        }}
        onSlideChange={(s) => setIndex(s.activeIndex)}
        a11y={{ prevSlideMessage: 'Previous testimonial', nextSlideMessage: 'Next testimonial' }}
      >
        {testimonials.map((t, i) => (
          <SwiperSlide key={t.recordId || t.id} aria-label={`Testimonial ${i + 1} of ${testimonials.length}`}>
            <figure className="panel grid items-stretch gap-6 p-5 md:grid-cols-[11rem_1fr_11rem] md:p-8">
              <div className="relative hidden aspect-square overflow-hidden border border-line md:block md:aspect-auto">
                <CoverArt variant="orbit" palette={palettes[i % 3]} alt="" className="absolute inset-0 h-full w-full" />
                <span className="absolute inset-0 grid place-items-center font-display text-4xl font-extrabold">
                  {String(t.name || '')
                    .split(' ')
                    .map((w) => w[0])
                    .join('')}
                </span>
              </div>

              <div className="flex flex-col justify-between gap-8 py-2">
                <div>
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1 text-lime" role="img" aria-label={`${t.rating || 5} out of 5 stars`}>
                      {Array.from({ length: Math.max(0, Math.min(5, Number(t.rating || 5))) }, (_, k) => (
                        <Star key={k} size={16} fill="currentColor" aria-hidden="true" />
                      ))}
                    </div>
                  </div>
                  <blockquote className="mt-6 text-[clamp(1.15rem,2.2vw,1.8rem)] font-medium leading-snug">
                    “{t.quote}”
                  </blockquote>
                </div>
                <figcaption>
                  <p className="font-display text-lg font-bold">{t.name}</p>
                  <p className="text-sm text-muted">
                    {t.role} · {t.context}
                  </p>
                </figcaption>
              </div>

              <div className="relative hidden overflow-hidden border border-line md:block">
                <CoverArt
                  variant={['grid', 'waves', 'rings'][i % 3]}
                  palette={palettes[(i + 1) % 3]}
                  alt=""
                  className="absolute inset-0 h-full w-full"
                />
              </div>
            </figure>
          </SwiperSlide>
        ))}
      </Swiper>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex max-w-full flex-wrap items-center gap-3" role="group" aria-label="Choose testimonial">
          {testimonials.map((t, i) => (
            <button
              key={t.recordId || t.id}
              type="button"
              aria-label={`Show testimonial ${i + 1}`}
              aria-current={i === index ? 'true' : undefined}
              onClick={() => swiperRef.current?.slideTo(i)}
              className="group grid h-8 place-items-center"
            >
              <span
                className={`block h-1 rounded-full transition-all duration-500 ${
                  i === index ? 'w-12 bg-lime' : 'w-6 bg-line group-hover:bg-fg/40'
                }`}
              />
            </button>
          ))}
          <span className="ml-2 font-mono text-xs text-muted" aria-live="polite">
            {pad(index + 1)} / {pad(testimonials.length)}
          </span>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            aria-label="Previous testimonial"
            disabled={testimonials.length < 2}
            onClick={() => swiperRef.current?.slidePrev()}
            className="grid h-11 w-11 place-items-center rounded-full border border-line transition-colors hover:border-lime hover:text-lime disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:border-line disabled:hover:text-fg"
          >
            <ArrowLeft size={18} aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label="Next testimonial"
            disabled={testimonials.length < 2}
            onClick={() => swiperRef.current?.slideNext()}
            className="grid h-11 w-11 place-items-center rounded-full border border-line transition-colors hover:border-lime hover:text-lime disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:border-line disabled:hover:text-fg"
          >
            <ArrowRight size={18} aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
