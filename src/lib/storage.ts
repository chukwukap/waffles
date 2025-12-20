import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "./env";

// Railway Bucket Configuration (from env.ts)
const BUCKET_NAME = env.railwayBucketName || "";
const ACCESS_KEY = env.railwayBucketAccessKey || "";
const SECRET_KEY = env.railwayBucketSecretKey || "";
const ENDPOINT = env.railwayBucketEndpoint || "https://storage.railway.app";

// Create S3 Client for Railway Buckets
export const s3Client = new S3Client({
  endpoint: ENDPOINT,
  region: "auto", // Railway handles region automatically
  credentials: {
    accessKeyId: ACCESS_KEY,
    secretAccessKey: SECRET_KEY,
  },
  forcePathStyle: false, // Railway uses virtual-hosted style
});

// ==========================================
// UPLOAD
// ==========================================

export interface UploadOptions {
  key: string; // File path/name in bucket
  body: Buffer | Uint8Array | Blob | string;
  contentType: string;
  cacheControl?: string;
}

export async function uploadFile({
  key,
  body,
  contentType,
  cacheControl = "public, max-age=31536000", // 1 year cache by default
}: UploadOptions): Promise<{ url: string; key: string }> {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: body,
    ContentType: contentType,
    CacheControl: cacheControl,
  });

  await s3Client.send(command);

  // Construct public URL
  const url = `${ENDPOINT}/${BUCKET_NAME}/${key}`;

  return { url, key };
}

// ==========================================
// PRESIGNED UPLOAD URL
// ==========================================

export interface PresignedUploadOptions {
  key: string;
  contentType: string;
  expiresIn?: number; // seconds, default 1 hour
}

export async function getPresignedUploadUrl({
  key,
  contentType,
  expiresIn = 3600,
}: PresignedUploadOptions): Promise<{ uploadUrl: string; publicUrl: string }> {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn });
  const publicUrl = `${ENDPOINT}/${BUCKET_NAME}/${key}`;

  return { uploadUrl, publicUrl };
}

// ==========================================
// PRESIGNED DOWNLOAD URL
// ==========================================

export async function getPresignedDownloadUrl(
  key: string,
  expiresIn = 3600
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  return getSignedUrl(s3Client, command, { expiresIn });
}

// ==========================================
// LIST FILES
// ==========================================

export interface FileInfo {
  key: string;
  url: string;
  size: number;
  lastModified: Date;
  contentType?: string;
}

export async function listFiles(prefix = ""): Promise<FileInfo[]> {
  const command = new ListObjectsV2Command({
    Bucket: BUCKET_NAME,
    Prefix: prefix,
  });

  const response = await s3Client.send(command);

  if (!response.Contents) {
    return [];
  }

  return response.Contents.map((item) => ({
    key: item.Key || "",
    url: `${ENDPOINT}/${BUCKET_NAME}/${item.Key}`,
    size: item.Size || 0,
    lastModified: item.LastModified || new Date(),
  }));
}

// ==========================================
// GET FILE METADATA
// ==========================================

export async function getFileMetadata(key: string): Promise<{
  contentType: string;
  size: number;
  lastModified: Date;
} | null> {
  try {
    const command = new HeadObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    const response = await s3Client.send(command);

    return {
      contentType: response.ContentType || "application/octet-stream",
      size: response.ContentLength || 0,
      lastModified: response.LastModified || new Date(),
    };
  } catch {
    return null;
  }
}

// ==========================================
// DELETE FILE
// ==========================================

export async function deleteFile(key: string): Promise<boolean> {
  try {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    await s3Client.send(command);
    return true;
  } catch (error) {
    console.error("[Storage] Delete error:", error);
    return false;
  }
}

// ==========================================
// HELPERS
// ==========================================

/**
 * Generate a unique file key with timestamp and random string
 */
export function generateFileKey(
  originalName: string,
  folder = "uploads"
): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const ext = originalName.split(".").pop() || "";
  const baseName = originalName.replace(/\.[^/.]+$/, "").slice(0, 50);
  const safeName = baseName.replace(/[^a-zA-Z0-9-_]/g, "_");

  return `${folder}/${timestamp}-${random}-${safeName}.${ext}`;
}

/**
 * Check if bucket is configured
 */
export function isBucketConfigured(): boolean {
  return Boolean(BUCKET_NAME && ACCESS_KEY && SECRET_KEY);
}

/**
 * Get bucket name (for debugging)
 */
export function getBucketName(): string {
  return BUCKET_NAME;
}
