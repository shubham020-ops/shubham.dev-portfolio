import { useEffect, useRef } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { gsap } from '../animations/gsapConfig';
import { isFinePointer } from '../animations/animationHelpers';
import useReducedMotion from '../hooks/useReducedMotion';
import { scrollToId } from '../hooks/useSmoothScroll';

/**
 * Magnetic CTA. Renders <a> for links (smooth in-page scrolling for "#id"),
 * or <button> when no href is given.
 */
export default function AnimatedButton({
  href,
  onClick,
  children,
  variant = 'primary',
  icon = true,
  className = '',
  type = 'button',
  ...rest
}) {
  const ref = useRef(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el || reduced || !isFinePointer()) return undefined;

    const xTo = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'power3' });
    const move = (e) => {
      const r = el.getBoundingClientRect();
      xTo((e.clientX - (r.left + r.width / 2)) * 0.25);
      yTo((e.clientY - (r.top + r.height / 2)) * 0.35);
    };
    const leave = () => {
      xTo(0);
      yTo(0);
    };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerleave', leave);
    return () => {
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerleave', leave);
      gsap.set(el, { x: 0, y: 0 });
    };
  }, [reduced]);

  const cls = `btn ${variant === 'primary' ? 'btn-primary' : 'btn-ghost'} ${className}`;
  const content = (
    <>
      <span>{children}</span>
      {icon && <ArrowUpRight size={18} aria-hidden="true" />}
    </>
  );

  if (href) {
    const isHash = href.startsWith('#');
    const isExternal = /^https?:/.test(href);
    return (
      <a
        ref={ref}
        href={href}
        className={cls}
        {...(isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        onClick={(e) => {
          if (isHash) {
            e.preventDefault();
            scrollToId(href.slice(1));
          }
          onClick?.(e);
        }}
        {...rest}
      >
        {content}
      </a>
    );
  }

  return (
    <button ref={ref} type={type} className={cls} onClick={onClick} {...rest}>
      {content}
    </button>
  );
}
