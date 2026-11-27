import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

if (!process.env.CLOUDFLARE_API_TOKEN && !process.env.CF_PAGES) {
  try {
    const candidates = [
      path.join(
        process.env.APPDATA || path.join(os.homedir(), '.config'),
        'xdg.config',
        '.wrangler',
        'config',
        'default.toml'
      ),
      path.join(os.homedir(), '.wrangler', 'config', 'default.toml'),
    ];
    const wranglerConfig = candidates.find((p) => fs.existsSync(p));
    if (wranglerConfig) {
      const toml = fs.readFileSync(wranglerConfig, 'utf8');
      const tokenMatch = toml.match(/^oauth_token\s*=\s*"([^"]+)"/m);
      const refreshMatch = toml.match(/^refresh_token\s*=\s*"([^"]+)"/m);
      if (tokenMatch?.[1]) {
        process.env.CF_D1_REMOTE_TOKEN = tokenMatch[1];
      }
      if (refreshMatch?.[1]) {
        process.env.CF_D1_REFRESH_TOKEN = refreshMatch[1];
      }
    }
  } catch {
    // Ignore if wrangler config is unavailable
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'X-XSS-Protection', value: '0' },
          { key: 'Content-Security-Policy', value: "frame-ancestors 'self'" },
        ],
      },
    ];
  },
};

export default nextConfig;
