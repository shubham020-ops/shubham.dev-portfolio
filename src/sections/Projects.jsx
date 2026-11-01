import { useRef } from 'react';
import { useGSAP } from '../animations/gsapConfig';
import { batchReveal, motion } from '../animations/animationHelpers';
import ProjectCard from '../components/ProjectCard';
import ProjectSlider from '../components/ProjectSlider';
import SectionHeading from '../components/SectionHeading';
import { usePortfolio } from '../context/PortfolioContext';

export default function Projects() {
  const { content } = usePortfolio();
  const { projects } = content;
  const ref = useRef(null);
  const [lead, ...rest] = projects;

  useGSAP(
    () => {
      const root = ref.current;
      const mm = motion(() => {
        batchReveal(root, '[data-reveal]', { y: 60, stagger: 0.12 });
      });
      return () => mm.revert();
    },
    { scope: ref }
  );

  return (
    <section id="projects" ref={ref} aria-labelledby="projects-title" className="section">
      <div className="container-x">
        {projects.length === 0 ? (
          <>
            <SectionHeading number="03" eyebrow="Selected work" title="Projects that move." id="projects-title" />
            <div data-reveal className="panel mt-10 flex flex-col gap-5 p-6 sm:p-8 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="eyebrow text-lime">Portfolio update in progress</p>
                <h3 className="mt-3 font-display text-xl font-bold sm:text-2xl">Selected work will appear here soon.</h3>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">Projects ko Admin panel mein add aur publish karte hi yeh section automatically update ho jayega.</p>
              </div>
              <a href="#contact" className="btn btn-ghost shrink-0">Discuss a project</a>
            </div>
          </>
        ) : (
          <>
            <div className="grid items-start gap-10 lg:grid-cols-[1fr_1.15fr]">
              <div>
                <SectionHeading number="03" eyebrow="Selected work" title="Projects that move." id="projects-title" />
                <p data-reveal className="mt-8 max-w-md text-lg leading-relaxed text-muted">
                  Open a project to explore its details, technologies, live demo and source.
                </p>
                <p data-reveal className="eyebrow mt-8">{String(projects.length).padStart(2, '0')} projects</p>
              </div>
              <div data-reveal><ProjectCard project={lead} variant="feature" /></div>
            </div>

            {rest.length > 0 && (
              <>
                <div className="my-14 h-px bg-line" aria-hidden="true" />
                <div data-reveal>
                  <h3 className="display mb-8 text-2xl md:text-3xl">More work</h3>
                  <ProjectSlider items={rest} />
                </div>
              </>
            )}
          </>
        )}
      </div>
    </section>
  );
}
