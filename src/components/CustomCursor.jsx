import { useEffect, useRef } from 'react';
import { gsap } from '../animations/gsapConfig';
import { isFinePointer } from '../animations/animationHelpers';
import useReducedMotion from '../hooks/useReducedMotion';

/**
 * Decorative cursor ring (fine pointers only). The native cursor is kept.
 * Add data-cursor="Label" to any element to show a labelled cursor over it.
 */
export default function CustomCursor() {
  const ref = useRef(null);
  const labelRef = useRef(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el || reduced || !isFinePointer()) return undefined;

    gsap.set(el, { opacity: 0 });
    const xTo = gsap.quickTo(el, 'x', { duration: 0.35, ease: 'power3' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.35, ease: 'power3' });

    const onMove = (e) => {
      gsap.to(el, { opacity: 1, duration: 0.3, overwrite: 'auto' });
      xTo(e.clientX);
      yTo(e.clientY);
    };
    const onOver = (e) => {
      const labelled = e.target.closest?.('[data-cursor]');
      const interactive = e.target.closest?.('a, button, input, textarea, select, [role="button"]');
      if (labelled) {
        labelRef.current.textContent = labelled.getAttribute('data-cursor');
        el.classList.add('has-label');
        el.classList.remove('is-link');
      } else {
        el.classList.remove('has-label');
        el.classList.toggle('is-link', Boolean(interactive));
      }
    };
    const onLeave = () => gsap.to(el, { opacity: 0, duration: 0.3 });

    window.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('mouseover', onOver, { passive: true });
    document.documentElement.addEventListener('mouseleave', onLeave);
    return () => {
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('mouseover', onOver);
      document.documentElement.removeEventListener('mouseleave', onLeave);
    };
  }, [reduced]);

  if (reduced) return null;

  return (
    <div ref={ref} className="cursor" aria-hidden="true">
      <span ref={labelRef} className="cursor-label" />
    </div>
  );
}
