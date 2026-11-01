import { gsap, ScrollTrigger } from './gsapConfig';

/**
 * Wraps gsap.matchMedia(). The setup callback only runs when the user has NOT
 * asked for reduced motion, so content simply stays in its natural, visible
 * state otherwise. Always revert the returned matchMedia on cleanup.
 *
 * setup receives { desktop, mobile } booleans.
 */
export function motion(setup) {
  const mm = gsap.matchMedia();
  mm.add(
    {
      desktop: '(min-width: 1024px)',
      mobile: '(max-width: 1023px)',
      reduce: '(prefers-reduced-motion: reduce)',
      normal: '(prefers-reduced-motion: no-preference)',
    },
    (context) => {
      const c = context.conditions;
      if (c.reduce) return undefined;
      return setup(c);
    }
  );
  return mm;
}

/** Fade/slide groups of elements in as they enter the viewport. */
export function batchReveal(root, selector, { y = 40, stagger = 0.1, start = 'top 88%' } = {}) {
  const els = Array.from(root.querySelectorAll(selector));
  if (!els.length) return;
  gsap.set(els, { y, opacity: 0 });
  ScrollTrigger.batch(els, {
    start,
    once: true,
    onEnter: (batch) =>
      gsap.to(batch, { y: 0, opacity: 1, stagger, duration: 0.9, overwrite: true }),
  });
}

/** Scroll-linked vertical parallax for an element inside a clipping parent. */
export function parallaxY(el, trigger, amount = 12) {
  if (!el) return;
  gsap.fromTo(
    el,
    { yPercent: -amount },
    {
      yPercent: amount,
      ease: 'none',
      scrollTrigger: { trigger: trigger || el, start: 'top bottom', end: 'bottom top', scrub: true },
    }
  );
}

/** Pointer-following tilt. Returns a cleanup function. */
export function attachTilt(el, { max = 6 } = {}) {
  if (!el) return () => {};
  const rx = gsap.quickTo(el, 'rotationX', { duration: 0.6, ease: 'power3' });
  const ry = gsap.quickTo(el, 'rotationY', { duration: 0.6, ease: 'power3' });
  gsap.set(el, { transformPerspective: 900 });
  const move = (e) => {
    const r = el.getBoundingClientRect();
    const nx = (e.clientX - r.left) / r.width - 0.5;
    const ny = (e.clientY - r.top) / r.height - 0.5;
    ry(nx * max * 2);
    rx(-ny * max * 2);
  };
  const leave = () => {
    rx(0);
    ry(0);
  };
  el.addEventListener('pointermove', move);
  el.addEventListener('pointerleave', leave);
  return () => {
    el.removeEventListener('pointermove', move);
    el.removeEventListener('pointerleave', leave);
    gsap.set(el, { rotationX: 0, rotationY: 0 });
  };
}

export const isFinePointer = () =>
  typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
