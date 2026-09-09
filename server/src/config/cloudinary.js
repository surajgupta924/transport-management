import { env } from './env.js';

let cloudinary = null;

export function isCloudinaryConfigured() {
  return Boolean(env.cloudinary.cloudName && env.cloudinary.apiKey && env.cloudinary.apiSecret);
}

export async function getCloudinary() {
  if (!isCloudinaryConfigured()) return null;
  if (cloudinary) return cloudinary;

  const mod = await import('cloudinary');
  cloudinary = mod.v2;
  cloudinary.config({
    cloud_name: env.cloudinary.cloudName,
    api_key: env.cloudinary.apiKey,
    api_secret: env.cloudinary.apiSecret,
  });
  return cloudinary;
}
