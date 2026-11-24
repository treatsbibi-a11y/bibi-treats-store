import { S3Client, PutObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';

const accountId = process.env.CLOUDFLARE_ACCOUNT_ID || '4e1feb4e65dce0b8f09e0b1d31a5c90f';
const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || 'fd4b7ef65cadd7a9e87a01176621985e';
const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || 'd2okSfSt2C2Def4x';
const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME || 'bibi-treats-assets';

export const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
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
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: cleanKey,
    Body: body,
    ContentType: contentType,
    CacheControl: 'public, max-age=31536000, immutable',
  });

  return await r2Client.send(command);
}

/**
 * Delete a file from Cloudflare R2 bucket.
 */
export async function deleteFileFromR2(key: string) {
  const cleanKey = key.startsWith('/') ? key.substring(1) : key;
  const command = new DeleteObjectCommand({
    Bucket: bucketName,
    Key: cleanKey,
  });

  return await r2Client.send(command);
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
