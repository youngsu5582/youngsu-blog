import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import * as fs from "fs";
import * as path from "path";

export type UploadedFile = { name: string; path: string; storage: "local" | "s3" };

export type UploadStorageConfig =
  | {
      kind: "local";
      uploadDir: string;
      publicPrefix: string;
    }
  | {
      kind: "s3";
      bucket: string;
      region: string;
      accessKeyId: string;
      secretAccessKey: string;
      endpoint?: string;
      forcePathStyle: boolean;
      uploadPrefix: string;
      publicBaseUrl: string;
    };

type Env = Record<string, string | undefined>;

const DEFAULT_LOCAL_PUBLIC_PREFIX = "/assets/img/uploads";
const DEFAULT_S3_UPLOAD_PREFIX = "blog/${year}/${month}/${day}";

function envValue(env: Env, ...names: string[]) {
  return names.map((name) => env[name]?.trim()).find(Boolean);
}

function requireEnv(value: string | undefined, name: string) {
  if (!value) throw new Error(`${name} 환경변수가 필요합니다`);
  return value;
}

export function getUploadStorageConfig(env: Env = process.env): UploadStorageConfig {
  const storage = (env.ADMIN_UPLOAD_STORAGE || "local").toLowerCase();

  if (storage !== "s3") {
    return {
      kind: "local",
      uploadDir: path.join(process.cwd(), "public/assets/img/uploads"),
      publicPrefix: DEFAULT_LOCAL_PUBLIC_PREFIX,
    };
  }

  const bucket = envValue(env, "S3_BUCKET", "S3_BUCKET_NAME", "AWS_S3_BUCKET");
  const region = envValue(env, "S3_REGION", "AWS_REGION", "AWS_DEFAULT_REGION");
  const accessKeyId = envValue(env, "S3_ACCESS_KEY_ID", "AWS_ACCESS_KEY_ID");
  const secretAccessKey = envValue(env, "S3_SECRET_ACCESS_KEY", "AWS_SECRET_ACCESS_KEY");
  const publicBaseUrl = envValue(env, "S3_PUBLIC_BASE_URL", "CLOUDFLARE_IMAGE_BASE_URL", "ADMIN_UPLOAD_PUBLIC_BASE_URL");

  return {
    kind: "s3",
    bucket: requireEnv(bucket, "S3_BUCKET"),
    region: requireEnv(region, "S3_REGION"),
    accessKeyId: requireEnv(accessKeyId, "S3_ACCESS_KEY_ID"),
    secretAccessKey: requireEnv(secretAccessKey, "S3_SECRET_ACCESS_KEY"),
    endpoint: envValue(env, "S3_ENDPOINT", "AWS_ENDPOINT_URL_S3"),
    forcePathStyle: envValue(env, "S3_FORCE_PATH_STYLE") === "true",
    uploadPrefix: envValue(env, "S3_UPLOAD_PREFIX", "ADMIN_UPLOAD_PREFIX") || DEFAULT_S3_UPLOAD_PREFIX,
    publicBaseUrl: normalizeBaseUrl(requireEnv(publicBaseUrl, "S3_PUBLIC_BASE_URL")),
  };
}

function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.replace(/\/+$/, "");
}

function cleanPrefix(prefix: string) {
  return prefix
    .split("/")
    .map((segment) => segment.trim())
    .filter(Boolean)
    .join("/");
}

export function resolveUploadObjectKey(prefix: string, filename: string, now = new Date()) {
  const basename = filename.replace(/\.[^.]+$/, "");
  const expandedPrefix = cleanPrefix(
    prefix
      .replaceAll("${year}", String(now.getUTCFullYear()))
      .replaceAll("${month}", String(now.getUTCMonth() + 1).padStart(2, "0"))
      .replaceAll("${day}", String(now.getUTCDate()).padStart(2, "0"))
      .replaceAll("${basename}", basename)
  );

  return expandedPrefix ? `${expandedPrefix}/${filename}` : filename;
}

export function buildUploadPublicUrl(publicBaseUrl: string, objectKey: string) {
  return `${normalizeBaseUrl(publicBaseUrl)}/${objectKey
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/")}`;
}

async function uploadToLocal(config: Extract<UploadStorageConfig, { kind: "local" }>, filename: string, buffer: Buffer, originalName: string): Promise<UploadedFile> {
  if (!fs.existsSync(config.uploadDir)) {
    fs.mkdirSync(config.uploadDir, { recursive: true });
  }

  const filepath = path.join(config.uploadDir, filename);
  fs.writeFileSync(filepath, buffer);

  return {
    name: originalName,
    path: `${config.publicPrefix}/${filename}`,
    storage: "local",
  };
}

async function uploadToS3(config: Extract<UploadStorageConfig, { kind: "s3" }>, filename: string, buffer: Buffer, contentType: string, originalName: string): Promise<UploadedFile> {
  const objectKey = resolveUploadObjectKey(config.uploadPrefix, filename);
  const client = new S3Client({
    region: config.region,
    endpoint: config.endpoint,
    forcePathStyle: config.forcePathStyle,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });

  await client.send(
    new PutObjectCommand({
      Bucket: config.bucket,
      Key: objectKey,
      Body: buffer,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000, immutable",
    })
  );

  return {
    name: originalName,
    path: buildUploadPublicUrl(config.publicBaseUrl, objectKey),
    storage: "s3",
  };
}

export async function uploadAdminImage(params: {
  filename: string;
  originalName: string;
  buffer: Buffer;
  contentType: string;
  config?: UploadStorageConfig;
}): Promise<UploadedFile> {
  const config = params.config || getUploadStorageConfig();

  if (config.kind === "s3") {
    return uploadToS3(config, params.filename, params.buffer, params.contentType, params.originalName);
  }

  return uploadToLocal(config, params.filename, params.buffer, params.originalName);
}
