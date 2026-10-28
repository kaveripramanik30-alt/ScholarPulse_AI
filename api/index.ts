/**
 * ScholarPulse AI - Vercel Serverless Function Handler
 * Provides safe request routing, URL path restoration from edge rewrites,
 * and robust error handling so Lambda functions never exit with FUNCTION_INVOCATION_FAILED.
 */

import app from '../server';

export const config = {
  maxDuration: 60,
};

export default function handler(req: any, res: any) {
  try {
    const rawUrl: string = req.url || '';
    const matchedPath = req.headers['x-matched-path'] || req.headers['x-now-route-matches'];

    // 1. Restore actual destination path if Vercel edge rewrite mapped to /api
    if (typeof matchedPath === 'string' && matchedPath.startsWith('/api')) {
      req.url = matchedPath;
    } else if (req.query && req.query['0']) {
      // Vercel regex capture /api/(.*) -> req.query['0']
      const subpath = req.query['0'];
      const qIdx = rawUrl.indexOf('?');
      const qs = qIdx !== -1 ? rawUrl.slice(qIdx) : '';
      req.url = `/api/${subpath}${qs}`;
    } else if (rawUrl === '/api' || rawUrl === '/api/' || rawUrl.startsWith('/api?')) {
      const forwarded = req.headers['x-forwarded-uri'];
      if (typeof forwarded === 'string' && forwarded.startsWith('/api')) {
        req.url = forwarded;
      }
    }
  } catch (err) {
    console.warn('[Vercel Handler] URL normalization note:', err);
  }

  // 2. Delegate to Express app
  return (app as any)(req, res);
}
