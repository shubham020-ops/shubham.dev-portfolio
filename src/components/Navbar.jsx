import { useEffect, useRef, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { gsap } from '../animations/gsapConfig';
import { motion } from '../animations/animationHelpers';
import { getLenis, scrollToId } from '../hooks/useSmoothScroll';
import AnimatedButton from './AnimatedButton';
import { usePortfolio } from '../context/PortfolioContext';

export default function Navbar({ links = [] }) {
  const { content } = usePortfolio();
  const { site } = content;
  const brandParts = (site.brand || 'shubham.dev').split('.');
  const headerRef = useRef(null);
  const menuBtnRef = useRef(null);
  const firstLinkRef = useRef(null);
  const menuRef = useRef(null);
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState('');

  // Entrance animation
  useEffect(() => {
    const ctx = gsap.context(() => {
      const mm = motion(() => {
        gsap.from('[data-nav-item]', { y: -26, opacity: 0, stagger: 0.07, delay: 0.25, duration: 0.9 });
      });
      return () => mm.revert();
    }, headerRef);
    return () => ctx.revert();
  }, []);

  // Background after scrolling
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Active-section highlighting
  useEffect(() => {
    const els = links.map((l) => document.getElementById(l.id)).filter(Boolean);
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(e.target.id);
        });
      },
      { rootMargin: '-45% 0px -50% 0px' }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [links]);

  // Mobile menu: scroll lock, Esc, focus handling
  useEffect(() => {
    if (!open) return undefined;
    getLenis()?.stop();
    document.body.style.overflow = 'hidden';
    firstLinkRef.current?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setOpen(false);
        return;
      }
      if (e.key !== 'Tab') return;

      const focusables = menuRef.current?.querySelectorAll(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (!focusables?.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const focusIsOutsideMenu = !menuRef.current.contains(document.activeElement);

      if (e.shiftKey && (document.activeElement === first || focusIsOutsideMenu)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (document.activeElement === last || focusIsOutsideMenu)) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      getLenis()?.start();
      menuBtnRef.current?.focus();
    };
  }, [open]);

  const go = (id) => (e) => {
    e.preventDefault();
    setOpen(false);
    // let the menu release its scroll lock first
    window.setTimeout(() => scrollToId(id), open ? 60 : 0);
  };

  return (
    <header
      ref={headerRef}
      className={`fixed inset-x-0 top-0 z-50 transition-[background,backdrop-filter,border-color] duration-500 ${
        scrolled ? 'border-b border-line bg-ink/75 backdrop-blur-xl' : 'border-b border-transparent'
      }`}
    >
      <div className="container-x flex h-[var(--nav-h)] items-center justify-between gap-6">
        <a
          href="#top"
          data-nav-item
          onClick={go('top')}
          className="font-display text-xl font-extrabold tracking-tight"
          aria-label={`${site.brand || 'shubham.dev'} — back to top`}
        >
          {brandParts[0]}
          {brandParts[1] && <span className="text-lime">.{brandParts.slice(1).join('.')}</span>}
        </a>

        <nav aria-label="Primary" className="hidden items-center gap-8 lg:flex">
          {links.map((l) => (
            <a
              key={l.id}
              href={`#${l.id}`}
              data-nav-item
              onClick={go(l.id)}
              aria-current={active === l.id ? 'true' : undefined}
              className={`link-underline text-sm font-medium transition-colors hover:text-lime ${
                active === l.id ? 'text-lime' : 'text-fg/80'
              }`}
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <p data-nav-item className="hidden items-center gap-2 text-xs text-muted xl:flex">
            <span className="relative flex h-2 w-2" aria-hidden="true">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-lime opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-lime" />
            </span>
            {site.availability}
          </p>
          <span data-nav-item className="hidden sm:inline-flex">
            <AnimatedButton href={site.secondaryCtaUrl || '#contact'} className="!px-5 !py-2.5">
              {site.secondaryCta}
            </AnimatedButton>
          </span>
          <button
            ref={menuBtnRef}
            type="button"
            data-nav-item
            className="grid h-11 w-11 place-items-center rounded-full border border-line lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
          </button>
        </div>
      </div>

      {open && (
        <div
          id="mobile-menu"
          ref={menuRef}
          role="dialog"
          aria-modal="true"
          aria-label="Site menu"
          className="fixed inset-0 top-[var(--nav-h)] z-40 flex flex-col justify-between overflow-y-auto bg-ink/95 px-6 pb-10 pt-6 backdrop-blur-xl lg:hidden"
        >
          <ul className="flex flex-col gap-1">
            {links.map((l, i) => (
              <li key={l.id}>
                <a
                  ref={i === 0 ? firstLinkRef : undefined}
                  href={`#${l.id}`}
                  onClick={go(l.id)}
                  className="display block border-b border-line py-3 text-2xl sm:text-3xl"
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
          <div className="flex flex-col gap-4">
            <p className="flex items-center gap-2 text-sm text-muted">
              <span className="h-2 w-2 rounded-full bg-lime" aria-hidden="true" />
              {site.availability}
            </p>
            <AnimatedButton href={site.secondaryCtaUrl || '#contact'} onClick={() => setOpen(false)}>
              {site.secondaryCta}
            </AnimatedButton>
          </div>
        </div>
      )}
    </header>
  );
}
