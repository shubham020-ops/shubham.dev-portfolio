import { useRef } from 'react';
import { useGSAP, gsap } from '../animations/gsapConfig';
import { motion } from '../animations/animationHelpers';

/** Numbered section heading with a masked word-by-word reveal on scroll. */
export default function SectionHeading({ number, eyebrow, title, id, className = '', as: Tag = 'h2' }) {
  const ref = useRef(null);

  useGSAP(
    () => {
      const mm = motion(() => {
        const inner = ref.current.querySelectorAll('.word-inner');
        gsap.from(inner, {
          yPercent: 115,
          duration: 1,
          stagger: 0.07,
          ease: 'power4.out',
          scrollTrigger: { trigger: ref.current, start: 'top 85%', once: true },
        });
        gsap.from(ref.current.querySelectorAll('.eyebrow-line'), {
          opacity: 0,
          x: -16,
          duration: 0.8,
          scrollTrigger: { trigger: ref.current, start: 'top 90%', once: true },
        });
      });
      return () => mm.revert();
    },
    { scope: ref }
  );

  return (
    <div ref={ref} className={className}>
      <p className="eyebrow eyebrow-line flex items-center gap-3">
        <span className="text-lime">{number}</span>
        <span className="h-px w-10 bg-line" aria-hidden="true" />
        <span>{eyebrow}</span>
      </p>
      <Tag id={id} className="display mt-5 text-[clamp(2.2rem,6vw,5.2rem)]">
        {title.split(' ').map((w, i) => (
          <span key={i} className="inline-block overflow-hidden pb-[0.12em] align-bottom">
            <span className="word-inner inline-block">{w}</span>
            {' '}
          </span>
        ))}
      </Tag>
    </div>
  );
}
