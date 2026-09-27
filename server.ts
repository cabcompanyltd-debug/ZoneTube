import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import routes from './server/routes';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function createServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(cors());
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Mount backend API router under /api
  app.use('/api', routes);

  // Auto-import 100+ videos into General category on server start & daily cron
  try {
    const { fallbackImportXVideos } = await import('./server/xvideosDbImporter');
    await fallbackImportXVideos({ limit: 100, category: 'General' });
    console.log('Successfully auto-imported 100+ daily videos into General category on server start!');

    // Set up daily cron / interval (every 24 hours) to import 100 new videos into General category
    setInterval(async () => {
      try {
        console.log('Running daily cron job to import 100 new videos into General category...');
        await fallbackImportXVideos({ limit: 100, category: 'General' });
        console.log('Daily cron job completed: 100 new videos successfully imported into General category.');
      } catch (cronErr) {
        console.warn('Daily cron import error:', cronErr);
      }
    }, 24 * 60 * 60 * 1000);
  } catch (err) {
    console.warn('Auto-import General category notice:', err);
  }

  if (process.env.NODE_ENV !== 'production') {
    // In dev mode, mount Vite middleware
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // In production, serve static files from dist
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ZoneTube Server running on http://0.0.0.0:${PORT}`);
  });
}

createServer().catch((err) => {
  console.error('Server startup error:', err);
  process.exit(1);
});
