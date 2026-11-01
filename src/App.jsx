import { ProjectModalProvider } from './context/ProjectModalContext';
import useSmoothScroll from './hooks/useSmoothScroll';
import CustomCursor from './components/CustomCursor';
import Footer from './components/Footer';
import Navbar from './components/Navbar';
import ProjectModal from './components/ProjectModal';
import About from './sections/About';
import Contact from './sections/Contact';
import Experience from './sections/Experience';
import FeaturedShowcase from './sections/FeaturedShowcase';
import Hero from './sections/Hero';
import Projects from './sections/Projects';
import Skills from './sections/Skills';
import Testimonials from './sections/Testimonials';
import { usePortfolio } from './context/PortfolioContext';
import AdminApp from './admin/AdminApp';
import { useEffect } from 'react';

function PublicPortfolio({ content, loading }) {
  useSmoothScroll();

  useEffect(() => {
    if (window.location.pathname.startsWith('/admin') || !content.site.seoTitle) return;
    document.title = content.site.seoTitle;
    let description = document.querySelector('meta[name="description"]');
    if (!description) {
      description = document.createElement('meta');
      description.name = 'description';
      document.head.append(description);
    }
    description.content = content.site.seoDescription || '';
    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (!ogTitle) { ogTitle = document.createElement('meta'); ogTitle.setAttribute('property', 'og:title'); document.head.append(ogTitle); }
    ogTitle.content = content.site.ogTitle || content.site.seoTitle;
    let ogDescription = document.querySelector('meta[property="og:description"]');
    if (!ogDescription) { ogDescription = document.createElement('meta'); ogDescription.setAttribute('property', 'og:description'); document.head.append(ogDescription); }
    ogDescription.content = content.site.ogDescription || content.site.seoDescription || '';
    let ogImage = document.querySelector('meta[property="og:image"]');
    if (!ogImage) { ogImage = document.createElement('meta'); ogImage.setAttribute('property', 'og:image'); document.head.append(ogImage); }
    ogImage.content = content.site.ogImage || '';
  }, [content.site.seoTitle, content.site.seoDescription, content.site.ogTitle, content.site.ogDescription, content.site.ogImage]);

  const navLinks = [...content.navLinks].sort((a, b) => Number(a.order || 0) - Number(b.order || 0)).filter((link) => {
    if (link.visible === false) return false;
    if (link.id === 'about') return Boolean(content.about);
    if (link.id === 'skills') return content.skillGroups.length > 0;
    if (link.id === 'projects') return true;
    if (link.id === 'showcase') return Boolean(content.featured?.visible !== false && content.featured);
    if (link.id === 'experience' || link.id === 'testimonials') return true;
    return link.id === 'contact';
  });

  return (
    <ProjectModalProvider>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      {loading && (
        <p role="status" className="fixed bottom-4 right-4 z-[80] rounded-full border border-line bg-surface px-4 py-2 text-xs text-muted">Loading portfolio…</p>
      )}
      <CustomCursor />
      <Navbar links={navLinks} />
      <main id="main">
        <Hero />
        {content.about && content.about.visible !== false && <About />}
        {content.skillGroups.length > 0 && <Skills />}
        <Projects />
        {content.featured && content.featured.visible !== false && <FeaturedShowcase />}
        <Experience />
        <Testimonials />
        <Contact />
      </main>
      <Footer links={navLinks} />
      <ProjectModal />
    </ProjectModalProvider>
  );
}

function PortfolioUnavailable({ loading, error, onRetry }) {
  return (
    <main className="grid min-h-screen place-items-center bg-ink px-5 text-fg">
      <section className="max-w-md text-center">
        <p className="eyebrow text-lime">shubham.dev</p>
        <h1 className="display mt-3 text-3xl">Portfolio temporarily unavailable</h1>
        <p role={loading ? 'status' : 'alert'} className="mt-3 text-sm text-muted">
          {loading ? 'Loading saved portfolio content…' : error}
        </p>
        <button type="button" className="btn btn-primary mt-6" onClick={onRetry} disabled={loading}>
          {loading ? 'Retrying…' : 'Try again'}
        </button>
      </section>
    </main>
  );
}

export default function App() {
  const { content, loading, loadError, refreshPortfolio } = usePortfolio();
  if (window.location.pathname.startsWith('/admin')) return <AdminApp />;
  if (!content) return <PortfolioUnavailable loading={loading} error={loadError} onRetry={refreshPortfolio} />;
  return <PublicPortfolio content={content} loading={loading} />;
}
