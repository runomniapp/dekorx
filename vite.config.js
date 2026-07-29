import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Üretimde /api/render Vercel serverless function olarak çalışır. Yerelde de
// aynı handler'ı dev sunucusuna bağlayarak tek bir uygulama kodu kullanırız.
const apiDevServer = (mode) => ({
  name: 'dekorx-api-dev',
  configureServer(server) {
    // .env.local içindeki sunucu tarafı sırları process.env'e taşı
    // (VITE_ öneki olmadığı için istemci paketine ASLA gömülmez)
    const env = loadEnv(mode, process.cwd(), '');
    const serverSideKeys = [
      'OPENROUTER_API_KEY', 'open_router_api_key', 'OPEN_ROUTER_API_KEY', 'OPENROUTER_MODEL',
      'AISTUDIO_API_KEY', 'aistudio_api_key', 'AISTUDIO_MODEL',
      'RENDER_PROVIDER'
    ];
    for (const key of serverSideKeys) {
      if (env[key] && !process.env[key]) process.env[key] = env[key];
    }

    // Geliştirme kolaylığı: üretilen görseli diske yazar. Yalnızca dev
    // sunucusunda tanımlı olduğu için üretimde erişilebilir değil.
    server.middlewares.use('/api/_debug-save', async (req, res, next) => {
      if (req.method !== 'POST') return next();
      try {
        const chunks = [];
        for await (const c of req) chunks.push(c);
        const { name = 'render.png', dataUrl = '' } = JSON.parse(Buffer.concat(chunks).toString('utf8'));
        const b64 = dataUrl.split(',')[1] || '';
        const { mkdirSync, writeFileSync } = await import('node:fs');
        mkdirSync('.debug', { recursive: true });
        writeFileSync(`.debug/${name.replace(/[^\w.-]/g, '')}`, Buffer.from(b64, 'base64'));
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ ok: true, bytes: Math.round(b64.length * 0.75) }));
      } catch (err) {
        res.statusCode = 500;
        res.end(JSON.stringify({ ok: false, error: String(err?.message || err) }));
      }
    });

    server.middlewares.use('/api/render', async (req, res, next) => {
      if (req.method !== 'POST') return next();
      try {
        // Her istekte taze içe alım: handler'ı düzenlerken sunucuyu yeniden
        // başlatmak gerekmesin
        const mod = await server.ssrLoadModule('/api/render.js');
        await mod.default(req, res);
      } catch (err) {
        server.config.logger.error(`[api/render] ${err?.stack || err}`);
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify({ code: 'HANDLER_CRASH', error: String(err?.message || err) }));
      }
    });
  }
});

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss(), apiDevServer(mode)],
  server: {
    port: 5173,
    host: true
  }
}));
