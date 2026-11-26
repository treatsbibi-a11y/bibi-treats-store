import { S3Client } from '@aws-sdk/client-s3';
import { deleteR2Object, putR2Object } from './d1-remote';

const accountId = process.env.CLOUDFLARE_ACCOUNT_ID || '';
const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || '';
const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || '';
const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME || 'bibi-treats-assets';

export const r2Client = new S3Client({
  region: 'auto',
  endpoint: accountId ? `https://${accountId}.r2.cloudflarestorage.com` : undefined,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

/**
 * Upload a file directly to Cloudflare R2 bucket.
 * Matches Frontend upload formats (products, slips, logos).
 */
export async function uploadFileToR2(
  key: string,
  body: Buffer | Uint8Array,
  contentType: string
) {
  const cleanKey = key.startsWith('/') ? key.substring(1) : key;
  const uint8 = body instanceof Uint8Array ? body : new Uint8Array(body);
  return await putR2Object(cleanKey, uint8, contentType);
}

/**
 * Delete a file from Cloudflare R2 bucket.
 */
export async function deleteFileFromR2(key: string) {
  const cleanKey = key.startsWith('/') ? key.substring(1) : key;
  return await deleteR2Object(cleanKey);
}

/**
 * Resolve public or proxy URL for an asset key.
 */
export function getR2AssetUrl(key: string): string {
  const cleanKey = key.startsWith('/') ? key.substring(1) : key;
  // If custom R2 domain or Cloudflare Pages/Workers routing is configured:
  if (process.env.NEXT_PUBLIC_R2_CUSTOM_DOMAIN) {
    return `https://${process.env.NEXT_PUBLIC_R2_CUSTOM_DOMAIN}/${cleanKey}`;
  }
  // Fallback to internal application proxy route:
  return `/${cleanKey}`;
}
