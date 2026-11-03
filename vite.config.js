import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  const { VITE_BASE_PATH = '/' } = loadEnv(mode, process.cwd(), 'VITE_');

  return {
    // Hostinger serves this app from the domain root. Set VITE_BASE_PATH=/repo/ only
    // when intentionally deploying under a repository subpath (for example GitHub Pages).
    base: VITE_BASE_PATH,
    plugins: [react(), tailwindcss()],
    build: {
      chunkSizeWarningLimit: 1200,
      rollupOptions: {
        output: {
          manualChunks: {
            three: ['three', '@react-three/fiber', '@react-three/drei'],
            gsap: ['gsap', '@gsap/react'],
          },
        },
      },
    },
  };
});
