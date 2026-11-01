import { ArrowUpRight } from 'lucide-react';
import { useProjectModal } from '../context/ProjectModalContext';
import CoverArt from './CoverArt';

/**
 * variant="feature" — large editorial preview
 * variant="card"    — compact card used inside the slider
 */
export default function ProjectCard({ project, variant = 'card' }) {
  const { open } = useProjectModal();
  const feature = variant === 'feature';

  return (
    <article className="group panel relative flex h-full flex-col overflow-hidden transition-colors duration-500 hover:border-lime/60">
      <button
        type="button"
        onClick={() => open(project.id || project.recordId)}
        data-cursor="View Project"
        aria-label={`View details for ${project.title}`}
        className={`relative block w-full overflow-hidden ${feature ? 'aspect-[16/10]' : 'aspect-[4/3]'}`}
      >
        <CoverArt
          image={project.image}
          {...project.cover}
          alt={`Preview for ${project.title}`}
          className="h-full w-full object-cover object-center transition-transform duration-[900ms] ease-out group-hover:scale-105"
        />
        <span className="absolute left-4 top-4 rounded-full border border-line bg-ink/70 px-3 py-1 font-mono text-xs backdrop-blur">
          <span className="text-lime">{project.number}</span>
        </span>
        <span
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-0.5 origin-left scale-x-0 bg-lime transition-transform duration-700 group-hover:scale-x-100"
        />
      </button>

      <div className={`flex flex-1 flex-col gap-4 ${feature ? 'p-6 md:p-8' : 'p-5'}`}>
        <div>
          <p className="eyebrow flex flex-wrap items-center gap-2">
            {project.category}
          </p>
          <h3 className={`display mt-3 ${feature ? 'text-3xl md:text-4xl' : 'text-xl'}`}>{project.title}</h3>
        </div>
        <p className={`text-muted ${feature ? 'text-base' : 'text-sm'} leading-relaxed`}>{project.description}</p>
        <ul className="flex flex-wrap gap-2">
          {(project.tech || []).map((t) => (
            <li key={t} className="chip">
              {t}
            </li>
          ))}
        </ul>
        <div className="mt-auto flex flex-wrap items-center gap-x-5 gap-y-2 pt-2 text-sm font-semibold">
          <button
            type="button"
            onClick={() => open(project.id || project.recordId)}
            className="link-underline inline-flex items-center gap-1 text-lime"
          >
            Details <ArrowUpRight size={15} aria-hidden="true" />
          </button>
          {project.liveUrl && (
            <a
              href={project.liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="link-underline inline-flex items-center gap-1 hover:text-lime"
            >
              Live demo <ArrowUpRight size={15} aria-hidden="true" />
            </a>
          )}
          {project.repoUrl && (
            <a
              href={project.repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="link-underline inline-flex items-center gap-1 hover:text-lime"
            >
              Source <ArrowUpRight size={15} aria-hidden="true" />
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
