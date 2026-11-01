import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { apiRequest } from '../services/api';
import { initialPortfolioContent } from '../data/portfolioData';

const copySeedContent = () => structuredClone(initialPortfolioContent);

function mergePortfolioContent(data = {}) {
  const seed = initialPortfolioContent;
  const navLinks = Array.isArray(data.navLinks) ? data.navLinks.map((link) => ({ ...link })) : copySeedContent().navLinks;
  const presentNavIds = new Set(navLinks.map((link) => link.id));
  const missingSectionLinks = seed.navLinks.filter((link) => !presentNavIds.has(link.id));
  const contactIndex = navLinks.findIndex((link) => link.id === 'contact');
  navLinks.splice(contactIndex < 0 ? navLinks.length : contactIndex, 0, ...missingSectionLinks);
  navLinks.forEach((link, index) => { link.order = index + 1; });

  return {
    ...copySeedContent(),
    ...data,
    site: { ...seed.site, ...(data.site && typeof data.site === 'object' ? data.site : {}) },
    navLinks,
    socials: Array.isArray(data.socials) ? data.socials : [],
    about: data.about === null ? null : data.about && typeof data.about === 'object'
      ? { ...seed.about, ...data.about }
      : copySeedContent().about,
    skillGroups: Array.isArray(data.skillGroups) ? data.skillGroups : copySeedContent().skillGroups,
    projects: Array.isArray(data.projects) ? data.projects : [],
    featured: data.featured === null ? null : data.featured && typeof data.featured === 'object'
      ? { ...seed.featured, ...data.featured }
      : copySeedContent().featured,
    experience: Array.isArray(data.experience) ? data.experience : [],
    testimonials: Array.isArray(data.testimonials) ? data.testimonials : [],
    contactTypes: Array.isArray(data.contactTypes) ? data.contactTypes : copySeedContent().contactTypes,
    footer: { ...seed.footer, ...(data.footer && typeof data.footer === 'object' ? data.footer : {}) },
  };
}

const PortfolioContext = createContext(null);

export function PortfolioProvider({ children }) {
  // Public content comes from the API; do not make an outage look like saved data.
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const initialLoadStarted = useRef(false);
  const retryState = useRef({ active: false, attempts: 0, timer: null, inFlight: false });

  const refreshPortfolio = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const result = await apiRequest('/portfolio');
      setContent(mergePortfolioContent(result));
      setLoadError('');
      retryState.current.attempts = 0;
      if (retryState.current.timer) clearTimeout(retryState.current.timer);
      retryState.current.timer = null;
      return true;
    } catch (cause) {
      setLoadError('Saved portfolio content could not be loaded. Please try again shortly.');
      console.warn('Portfolio API is unavailable; saved portfolio content was not loaded.', cause.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (window.location.pathname.startsWith('/admin')) {
      setLoading(false);
      return;
    }
    const state = retryState.current;
    state.active = true;
    const attempt = async () => {
      state.inFlight = true;
      const connected = await refreshPortfolio();
      state.inFlight = false;
      if (connected || !state.active) return;
      const delay = Math.min(3000 * (2 ** state.attempts), 60000);
      state.attempts += 1;
      state.timer = window.setTimeout(() => {
        state.timer = null;
        attempt();
      }, delay);
    };
    if (!initialLoadStarted.current) {
      initialLoadStarted.current = true;
      attempt();
    } else if (!state.inFlight && !state.timer) {
      attempt();
    }
    return () => {
      state.active = false;
      if (state.timer) clearTimeout(state.timer);
      state.timer = null;
    };
  }, [refreshPortfolio]);

  useEffect(() => {
    const onStorage = (event) => {
      if (event.key === 'shubham-portfolio-updated') refreshPortfolio();
    };
    window.addEventListener('storage', onStorage);
    let channel;
    try {
      channel = new BroadcastChannel('shubham-portfolio-content');
      channel.onmessage = () => refreshPortfolio();
    } catch { /* storage event remains as the cross-tab fallback */ }
    return () => {
      window.removeEventListener('storage', onStorage);
      channel?.close();
    };
  }, [refreshPortfolio]);
  const value = useMemo(() => ({ content, loading, loadError, refreshPortfolio }), [content, loading, loadError, refreshPortfolio]);
  return <PortfolioContext.Provider value={value}>{children}</PortfolioContext.Provider>;
}

export function usePortfolio() {
  const context = useContext(PortfolioContext);
  if (!context) throw new Error('usePortfolio must be used inside PortfolioProvider.');
  return context;
}
