import { useRef } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { useGSAP } from '../animations/gsapConfig';
import { batchReveal, motion } from '../animations/animationHelpers';
import ContactForm from '../components/ContactForm';
import AnimatedButton from '../components/AnimatedButton';
import SectionHeading from '../components/SectionHeading';
import { usePortfolio } from '../context/PortfolioContext';

export default function Contact() {
  const { content } = usePortfolio();
  const { site, socials } = content;
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
    <section
      id="contact"
      ref={ref}
      aria-labelledby="contact-title"
      className="section pb-10 md:pb-12"
    >
      <div className="container-x">
        <SectionHeading number="06" eyebrow="Let's connect" title={site.contactHeading || "Let's connect."} id="contact-title" />
        <p data-reveal className="mt-6 max-w-xl text-lg text-muted">
          {site.contactDescription || 'Use the form to send a message.'}
        </p>

        <div className="mt-10 grid items-stretch gap-5 lg:grid-cols-[1.15fr_.85fr]">
          <div id="contact-form" className="panel min-w-0 p-6 sm:p-7 md:p-9" data-reveal>
            <ContactForm />
          </div>

          <aside
            className="panel flex min-w-0 flex-col justify-between gap-8 p-6 sm:p-7 md:p-9"
            data-reveal
            aria-labelledby="connect-panel-title"
          >
            <div>
              <p className="eyebrow text-lime">Open to good work</p>
              <h3 id="connect-panel-title" className="display mt-4 text-3xl md:text-4xl">Let's Connect</h3>
              <p className="mt-4 leading-relaxed text-muted">
                Clients, recruiters and collaborators — tell me what you are building, and let’s find a good way to work together.
              </p>
              <p className="mt-6 flex items-center gap-2 text-sm text-fg/90">
                <span className="relative flex h-2 w-2" aria-hidden="true">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-lime opacity-50" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-lime" />
                </span>
                {site.availability || 'Open to new conversations'}
              </p>
            </div>

            <div className="space-y-7">
              {site.email ? (
                <div>
                  <p className="eyebrow">Email</p>
                  <a href={`mailto:${site.email}`} className="link-underline mt-2 block break-all font-display text-lg font-bold sm:text-xl">
                    {site.email}
                  </a>
                  {site.responseNote && <p className="mt-3 text-sm leading-relaxed text-muted">{site.responseNote}</p>}
                </div>
              ) : (
                <p className="text-sm leading-relaxed text-muted">Use the form to share your project details and I’ll get back to you.</p>
              )}

              {socials.length > 0 && (
                <div>
                  <p className="eyebrow mb-3">Elsewhere</p>
                  <ul className="flex flex-wrap gap-x-5 gap-y-2">
                    {socials.map((social) => (
                      <li key={social.label}>
                        <a
                          href={social.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 font-medium transition-colors hover:text-lime"
                        >
                          {social.label}
                          <ArrowUpRight size={15} aria-hidden="true" />
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <AnimatedButton href={site.email ? `mailto:${site.email}` : '#contact-form'} variant="ghost">
                {site.email ? 'Email me directly' : 'Send a message'}
              </AnimatedButton>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
