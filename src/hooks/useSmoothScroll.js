import { useEffect } from 'react';
import Lenis from 'lenis';
import { gsap, ScrollTrigger } from '../animations/gsapConfig';

/**
 * SINGLE smooth-scroll engine: Lenis, driven by GSAP's ticker so ScrollTrigger
 * stays perfectly in sync (one animation loop, one scroll handler).
 *
 * Why not Locomotive Scroll? v5 is itself a wrapper around Lenis and still ships
 * as a pre-release. Running both would duplicate scroll handling, so only Lenis
 * is initialised. Locomotive's viewport detection / parallax are covered by
 * ScrollTrigger (batchReveal, parallaxY).
 */
let lenisInstance = null;

export const getLenis = () => lenisInstance;

export function scrollToId(id, { updateHash = true } = {}) {
  const el = id === 'top' ? null : document.getElementById(id);
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (lenisInstance) {
    lenisInstance.scrollTo(el || 0, { duration: 1.4 });
  } else {
    const top = el ? el.getBoundingClientRect().top + window.scrollY : 0;
    window.scrollTo({ top, behavior: reduce ? 'auto' : 'smooth' });
  }

  if (updateHash) {
    window.history.pushState(null, '', id === 'top' ? window.location.pathname : `#${id}`);
  }
  if (el) {
    el.setAttribute('tabindex', '-1');
    el.focus({ preventScroll: true });
  }
}

export default function useSmoothScroll() {
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let lenis = null;
    let tick = null;

    if (!reduce) {
      lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
      lenisInstance = lenis;
      lenis.on('scroll', ScrollTrigger.update);
      tick = (time) => lenis.raf(time * 1000);
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);
    }

    const onPopState = () => {
      const id = window.location.hash.slice(1);
      if (id) scrollToId(id, { updateHash: false });
      else if (lenis) lenis.scrollTo(0, { immediate: true });
      else window.scrollTo(0, 0);
    };
    window.addEventListener('popstate', onPopState);

    const refresh = () => ScrollTrigger.refresh();
    window.addEventListener('load', refresh);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(refresh);

    // Honour a deep link such as /#projects once layout has settled.
    const hashId = window.location.hash.slice(1);
    const hashTimer = hashId
      ? window.setTimeout(() => scrollToId(hashId, { updateHash: false }), 700)
      : null;

    return () => {
      window.removeEventListener('popstate', onPopState);
      window.removeEventListener('load', refresh);
      if (hashTimer) window.clearTimeout(hashTimer);
      if (tick) gsap.ticker.remove(tick);
      if (lenis) lenis.destroy();
      lenisInstance = null;
    };
  }, []);
}
