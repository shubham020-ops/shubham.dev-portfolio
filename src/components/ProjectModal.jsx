import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { gsap } from '../animations/gsapConfig';
import { useProjectModal } from '../context/ProjectModalContext';
import { getLenis } from '../hooks/useSmoothScroll';
import CoverArt from './CoverArt';
import AnimatedButton from './AnimatedButton';
import { usePortfolio } from '../context/PortfolioContext';

/** Accessible project detail dialog (Esc to close, focus trap, focus restore). */
export default function ProjectModal() {
  const { content } = usePortfolio();
  const { projects } = content;
  const { activeId, close } = useProjectModal();
  const project = projects.find((p) => (p.id || p.recordId) === activeId);
  const dialogRef = useRef(null);
  const closeRef = useRef(null);
  const lastFocus = useRef(null);

  useEffect(() => {
    if (!project) return undefined;
    lastFocus.current = document.activeElement;
    getLenis()?.stop();
    document.body.style.overflow = 'hidden';

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reduce) {
      gsap.fromTo(dialogRef.current, { opacity: 0, y: 40, scale: 0.97 }, { opacity: 1, y: 0, scale: 1, duration: 0.6 });
    }
    closeRef.current?.focus();

    const onKey = (e) => {
      if (e.key === 'Escape') {
        close();
        return;
      }
      if (e.key !== 'Tab') return;
      const focusables = dialogRef.current.querySelectorAll(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      getLenis()?.start();
      lastFocus.current?.focus?.();
    };
  }, [project, close]);

  if (!project) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/80 p-4 backdrop-blur-md"
      onMouseDown={(e) => e.target === e.currentTarget && close()}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="project-modal-title"
        data-lenis-prevent
        className="panel relative max-h-[90svh] w-full max-w-4xl overflow-y-auto"
      >
        <button
          ref={closeRef}
          type="button"
          onClick={close}
          aria-label="Close project details"
          className="absolute right-3 top-3 z-10 grid h-11 w-11 place-items-center rounded-full border border-line bg-ink/70 text-fg transition-colors hover:border-lime hover:text-lime"
        >
          <X size={20} aria-hidden="true" />
        </button>

        <div className="aspect-[16/8] w-full overflow-hidden">
          <CoverArt
            image={project.image}
            {...project.cover}
            alt={`Preview for ${project.title}`}
            className="h-full w-full object-cover object-center"
          />
        </div>

        <div className="grid gap-8 p-6 md:grid-cols-[1.4fr_1fr] md:p-10">
          <div>
            <p className="eyebrow flex items-center gap-3">
              <span className="text-lime">{project.number}</span>
              <span>{project.category}</span>
            </p>
            <h3 id="project-modal-title" className="display mt-4 text-4xl md:text-5xl">
              {project.title}
            </h3>
            <p className="mt-5 text-lg leading-relaxed text-fg/90">{project.description}</p>
            <p className="mt-4 leading-relaxed text-muted">{project.details}</p>
          </div>

          <div className="flex flex-col gap-6">
            <div>
              <p className="eyebrow mb-3">Technologies</p>
              <ul className="flex flex-wrap gap-2">
                {(project.tech || []).map((t) => (
                  <li key={t} className="chip">
                    {t}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex flex-wrap gap-3">
              {project.liveUrl && <AnimatedButton href={project.liveUrl}>Live demo</AnimatedButton>}
              {project.repoUrl && (
                <AnimatedButton href={project.repoUrl} variant="ghost">
                  Source code
                </AnimatedButton>
              )}
              {project.caseStudyUrl && (
                <AnimatedButton href={project.caseStudyUrl} variant="ghost">
                  Case study
                </AnimatedButton>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
