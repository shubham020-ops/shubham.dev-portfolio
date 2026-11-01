import { useRef } from 'react';
import { useGSAP } from '../animations/gsapConfig';
import { batchReveal, motion } from '../animations/animationHelpers';
import SectionHeading from '../components/SectionHeading';
import TestimonialSlider from '../components/TestimonialSlider';
import { usePortfolio } from '../context/PortfolioContext';

export default function Testimonials() {
  const { content } = usePortfolio();
  const ref = useRef(null);

  useGSAP(
    () => {
      const root = ref.current;
      const mm = motion(() => {
        batchReveal(root, '[data-reveal]', { y: 50, stagger: 0.12 });
      });
      return () => mm.revert();
    },
    { scope: ref }
  );

  return (
    <section id="testimonials" ref={ref} aria-labelledby="testimonials-title" className="section">
      <div className="container-x">
        <SectionHeading number="05" eyebrow="Testimonials" title="Kind words." id="testimonials-title" />

        <div className="mt-12" data-reveal>
          {content.testimonials.length ? <TestimonialSlider /> : (
            <div className="panel p-6 sm:p-8">
              <p className="eyebrow text-lime">Testimonials</p>
              <h3 className="mt-3 font-display text-xl font-bold sm:text-2xl">Kind words will appear here.</h3>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">Sirf asli feedback, author ki permission ke saath, Admin panel mein publish karein.</p>
            </div>
          )}
        </div>

      </div>
    </section>
  );
}
