import { useEffect, useRef, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { A11y, FreeMode, Keyboard } from 'swiper/modules';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import ProjectCard from './ProjectCard';

/** Swipeable project gallery. Shows a small next-card preview on mobile. */
export default function ProjectSlider({ items }) {
  const swiperRef = useRef(null);
  const [state, setState] = useState({ begin: true, end: false });
  const [mobile, setMobile] = useState(() => window.matchMedia('(max-width: 639px)').matches);
  const sync = (s) => setState({ begin: s.isBeginning, end: s.isEnd });

  useEffect(() => {
    const query = window.matchMedia('(max-width: 639px)');
    const update = () => setMobile(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <p className="eyebrow min-w-0">Drag, swipe or use the arrows</p>
        <div className="flex gap-2">
          <button
            type="button"
            aria-label="Previous projects"
            disabled={state.begin}
            onClick={() => swiperRef.current?.slidePrev()}
            className="grid h-11 w-11 place-items-center rounded-full border border-line transition-colors hover:border-lime hover:text-lime disabled:opacity-30 disabled:hover:border-line disabled:hover:text-fg"
          >
            <ArrowLeft size={18} aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label="Next projects"
            disabled={state.end}
            onClick={() => swiperRef.current?.slideNext()}
            className="grid h-11 w-11 place-items-center rounded-full border border-line transition-colors hover:border-lime hover:text-lime disabled:opacity-30 disabled:hover:border-line disabled:hover:text-fg"
          >
            <ArrowRight size={18} aria-hidden="true" />
          </button>
        </div>
      </div>

      <Swiper
        modules={[A11y, FreeMode, Keyboard]}
        slidesPerView={1.08}
        slidesPerGroup={1}
        spaceBetween={14}
        speed={450}
        threshold={mobile ? 5 : 0}
        longSwipesRatio={mobile ? 0.15 : 0.5}
        longSwipesMs={mobile ? 180 : 300}
        watchOverflow
        grabCursor
        keyboard={{ enabled: true }}
        freeMode={mobile ? false : { enabled: true, sticky: true, momentumRatio: 0.6 }}
        breakpoints={{
          640: { slidesPerView: 2, spaceBetween: 20 },
          1100: { slidesPerView: 3, spaceBetween: 24 },
        }}
        onSwiper={(s) => {
          swiperRef.current = s;
          sync(s);
        }}
        onSlideChange={sync}
        onReachBeginning={sync}
        onReachEnd={sync}
        onResize={sync}
        a11y={{ prevSlideMessage: 'Previous project', nextSlideMessage: 'Next project' }}
      >
        {items.map((p) => (
          <SwiperSlide key={p.recordId || p.id}>
            <ProjectCard project={p} />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
