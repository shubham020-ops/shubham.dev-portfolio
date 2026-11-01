import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import 'lenis/dist/lenis.css';
import 'swiper/css';
import 'swiper/css/effect-creative';
import './styles/index.css';
import App from './App.jsx';
import { PortfolioProvider } from './context/PortfolioContext.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <PortfolioProvider>
      <App />
    </PortfolioProvider>
  </StrictMode>
);
