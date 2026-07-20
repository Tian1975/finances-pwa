import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Netlify serveix des de l'arrel del domini (app.netlify.app/),
  // a diferència de GitHub Pages que necessitaria una subruta.
  base: '/',
});
