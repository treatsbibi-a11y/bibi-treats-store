import { getRequestContext } from '@cloudflare/next-on-pages';
import { prisma } from './prisma';

export interface CloudflareD1PreparedResult<T = any> {
  results: T[];
  success: boolean;
}

export interface CloudflareD1BoundStatement {
  first<T = any>(): Promise<T | null>;
  all<T = any>(): Promise<CloudflareD1PreparedResult<T>>;
  run(): Promise<{ success: boolean; meta: any }>;
  raw<T = any>(options?: { columnNames?: boolean }): Promise<T[]>;
}

export interface CloudflareD1Binding {
  prepare(query: string): {
    bind(...values: any[]): CloudflareD1BoundStatement;
    first<T = any>(): Promise<T | null>;
    all<T = any>(): Promise<CloudflareD1PreparedResult<T>>;
    run(): Promise<{ success: boolean; meta: any }>;
    raw<T = any>(options?: { columnNames?: boolean }): Promise<T[]>;
  };
  batch?<T = any>(statements: any[]): Promise<T[]>;
}

const WRANGLER_CLIENT_ID = '54d11594-84e4-41aa-b438-e81b8fa78ee7';
let runtimeAccessToken: string | undefined;
let runtimeRefreshToken: string | undefined;
let refreshPromise: Promise<string | undefined> | null = null;

function getCurrentToken(): string | undefined {
  return runtimeAccessToken || process.env.CLOUDFLARE_API_TOKEN || process.env.CF_D1_REMOTE_TOKEN;
}

async function refreshWranglerOAuthToken(): Promise<string | undefined> {
  const refreshTok = runtimeRefreshToken || process.env.CF_D1_REFRESH_TOKEN;
  if (!refreshTok) return undefined;

  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const body = new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshTok,
          client_id: WRANGLER_CLIENT_ID,
        });
        const res = await fetch('https://dash.cloudflare.com/oauth2/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: body.toString(),
          cache: 'no-store',
        });
        if (!res.ok) return undefined;
        const json: any = await res.json();
        if (json?.access_token) {
          runtimeAccessToken = json.access_token;
          if (json.refresh_token) {
            runtimeRefreshToken = json.refresh_token;
          }
          return runtimeAccessToken;
        }
        return undefined;
      } catch {
        return undefined;
      } finally {
        refreshPromise = null;
      }
    })();
  }

  return refreshPromise;
}

async function executeLocalSqliteQuery(sql: string, params: any[]): Promise<{
  results: any[];
  meta: any;
  success: boolean;
}> {
  try {
    if (!prisma || typeof (prisma as any).$queryRawUnsafe !== 'function') {
      return { results: [], meta: {}, success: true };
    }
    const isSelect = /^\s*(SELECT|PRAGMA|EXPLAIN)\b/i.test(sql);
    if (isSelect) {
      const rows: any[] = await (prisma as any).$queryRawUnsafe(sql, ...(params || []));
      return { results: rows || [], meta: {}, success: true };
    } else {
      const count = await (prisma as any).$executeRawUnsafe(sql, ...(params || []));
      return { results: [], meta: { changes: count }, success: true };
    }
  } catch {
    return { results: [], meta: {}, success: false };
  }
}

async function executeRemoteD1Query(sql: string, params: any[], allowRefresh = true): Promise<{
  results: any[];
  meta: any;
  success: boolean;
}> {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID || '4e1feb4e65dce0b8f09e0b1d31a5c90f';
  const databaseId = process.env.CLOUDFLARE_D1_DATABASE_ID || '4ac8e95b-0102-404f-8555-341bd7e3ea97';
  let token = getCurrentToken();

  if (!token && allowRefresh && !process.env.CLOUDFLARE_API_TOKEN) {
    token = await refreshWranglerOAuthToken();
  }

  if (!token) {
    return executeLocalSqliteQuery(sql, params);
  }

  try {
    const res = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/query`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sql, params }),
        cache: 'no-store',
      }
    );

    let json: any = null;
    try {
      json = await res.json();
    } catch {
      json = null;
    }

    const isAuthError =
      res.status === 401 ||
      res.status === 403 ||
      json?.errors?.some((e: any) => {
        const msg = String(e?.message || '').toLowerCase();
        return (
          msg.includes('authentication') ||
          msg.includes('auth') ||
          msg.includes('token') ||
          e?.code === 10000
        );
      });

    if (isAuthError) {
      if (allowRefresh && !process.env.CLOUDFLARE_API_TOKEN) {
        const refreshed = await refreshWranglerOAuthToken();
        if (refreshed) {
          return executeRemoteD1Query(sql, params, false);
        }
      }
      return executeLocalSqliteQuery(sql, params);
    }

    if (!res.ok || !json?.success) {
      return executeLocalSqliteQuery(sql, params);
    }

    const firstResult = json.result?.[0];
    return {
      results: (firstResult?.results || []) as any[],
      meta: firstResult?.meta || {},
      success: Boolean(firstResult?.success ?? true),
    };
  } catch {
    return executeLocalSqliteQuery(sql, params);
  }
}

function createBoundStatement(sql: string, params: any[]): CloudflareD1BoundStatement & { __sql: string; __params: any[] } {
  return {
    __sql: sql,
    __params: params,
    async first<T = any>(): Promise<T | null> {
      const { results } = await executeRemoteD1Query(sql, params);
      return (results[0] as T) ?? null;
    },
    async all<T = any>(): Promise<CloudflareD1PreparedResult<T>> {
      const { results, success } = await executeRemoteD1Query(sql, params);
      return { results: results as T[], success };
    },
    async run() {
      const { success, meta } = await executeRemoteD1Query(sql, params);
      return { success, meta };
    },
    async raw<T = any>(options?: { columnNames?: boolean }): Promise<T[]> {
      const { results } = await executeRemoteD1Query(sql, params);
      if (options?.columnNames) {
        if (results.length === 0) {
          return [[] as any];
        }
        const cols = Object.keys(results[0]);
        const rows = results.map((row) => cols.map((c) => row[c]));
        return [cols as any, ...(rows as any)];
      }
      return results.map((row) => Object.values(row)) as T[];
    },
  };
}

let cachedRemoteBinding: CloudflareD1Binding | null = null;

export function createRemoteD1Binding(): CloudflareD1Binding | undefined {
  const token = getCurrentToken();
  const hasRefresh = Boolean(runtimeRefreshToken || process.env.CF_D1_REFRESH_TOKEN);
  if (!token && !hasRefresh) return undefined;

  if (!cachedRemoteBinding) {
    cachedRemoteBinding = {
      prepare(query: string) {
        const base = createBoundStatement(query, []);
        return {
          bind(...values: any[]) {
            return createBoundStatement(query, values);
          },
          first: base.first,
          all: base.all,
          run: base.run,
          raw: base.raw,
        };
      },
      async batch<T = any>(statements: any[]): Promise<T[]> {
        const out: any[] = [];
        for (const stmt of statements) {
          if (typeof stmt?.all === 'function') {
            out.push(await stmt.all());
          }
        }
        return out as T[];
      },
    };
  }
  return cachedRemoteBinding;
}

/**
 * Resolves the Cloudflare D1 binding:
 * 1. Native Cloudflare Pages/Workers binding (`getRequestContext().env.DB`) in production.
 * 2. Remote Cloudflare D1 HTTP API bridge on localhost (`next dev`) using Wrangler OAuth / API token.
 */
export function resolveD1Binding(): CloudflareD1Binding | undefined {
  try {
    const native = (getRequestContext()?.env as any)?.DB;
    if (native) return native as CloudflareD1Binding;
  } catch {
    // Outside Cloudflare Pages runtime (e.g. localhost next dev)
  }

  return createRemoteD1Binding();
}

function inferImageContentType(key: string): string {
  const lower = key.toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.gif')) return 'image/gif';
  if (lower.endsWith('.svg')) return 'image/svg+xml';
  return 'image/jpeg';
}

async function fetchR2ViaRestApi(
  cleanKey: string,
  allowRefresh = true
): Promise<{ bytes: Uint8Array; contentType: string } | null> {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID || '4e1feb4e65dce0b8f09e0b1d31a5c90f';
  const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME || 'bibi-treats-assets';
  let token = getCurrentToken();

  if (!token && allowRefresh && !process.env.CLOUDFLARE_API_TOKEN) {
    token = await refreshWranglerOAuthToken();
  }

  if (!token) {
    throw new Error('Missing Cloudflare token for R2 REST API.');
  }

  const encodedKey = cleanKey.split('/').map(encodeURIComponent).join('/');
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/r2/buckets/${bucketName}/objects/${encodedKey}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    }
  );

  if ((res.status === 401 || res.status === 403) && allowRefresh && !process.env.CLOUDFLARE_API_TOKEN) {
    const refreshed = await refreshWranglerOAuthToken();
    if (refreshed) {
      return fetchR2ViaRestApi(cleanKey, false);
    }
  }

  if (res.status === 404) {
    return null;
  }

  if (!res.ok) {
    throw new Error(`Cloudflare R2 REST Error: ${res.status} ${res.statusText}`);
  }

  const buf = await res.arrayBuffer();
  const rawCt = res.headers.get('content-type');
  const contentType =
    rawCt && rawCt !== 'application/octet-stream' ? rawCt : inferImageContentType(cleanKey);

  return { bytes: new Uint8Array(buf), contentType };
}

/**
 * Fetches an object from Cloudflare R2:
 * 1. Native Cloudflare Pages/Workers R2 binding (`getRequestContext().env.BUCKET.get`) in production.
 * 2. Cloudflare R2 REST API with Bearer token (auto-refreshing Wrangler OAuth token on 401/403).
 */
export async function fetchR2Object(
  key: string
): Promise<{ bytes: Uint8Array; contentType: string } | null> {
  const cleanKey = key.replace(/^\/+/, '');
  if (!cleanKey) return null;

  try {
    const bucket = (getRequestContext()?.env as any)?.BUCKET;
    if (bucket && typeof bucket.get === 'function') {
      const obj = await bucket.get(cleanKey);
      if (!obj) return null;
      const buf = await obj.arrayBuffer();
      const contentType = obj.httpMetadata?.contentType || inferImageContentType(cleanKey);
      return { bytes: new Uint8Array(buf), contentType };
    }
  } catch {
    // Outside Cloudflare Pages runtime (e.g. localhost next dev)
  }

  return fetchR2ViaRestApi(cleanKey);
}

async function putR2ViaRestApi(
  cleanKey: string,
  body: Uint8Array,
  contentType: string,
  allowRefresh = true
): Promise<void> {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID || '4e1feb4e65dce0b8f09e0b1d31a5c90f';
  const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME || 'bibi-treats-assets';
  let token = getCurrentToken();
  if (!token && allowRefresh && !process.env.CLOUDFLARE_API_TOKEN) {
    token = await refreshWranglerOAuthToken();
  }
  if (!token) {
    throw new Error('Missing Cloudflare R2/D1 token for upload');
  }

  const encodedKey = cleanKey.split('/').map(encodeURIComponent).join('/');
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/r2/buckets/${bucketName}/objects/${encodedKey}`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
      body: body as unknown as BodyInit,
      cache: 'no-store',
    }
  );

  if ((res.status === 401 || res.status === 403) && allowRefresh && !process.env.CLOUDFLARE_API_TOKEN) {
    const refreshed = await refreshWranglerOAuthToken();
    if (refreshed) {
      return putR2ViaRestApi(cleanKey, body, contentType, false);
    }
  }

  if (!res.ok) {
    const errText = await res.text().catch(() => res.statusText);
    throw new Error(`Cloudflare R2 Upload Error (${res.status}): ${errText}`);
  }
}

export async function putR2Object(
  key: string,
  body: Uint8Array,
  contentType: string
): Promise<void> {
  const cleanKey = key.replace(/^\/+/, '');
  if (!cleanKey) throw new Error('Invalid R2 object key');

  try {
    const bucket = (getRequestContext()?.env as any)?.BUCKET;
    if (bucket && typeof bucket.put === 'function') {
      await bucket.put(cleanKey, body, {
        httpMetadata: {
          contentType,
          cacheControl: 'public, max-age=31536000, immutable',
        },
      });
      return;
    }
  } catch {
    // Outside Cloudflare Pages runtime (e.g. localhost next dev)
  }

  await putR2ViaRestApi(cleanKey, body, contentType);
}

async function deleteR2ViaRestApi(cleanKey: string, allowRefresh = true): Promise<void> {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID || '4e1feb4e65dce0b8f09e0b1d31a5c90f';
  const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME || 'bibi-treats-assets';
  let token = getCurrentToken();

  if (!token && allowRefresh && !process.env.CLOUDFLARE_API_TOKEN) {
    token = await refreshWranglerOAuthToken();
  }

  if (!token) {
    throw new Error('Missing Cloudflare R2 binding (BUCKET) or token for delete');
  }

  const encodedKey = cleanKey.split('/').map(encodeURIComponent).join('/');
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/r2/buckets/${bucketName}/objects/${encodedKey}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    }
  );

  if ((res.status === 401 || res.status === 403) && allowRefresh && !process.env.CLOUDFLARE_API_TOKEN) {
    const refreshed = await refreshWranglerOAuthToken();
    if (refreshed) {
      return deleteR2ViaRestApi(cleanKey, false);
    }
  }

  if (!res.ok && res.status !== 404) {
    const errText = await res.text().catch(() => res.statusText);
    throw new Error(`Cloudflare R2 Delete REST Error (${res.status}): ${errText}`);
  }
}

export async function deleteR2Object(key: string): Promise<void> {
  const cleanKey = key.replace(/^\/+/, '');
  if (!cleanKey) return;

  try {
    const bucket = (getRequestContext()?.env as any)?.BUCKET;
    if (bucket && typeof bucket.delete === 'function') {
      await bucket.delete(cleanKey);
      return;
    }
  } catch {
    // Outside Cloudflare Pages runtime
  }

  await deleteR2ViaRestApi(cleanKey);
}
