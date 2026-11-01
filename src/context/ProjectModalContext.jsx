import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const ProjectModalContext = createContext({ activeId: null, open: () => {}, close: () => {} });

export function ProjectModalProvider({ children }) {
  const [activeId, setActiveId] = useState(null);
  const open = useCallback((id) => setActiveId(id), []);
  const close = useCallback(() => setActiveId(null), []);
  const value = useMemo(() => ({ activeId, open, close }), [activeId, open, close]);
  return <ProjectModalContext.Provider value={value}>{children}</ProjectModalContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export const useProjectModal = () => useContext(ProjectModalContext);
