import fs from 'fs';
import os from 'os';
import path from 'path';

const WRANGLER_CLIENT_ID = '54d11594-84e4-41aa-b438-e81b8fa78ee7';

const candidates = [
  path.join(os.homedir(), 'AppData', 'Roaming', 'xdg.config', '.wrangler', 'config', 'default.toml'),
  path.join(os.homedir(), '.wrangler', 'config', 'default.toml'),
];

const tomlPath = candidates.find((p) => fs.existsSync(p));
if (!tomlPath) {
  console.log('[sync-wrangler-env] No wrangler default.toml found; keeping existing .env');
  process.exit(0);
}

let toml = fs.readFileSync(tomlPath, 'utf8');
let oauthToken = toml.match(/^oauth_token\s*=\s*"([^"]+)"/m)?.[1];
let refreshToken = toml.match(/^refresh_token\s*=\s*"([^"]+)"/m)?.[1];
const expStr = toml.match(/^expiration_time\s*=\s*"([^"]+)"/m)?.[1];

const isExpired = !expStr || Number.isNaN(Date.parse(expStr)) || Date.parse(expStr) - Date.now() < 5 * 60 * 1000;

if (isExpired && refreshToken) {
  try {
    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: WRANGLER_CLIENT_ID,
    });
    const res = await fetch('https://dash.cloudflare.com/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });
    if (res.ok) {
      const json = await res.json();
      if (json?.access_token) {
        oauthToken = json.access_token;
        if (json.refresh_token) refreshToken = json.refresh_token;
        const newExp = new Date(Date.now() + (Number(json.expires_in) || 3600) * 1000).toISOString();
        toml = toml.replace(/^oauth_token\s*=\s*"[^"]*"/m, `oauth_token = "${oauthToken}"`);
        toml = toml.replace(/^refresh_token\s*=\s*"[^"]*"/m, `refresh_token = "${refreshToken}"`);
        toml = toml.replace(/^expiration_time\s*=\s*"[^"]*"/m, `expiration_time = "${newExp}"`);
        fs.writeFileSync(tomlPath, toml, 'utf8');
      }
    }
  } catch {
    // fallback to existing token
  }
}

if (!oauthToken) {
  console.log('[sync-wrangler-env] No oauth_token in default.toml; keeping existing .env');
  process.exit(0);
}

const envPath = path.join(process.cwd(), '.env');
if (!fs.existsSync(envPath)) {
  process.exit(0);
}

let envContent = fs.readFileSync(envPath, 'utf8');
const upsert = (content, key, value) => {
  const regex = new RegExp(`^${key}=.*$`, 'm');
  const line = `${key}="${value}"`;
  return regex.test(content) ? content.replace(regex, line) : `${content.trimEnd()}\n${line}\n`;
};

envContent = upsert(envContent, 'CF_D1_REMOTE_TOKEN', oauthToken);
if (refreshToken) {
  envContent = upsert(envContent, 'CF_D1_REFRESH_TOKEN', refreshToken);
}

fs.writeFileSync(envPath, envContent, 'utf8');
console.log('[sync-wrangler-env] Synced fresh Wrangler OAuth token into .env');
